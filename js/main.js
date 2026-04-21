import { state, updateConfig, resetVenda } from './state.js';
import { getEngine } from './engines/engineManager.js';
import { UI } from './ui.js';

async function handleIniciarTransacao() {
    const engine = getEngine(); 

    await engine.iniciarTransacao(); 
}

async function handleSubtotal() {
    const engine = getEngine(); 

    await engine.processarSubtotal(state.carrinho); 
}

async function handleFinalizarTransacao() {
    const engine = getEngine(); 

    await engine.finalizarTransacao(state.carrinho); 
}
async function handleCancelarTransacao() {
    const engine = getEngine(); 

    await engine.handleCancelarTransacao(state.carrinho); 
}
async function handleEnviarCupom() {
    const engine = getEngine(); 

    await engine.enviarCupom(state.carrinho); 
}

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
        document.getElementById('input-doc-config').value,
        document.querySelector('input[name="engine"]:checked').value
    );
    document.getElementById('modal-configuracoes').style.display = 'none';
    UI.registrarLog("Configurações atualizadas", "success");
};

document.getElementById('btn-iniciar-venda').onclick = handleIniciarTransacao;

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

window.enviarSubtotal = handleSubtotal;
window.enviarFinalizarTransacao = handleFinalizarTransacao;
window.enviarCancelarTransacao = handleCancelarTransacao;
window.enviarCupom = handleEnviarCupom;