export let state = {
    urlBase: sessionStorage.getItem('mf_url') || "",
    token: sessionStorage.getItem('mf_token') || "",
    documentNo: sessionStorage.getItem('mf_doc') || "",
    transactionId: null,
    carrinho: [],
    vendaFechada: false,
    vendaIniciada: false,
    descontoFormaDePagamento: 0,
    descontoRateio: 0,
    totalGeral: 0,
    totalLiquido: 0,
    somaDesconto: 0,
    somaDescontoItens: 0,
    historicoCupons: [],
    pagDinheiro: 0
};

export function updateConfig(url, tk, doc, engine) {
    state.urlBase = url;
    state.token = tk;
    state.documentNo = doc;
    state.engineAtiva = engine;

    sessionStorage.setItem('mf_url', url);
    sessionStorage.setItem('mf_token', tk);
    sessionStorage.setItem('mf_doc', doc);
    sessionStorage.setItem('mf_engine', engine);
}   

export function resetVenda() {
    state.vendaFechada = false;
    state.transactionId = null;
    state.vendaIniciada = false
}