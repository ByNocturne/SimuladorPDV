import { state, updateConfig, resetVenda } from './state.js';
import { ApiService } from './api.js';
import { UI } from './ui.js';

// --- Lógica de Negócio ---

async function handleStart() {
    try {
        const { res, payload } = await ApiService.start();
        const data = await res.json();
        
        if (res.ok) {
            const statusLog = res.ok ? 'success' : 'error';
            state.transactionId = data.transaction_id; 

            state.vendaIniciada = true

            UI.registrarLog("API START", statusLog, { request: payload, response: data });

            if (data.should_display_message) {
                UI.abrirModalMensagem(data.message.text, data.message, handleMessage);
            }
        } else {
            UI.registrarLog("API START", 'error', { request: payload, response: data });
        }
    } catch (e) { 
        UI.registrarLog("Erro antes da comunicação com a API", 'error', { erro: e.message }); 
    }
}

async function handleMessage(tag, value) {
    try {
        const { res, payload } = await ApiService.message(tag, value);
        const data = await res.json();

        if (res.ok) {
            const statusLog = res.ok ? 'success' : 'error';

            UI.registrarLog("API MESSAGE", statusLog, { request: payload, response: data });

            if ( data.should_display_message) {
                UI.abrirModalMensagem(data.message.text, data.message, handleMessage);
            } else if (state.vendaFechada) {
                handleApply();
            } 
        } else {
            UI.registrarLog("API MESSAGE", 'error', { request: payload, response: data });
        }
    } catch (e) { 
        UI.registrarLog("Erro antes da comunicação com a API", 'error', { erro: e.message });  
    }
}

async function handlePreApply() {
    state.vendaFechada = true;

    const itens = state.carrinho.map(i => ({
    ean: i.ean, sku: i.sku, quantity: i.qtd, packing_quantity: 1, total_value: i.preco
    }));

    if(state.vendaIniciada === false) {
        alert('Venda não iniciada')
        return
    }

    try {
        const { res, payload } = await ApiService.preApply(itens);
        const data = await res.json();

        if (res.ok) {
            const statusLog = res.ok ? 'success' : 'error';

            UI.registrarLog("API PRE-APPLY", statusLog, { request: payload, response: data });

            if (data.should_display_message) {
                UI.abrirModalMensagem(data.message.text, data.message, handleMessage);
            }
        } else {
            UI.registrarLog("API PRE-APPLY", 'error', { request: payload, response: data });
        }
    } catch (e) {
        UI.registrarLog("Erro antes da comunicação com a API", 'error', { erro: e.message });  

    }
}

async function handleApply() {
    try {
        const { res, payload } = await ApiService.apply();
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

async function handleConfirm() {
    try {
        const { res, payload } = await ApiService.confirm();
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

async function handleCancel() {
    try {
        const { res, payload } = await ApiService.cancel();
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

async function handleCupom() {

    const itens = state.carrinho.map(i => ({
        "department": "",
        "ean": i.ean,
        "family": "",
        "group": "",
        "packing_quantity": 1,
        "product_name": i.sku,
        "quantity": i.qtd,
        "section": "",
        "sku": i.sku,
        "subgroup": "",
        "total_value": i.preco,
        "total_value_with_discount": i.precoComDesconto,
        "unit_value": i.precoUnitario
    }));

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
        const { res, payload } = await ApiService.cupom(itens, pagamentos);
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

// --- Inicialização e Eventos ---

document.addEventListener('DOMContentLoaded', () => {
    UI.renderizarCarrinho();
    UI.registrarLog("Simulador carregado com sucesso","INFO");
    0.123
    // Inputs Config
    document.getElementById('input-url-config').value = state.urlBase;
    document.getElementById('input-token-config').value = state.token;
    document.getElementById('input-doc-config').value = state.documentNo;
});

// Event Listeners Globais
window.alternarView = UI.alternarView; 
window.abrirConfiguracoes = () => document.getElementById('modal-configuracoes').style.display = 'flex';

document.getElementById('btn-confirmar-config').onclick = () => {
    updateConfig(
        document.getElementById('input-url-config').value,
        document.getElementById('input-token-config').value,
        document.getElementById('input-doc-config').value
    );
    document.getElementById('modal-configuracoes').style.display = 'none';
    UI.registrarLog("Configurações atualizadas", "success");
};

document.getElementById('btn-iniciar-venda').onclick = handleStart;

window.adicionarProdutoManualmente = () => {
    const sku = document.getElementById('input-sku').value;
    const ean = document.getElementById('input-ean').value;

    const qtd = parseFloat(document.getElementById('input-qtd').value) || 0;
    const valor = parseFloat(document.getElementById('input-valor').value) || 0;

    if (sku && ean && qtd > 0) {
        state.carrinho.push({ 
            sku, 
            ean, 
            qtd, 
            preco: valor, 
            descontoItens: 0, 
            precoComDesconto: valor, 
            descontoItemRateio: 0,
            precoUnitario: valor / qtd
        });
        UI.renderizarCarrinho();
    }
};

const engineSelecionada = document.querySelector('input[name="engine"]:checked').value;

window.enviarPreApply = handlePreApply;
window.enviarConfirm = handleConfirm;
window.enviarCancel = handleCancel;
window.enviarCupom = handleCupom;