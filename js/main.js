import { state, updateConfig, resetVenda } from './state.js';
import { getEngine } from './engines/engineManager.js';
import { UI } from './ui.js';
import * as utils from './utils.js'

let engine = getEngine(); 

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

    await engine.finalizarTransacao(); 
}
async function handleCancelarTransacao() {
    const engine = getEngine(); 

    await engine.cancelarTransacao(); 
}
async function handleEnviarCupom() {
    const engine = getEngine(); 

    await engine.enviarCupom(state.carrinho); 
}
async function handleCancelarCupom() {
    const engine = getEngine(); 

    await engine.cancelarCupom(); 
}

const fecharModais = () => {
    const modaisIds = [
        'modal-configuracoes', 
        'modal-detalhes-log', 
        'modal-cupom'
    ];
    modaisIds.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    });
};

document.addEventListener('click', (event) => {
    if (event.target.closest('.modal-close-btn')) {
        fecharModais();
    }
});

document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', fecharModais);
});

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
    const docOriginal = document.getElementById('input-doc-config').value;
    
    const eValido = utils.validarCPF(docOriginal) || utils.validarCNPJ(docOriginal);

    if (!eValido) {
        UI.registrarLog("Documento inválido!", "error");
        alert("Atenção!: Você não digitou um CPF ou CNPJ válido.");
        return;
    }

    const docLimpo = docOriginal.replace(/[^\d]+/g, '');

    updateConfig(
        document.getElementById('input-url-config').value,
        document.getElementById('input-token-config').value,
        docLimpo,
        document.querySelector('input[name="engine"]:checked').value || UI.exibirAlerta("Selecione uma Engine para continuar."),
        document.getElementById('input-user-config').value,
        document.getElementById('input-partnerCode-config').value,
        document.getElementById('input-paymentCode-config').value
    );
    document.getElementById('modal-configuracoes').style.display = 'none';
    UI.registrarLog("Configurações atualizadas", "success");
};
window.onclick = (event) => {
    if (event.target.id && event.target.id.startsWith('modal-')) {
        event.target.style.display = 'none';
    }
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
window.cancelarCupom = handleCancelarCupom;