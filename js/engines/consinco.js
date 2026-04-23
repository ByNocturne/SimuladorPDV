import { state } from '../state.js';
import { UI } from '../ui.js';
//import { getEngine } from './engineManager.js';

async function request(endpoint, method = 'POST', body = null) {
    const tokenConsinco = btoa(`${state.userConsinco}:${state.token}`);
    
    const headers = {
        'Authorization': `Bearer ${tokenConsinco}`,
        'Content-Type': 'application/json'
    };
    
    const response = await fetch(`${state.urlBase}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });
    
    return response;
}

export async function iniciarTransacao() {
    state.transactionIdConsinco = crypto.randomUUID();
    state.agora = new Date();
    state.dataHoraConsinco = state.agora.toISOString().split('.')[0];
    state.dataConsinco = state.agora.toISOString().split('T')[0] + 'T00:00:00';

    const payload = {
    "Authenticator": null,
    "ClosedSale": null,
    "Event": "cetBefore",
    "Execution": "cetContinue",
    "ID": state.transactionIdConsinco,
    "Operation": "cotStartSale",
    "ParkingTicket": null,
    "Pay": null,
    "Response": "",
    "Sale": {
        "Discount": 0,
        "DiscountCodes": [],
        "DiscountNotApplied": 0,
        "Header": {
            "AccountingDate": state.dataConsinco,
            "CooDocument": 0,
            "DateTimeIssue": state.dataHoraConsinco,
            "IdDocument": 123,
            "IdInvoiceKey": "",
            "IdStore": 1,
            "IdSupervisor": 0,
            "IdTerminal": 1,
            "IdUser": 1,
            "Identification": [
                {
                    "IdentificationType": "citReward",
                    "Document": state.documentNo,
                    "DocumentType": "cdtCPF",
                    "PartnerCode": state.partnerCodeConsinco
                }
            ],
            "Status": "sttValid"
        },
        "ID": state.transactionIdConsinco,
        "Increase": 0,
        "Items": [],
        "Messages": {
            "Customer": [],
            "User": []
        },
        "NonTaxProduct": null,
        "Observation": "",
        "PartitionDiscount": [],
        "PartitionIncrease": [],
        "PartnerGroupItems": [],
        "PaymentChange": null,
        "Payments": [],
        "PreSales": [],
        "Print": null,
        "SolidaryChange": null,
        "TaxDocument": null,
        "Total": 0,
        "TotalSale": 0,
        "VouchersPrint": []
    },
    "UserAuthentication": null,
    "Version": 1
};
    
    try {
        const res = await request('/external/v2/consinco', 'POST', payload);
        const data = await res.json();
        
        if (res.ok) {
            const statusLog = res.ok ? 'success' : 'error';
            state.transactionId = data.transaction_id; 

            state.vendaIniciada = true

            UI.registrarLog("API START", statusLog, { request: payload, response: data });

            if (data.should_display_message) {
                UI.abrirModalMensagem(data.message.text, data.message, enviarMensagem);
            }
        } else {
            UI.registrarLog("API START", 'error', { request: payload, response: data });
        }
    } catch (e) { 
        UI.registrarLog("Erro antes da comunicação com a API", 'error', { erro: e.message }); 
    }
}
/*
export async function enviarMensagem(tag,value) {
    const payload = { 
            "input_value": value, 
            "tag": tag, 
            "transaction_id": state.transactionId 
        };
    
    try {
        const res = await request('/v2.2/transaction/message', 'POST', payload);
        const data = await res.json();

        if (res.ok) {
            const statusLog = res.ok ? 'success' : 'error';

            UI.registrarLog("API MESSAGE", statusLog, { request: payload, response: data });

            if (data.should_display_message) {
                UI.abrirModalMensagem(data.message.text, data.message, enviarMensagem);
            } else if (state.vendaFechada) {
                await aplicarDescontos();
            } else {
                state.vendaIniciada = true;
            }
        } else {
            UI.registrarLog("API MESSAGE", 'error', { request: payload, response: data });
        }
    } catch (e) { 
        UI.registrarLog("Erro antes da comunicação com a API", 'error', { erro: e.message });  
    }
}
*/


export async function processarSubtotal(itens) {

    const itensFormatados = itens.map((i, index) => ({
                "BarCode": i.ean,
                "CaptionPacking": "UN",
                "Description": i.sku,
                "DiscountPrice": 0.000000000000000,
                "IncreasePrice": 0.0000000000000000,
                "InternalCode": i.sku,
                "ItemNumber": index+1,
                "PackingQuantity": 1.0000000000000000,
                "PartitionDiscount": [],
                "PartitionIncrease": [],
                "Quantity": i.qtd,
                "SellerCode": 0,
                "Status": "sttValid",
                "IdSegment": 1,
                "OrderNumber": "",
                "TotalPrice": i.price,
                "UnitPrice": i.UnitPrice
            }));

    if(state.vendaIniciada === false) {
        alert('Venda não iniciada')
        return
    }

console.log(itensFormatados);

    const payload = {
        "Authenticator": null,
        "Event": "cetAfter",
        "Execution": "cetCompleted",
        "ID": state.transactionId,
        "Operation": "cotSubtotalSale",
        "ParkingTicket": null,
        "Pay": null,
        "Response": "ok",
        "Sale": {
            "Discount": 0.0000000000000000,
            "DiscountCodes": [],
            "Header": {
            "AccountingDate": state.dataConsinco,
            "cooDocument": 1234,
            "DateTimeIssue": state.dataHoraConsinco,
            "IdDocument": 123,
            "IdInvoiceKey": "",
            "cooDocument": 1234,
            "IdStore": 1,
            "IdSupervisor": 0,
            "IdTerminal": 1,
            "IdUser": 1,
            "Identification": [
                {
                "IdentificationType": "citReward",
                "Document": state.documentNo,
                "DocumentType": "cdtCPF",
                "PartnerCode": state.PartnerCodeConsinco
                }
            ],
            "Status": "sttValid"
            },
            "ID": state.transactionId,
            "Increase": 0.0000000000000000,
            "Items": itensFormatados,
            "Messages": {
            "Customer": [],
            "User": []
            },
            "PartitionDiscount": [],
            "PartitionIncrease": [],
            "PaymentChange": null,
            "Payments": [],
            "Print": null,
            "SolidaryChange": null,
            "TaxDocument": null,
            "Total": state.price,
            "VouchersPrint": []
        },
        "UserAuthentication": null,
        "Version": 1,
        "interpret": {
            "commandType": null,
            "options": {
            "title": null,
            "subtitle": null,
            "options": [],
            "response": []
            },
            "value": {
            "title": null,
            "subtitle": null,
            "dataType": null,
            "Size": null,
            "documentTypes": []
            },
            "vouchersPrint": {
            "text": []
            },
            "messageCommand": {
            "title": null,
            "text": null,
            "subtitle": null,
            "defaultButton": null,
            "messageType": null,
            "buttons": []
            }
        }
        };

console.log(payload);
    
    try {
        const res = await request('/external/v2/consinco', 'POST', payload);
        const data = await res.json();

        if (res.ok) {
            const statusLog = res.ok ? 'success' : 'error';

            state.vendaFechada = true;

            UI.registrarLog("API PRE-APPLY", statusLog, { request: payload, response: data });

            if (data.should_display_message) {
                UI.abrirModalMensagem(data.message.text, data.message, enviarMensagem);
            } else {
                await aplicarDescontos();
            }
        } else {
            UI.registrarLog("API PRE-APPLY", 'error', { request: payload, response: data });
        }
    } catch (e) {
        UI.registrarLog("Erro antes da comunicação com a API", 'error', { erro: e.message });  

    }
}   
/*
export async function aplicarDescontos() {
    const payload = {
        "transaction_id": state.transactionId
    };
    
    try {
        const res = await request('/v2.2/transaction/apply', 'POST', payload);
        const data = await res.json();

        if (res.ok) {
            const statusLog = res.ok ? 'success' : 'error';

            UI.registrarLog("API APPLY", statusLog, { request: payload, response: data });

            state.descontoFormaDePagamento = data?.payment_discount?.discount_value || 0;
            state.pagDinheiro = state.totalLiquido - state.descontoFormaDePagamento || 0;
            state.descontoRateio = data?.absolute?.discount_value || 0;

            state.carrinho = data.items.map(apiItem => ({
                sku: apiItem.sku,
                ean: apiItem.ean,
                qtd: parseFloat(apiItem.quantity) || 0,
                preco: parseFloat(apiItem.total_value_without_discount) || 0,
                descontoItens: parseFloat(apiItem.discount_value) || 0,
                precoComDesconto: parseFloat(apiItem.total_value_with_discount) || 0,
                descontoItemRateio: 0
            }));
            if (state.descontoRateio > 0) {
                const subtotal = state.carrinho.reduce((acc, i) => acc + i.precoComDesconto, 0);
                state.carrinho.forEach(item => {
                    const proporcao = item.precoComDesconto / subtotal;
                    item.descontoItemRateio = descontoRateio * proporcao;
                    item.precoComDesconto -= item.descontoItemRateio;
                });
            }
            UI.renderizarCarrinho();
        } else {
            UI.registrarLog("API APPLY", 'error', { request: payload, response: data });
        }
    } catch (e) {
        UI.registrarLog("API APPLY", 'error', { request: payload, response: data });
    }
}  

export async function finalizarTransacao() {
    const payload = {
        "transaction_id": state.transactionId
    };
    
    try {
        const res = await request('/v2.2/transaction/confirm', 'POST', payload);
        const data = await res.json();
        
        if (res.ok) {
            const statusLog = res.ok ? 'success' : 'error';

            UI.registrarLog("API CONFIRM", statusLog, { request: payload, response: data }); 

            const novoCupom = {
                transactionId: state.transactionId,
                data: new Date().toLocaleString('pt-BR'),
                totalGeral: state.totalGeral,
                somaDescontoItens: state.somaDescontoItens,
                descontoRateio: state.descontoRateio,
                descontoFormaDePagamento: state.descontoFormaDePagamento,
                somaDesconto: state.somaDesconto,
                totalLiquido: state.totalLiquido,
                carrinho: JSON.parse(JSON.stringify(state.carrinho)) // Cópia profunda
            };

            state.historicoCupons.push(novoCupom);

            UI.abrirModalCupom(novoCupom);       
        } else {
            UI.registrarLog("API CONFIRM", 'error', { request: payload, response: data });
        }
    } catch (e) {
        UI.registrarLog("API CONFIRM", 'error', { request: payload, response: data });
    }
}

export async function cancelarTransacao() {
    const payload = {
        "transaction_id": state.transactionId
    };
    
    try {
        const res = await request('/v2.2/transaction/cancel', 'POST', payload);
        const data = await res.json();

        if (res.ok) {
            const statusLog = res.ok ? 'success' : 'error';

            UI.registrarLog("API CANCEL", statusLog, { request: payload, response: data });   
        } else {
            UI.registrarLog("API CANCEL", 'error', { request: payload, response: data });
        }
    } catch (e) {
        UI.registrarLog("API CANCEL", 'error', { request: payload, response: data });
    }
}

export async function enviarCupom() {
    const agora = new Date();
    const dataFormatada = agora.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaFormatada = agora.toTimeString().split(' ')[0]; // HH:MM:SS

    const itensCupom = state.carrinho.map(item => ({
        sku: item.sku,
        ean: item.ean,
        quantity: item.qtd,
        product_name: item.sku,
        unit_value: item.precoUnitario,
        total_value: item.preco,
        total_value_with_discount: item.precoComDesconto
    }));

    let pagamentos = [];
    if (state.descontoFormaDePagamento > 0) {
        pagamentos = [
            { instalments: 1, payment_form: "cash", amount: state.pagDinheiro },
            { instalments: 1, payment_form: "cashback", amount: state.descontoFormaDePagamento }
        ];
    } else {
        pagamentos = [
            { payment_form: "cash", amount: state.totalLiquido }
        ];
    }

    const payload = {
        "transaction_id": state.transactionId,
        "client_id": state.documentNo,
        "coupon": state.transactionId, // Usando o ID da transação como número do cupom
        "date": dataFormatada,
        "time": horaFormatada,
        "items": itensCupom,
        "payments": pagamentos,
        "total_value": state.totalGeral,
        "total_value_with_discount": state.totalLiquido,
        "origin": "pdv",
        "pdv_code": "12A",
        "operator_id": "123"
    };

    try {
        const res = await request('/v2/coupons', 'POST', payload);
        const data = await res.json();

    if (res.ok) {
        const statusLog = res.ok ? 'success' : 'error';

        UI.registrarLog("API CUPOM", statusLog, { request: payload, response: data });   
    } else {
            UI.registrarLog("API CUPOM", 'error', { request: payload, response: data });
        }
    } catch (e) {
        UI.registrarLog("API CUPOM", 'error', { request: payload, response: data || "" });
    }
}*/