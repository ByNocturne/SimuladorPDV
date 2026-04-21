import { state } from '../state.js';
import { UI } from '../ui.js';
import { getEngine } from './engineManager.js';

async function request(endpoint, method = 'POST', body = null) {
    const headers = {
        'Authorization': `Bearer ${state.token}`,
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
    const payload = {
        "transaction_context": { "document_no": state.documentNo, "phone": "" },
        "transaction_id": ""
    };
    
    try {
        const res = await request('/v2.2/transaction/start', 'POST', payload);
        const data = await res.json();
        
        if (res.ok) {
            const statusLog = res.ok ? 'success' : 'error';
            state.transactionId = data.transaction_id; 

            state.vendaIniciada = true

            UI.registrarLog("API START", statusLog, { request: payload, response: data });

            if (data.should_display_message) {
                UI.abrirModalMensagem(data.message.text, data.message, handleEnviarMensagem);
            }
        } else {
            UI.registrarLog("API START", 'error', { request: payload, response: data });
        }
    } catch (e) { 
        UI.registrarLog("Erro antes da comunicação com a API", 'error', { erro: e.message }); 
    }
}

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
                UI.abrirModalMensagem(data.message.text, data.message, handleEnviarMensagem);
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

export async function processarSubtotal(itens) {

    const itensFormatados = itens.map(i => ({
        ean: i.ean, 
        sku: i.sku, 
        quantity: i.qtd, 
        packing_quantity: 1, 
        total_value: i.preco
    }));

    if(state.vendaIniciada === false) {
        alert('Venda não iniciada')
        return
    }

    const payload = {
        "items": itensFormatados,
        "origin": "pdv-simulator",
        "transaction_id": state.transactionId
    };
    
    try {
        const res = await request('/v2.2/transaction/pre-apply', 'POST', payload);
        const data = await res.json();

        if (res.ok) {
            const statusLog = res.ok ? 'success' : 'error';

            state.vendaFechada = true;

            UI.registrarLog("API PRE-APPLY", statusLog, { request: payload, response: data });

            if (data.should_display_message) {
                UI.abrirModalMensagem(data.message.text, data.message, handleEnviarMensagem);
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

            document.getElementById('btn-confirmar').onclick = handleConfirm;

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

export async function enviarCupom(itens,pagamentos) {
    const payload = {
        "client_id": state.documentNo,
        "coupon": state.transactionId,
        "date": "2020-01-01",
        "items": itens,
        "operator_id": "123",
        "origin": "pdv-simulator",
        "payments": pagamentos,
        "pdv_code": "12A",
        "time": "00:00:00",
        "total_value": state.totalGeral,
        "total_value_with_discount": state.totalLiquido,
        "transaction_id": state.transactionId
    };
    
    if (state.descontoFormaDePagamento > 0) {
        
        pagamentos = [
        {
            "acquirer_id": "",
            "acquirer_name": "",
            "amount": state.pagDinheiro,
            "authorizer_id": "",
            "authorizer_name": "",
            "instalments": 1,
            "payment_form": "cash"
        },
        {
            "acquirer_id": "",
            "acquirer_name": "",
            "amount": state.descontoFormaDePagamento,
            "authorizer_id": "",
            "authorizer_name": "",
            "instalments": 1,
            "payment_form": "cashback"
        }]
    } else {

         pagamentos = [
        {
            "acquirer_id": "",
            "acquirer_name": "",
            "amount": state.totalLiquido,
            "authorizer_id": "",
            "authorizer_name": "",
            "instalments": 1,
            "payment_form": "cash"
        }
    ]
    }
    ;

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
        UI.registrarLog("API CUPOM", 'error', { request: payload, response: data });
    }
}

async function handleEnviarMensagem() {
    const engine = getEngine(); 

    await engine.processarSubtotal(); 
}
