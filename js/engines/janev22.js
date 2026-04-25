import { state } from '../state.js';
import { UI } from '../ui.js';
import { getEngine } from './engineManager.js';

async function executarChamadaAPI(endpoint, method, payload, nomeOperacao) {
    const urlCompleta = state.urlBase + endpoint

    const headers = {
        'Authorization': `Bearer ${state.token}`,
        'Content-Type': 'application/json'
    };

    try {
        const res = await fetch(urlCompleta, 
                                {
                                    method: method,
                                    headers: headers,
                                    body: JSON.stringify(payload)
                                });
        const data = await res.json();

        if (res.ok) {
            UI.registrarLog(nomeOperacao, 'success', { request: payload, response: data }, endpoint);
            return data; // Devolve os dados para quem chamou decidir o que fazer
        } else {
            UI.registrarLog(nomeOperacao, 'error', { request: payload, response: data }, endpoint);
            UI.exibirAlerta(`Erro na operação ${nomeOperacao}`); // UX: Avisa o usuário
            return null;
        }
    } catch (e) {
        UI.registrarLog(nomeOperacao, 'error', { erro: e.message });
        UI.exibirAlerta("Falha de conexão com o servidor.");
        return null;
    }
}

export async function iniciarTransacao() {
    const payload = {
        "transaction_context": { "document_no": state.documentNo, "phone": "" },
        "transaction_id": ""
    };
    const endpoint = '/v2.2/transaction/start'
    const method = 'POST'
    const nomeOperacao = 'Iniciar Transação'

    const res = await executarChamadaAPI(endpoint, method, payload, nomeOperacao);

    state.transactionId = res.transaction_id

    if (res.should_display_message) {
        UI.abrirModalMensagem(res.message.text, res.message, enviarMensagem);
        state.vendaIniciada = true;
    }
}

export async function enviarMensagem(tag,value) {
    const payload = { 
            "input_value": value, 
            "tag": tag, 
            "transaction_id": state.transactionId 
        };
    const endpoint = '/v2.2/transaction/message'
    const method = 'POST'
    const nomeOperacao = 'Enviar resposta de Mensagem'

    const res = await executarChamadaAPI(endpoint, method, payload, nomeOperacao);
    
    if (res.should_display_message) {
        UI.abrirModalMensagem(res.message.text, res.message, enviarMensagem);
    } else if (state.vendaFechada) {
        await aplicarDescontos();
    } else {
        state.vendaIniciada = true;
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
        "origin": "pdv",
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
                UI.abrirModalMensagem(data.message.text, data.message, enviarMensagem);
            } else {
                await aplicarDescontos();
            }
        } else {
            UI.registrarLog("API PRE-APPLY", 'error', { request: payload, response: data });
        }
    } catch (e) {
        console.log("DEBUG - Objeto Final:", JSON.stringify(payload, null, 2));
        console.trace("Rastro de execução");
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
                    item.descontoItemRateio = state.descontoRateio * proporcao;
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
}