import { state } from './state.js';

export const UI = {
    renderizarCarrinho() {
        const listaItens = document.getElementById('lista-itens');
        if (!listaItens) return;
        listaItens.innerHTML = '';

        state.totalGeral = 0;
        state.totalLiquido = 0;
        state.somaDescontoItens = 0;

        state.carrinho.forEach((item, index) => {
            state.totalGeral += item.preco;
            state.totalLiquido += item.precoComDesconto;
            state.somaDescontoItens += item.descontoItens;

            const div = document.createElement('div');
            div.className = 'item-produto-bloco';
            div.innerHTML = `
                <div class="info-principal">
                    <span class="item-produto indice">#${index + 1}</span>
                    <span class="item-produto"> SKU: ${item.sku}</span>
                    <span class="item-produto"> Qtd: ${item.qtd}x</span>
                    <span class="item-produto"> Bruto: R$ ${item.preco.toFixed(3)}</span>
                </div>
                <div class="info-total" style="text-align: right;">
                    ${item.descontoItemRateio > 0 ? `<div style="color: purple;">Rateio: - R$ ${item.descontoItemRateio.toFixed(3)}</div>` : ''}
                    ${item.descontoItens > 0 ? `<div style="color: green;">Desc. Item: - R$ ${item.descontoItens.toFixed(3)}</div>` : ''}
                    <div class="item-produto">Líquido: R$ ${item.precoComDesconto.toFixed(3)}</div>
                </div>`;
            listaItens.appendChild(div);
        });

        state.somaDesconto = state.somaDescontoItens + state.descontoRateio + state.descontoFormaDePagamento;

        document.getElementById('valor-total').innerText = `R$ ${state.totalGeral.toFixed(3)}`;
        document.getElementById('valor-desc-itens').innerText = `R$ ${state.somaDescontoItens.toFixed(3)}`;
        document.getElementById('valor-rateio').innerText = `R$ ${state.descontoRateio.toFixed(3)}`;
        document.getElementById('valor-pagamento').innerText = `R$ ${state.descontoFormaDePagamento.toFixed(3)}`;
        document.getElementById('valor-descontos').innerText = `R$ ${state.somaDesconto.toFixed(3)}`;
        document.getElementById('valor-liquido').innerText = `R$ ${state.totalLiquido.toFixed(3)}`;
    },

    registrarLog(mensagem, status, dados = null, endpoint) {
        const corpoTabela = document.getElementById('corpo-tabela-logs');
        const logFooter = document.getElementById('log-tempo-real');
        const agora = new Date().toLocaleTimeString();


        // 1. Adiciona ao log rápido (o container preto no rodapé)
        if (logFooter) {
            const linhaLog = document.createElement('div');
            linhaLog.style.color = status === 'error' ? '#ff4d4d' : '#00ff00';
            linhaLog.textContent = `> [${agora}] | ${state.transactionId} | ${mensagem} Dinheiro`;
            logFooter.appendChild(linhaLog);
            logFooter.scrollTop = logFooter.scrollHeight; // Auto-scroll
        }

        // 2. Adiciona à tabela de histórico (View de Logs)
        if (corpoTabela) {
            const tr = document.createElement('tr');
            tr.className = 'linha-log-clicavel';

            tr.innerHTML = `
                <td>${state.transactionId || '---'}</td>
                <td>${agora}</td>
                <td><span class="status-badge status-${status}">${status}</span></td>
                <td>${mensagem}</td>
                <td id="request-log">Clique para ver</td>
                <td id="response-log">Clique para ver</td>
            `;

            const tdRequest = tr.cells[4];
            const tdResponse = tr.cells[5];

            // Configura o clique para a coluna de Request
            tdRequest.onclick = () => {
                const conteudo = dados?.request ? JSON.stringify(dados.request, null, 2) : "-";
                this.mostrarDetalhesLog(mensagem, "REQUEST", conteudo, endpoint);
            };

            // Configura o clique para a coluna de Response
            tdResponse.onclick = () => {
                const conteudo = dados?.response ? JSON.stringify(dados.response, null, 2) : "-";
                this.mostrarDetalhesLog(mensagem, "RESPONSE", conteudo, endpoint);
            };
            corpoTabela.prepend(tr); // Adiciona o mais recente no topo
        }
    },

    exibirAlerta: function(mensagem) {
        alert(mensagem); 
    },

    alternarView(view) {
        const pdv = document.getElementById('view-pdv');
        const log = document.getElementById('view-log');
        const cupom = document.getElementById('view-cupom');
        const dados = document.getElementById('view-dados');
        
        // Pega os itens do menu
        const menuPDV = document.querySelector('.item-menu:nth-child(1)');
        const menuLog = document.querySelector('.item-menu:nth-child(3)');
        const menuCupom = document.querySelector('.item-menu:nth-child(4)');
        const menuDados = document.querySelector('.item-menu:nth-child(5)');

        // Esconde tudo primeiro
        if (pdv) pdv.style.display = 'none';
        if (log) log.style.display = 'none';
        if (cupom) cupom.style.display = 'none';
        if (dados) dados.style.display = 'none';

        // Lógica original exata que você construiu:
        if (view === 'pdv') {
            if (pdv) pdv.style.display = 'block';
            if (menuPDV) menuPDV.classList.add('ativo');
            if (menuLog) menuLog.classList.remove('ativo');
            if (menuCupom) menuCupom.classList.remove('ativo');
            if (menuDados) menuDados.classList.remove('ativo');
        } else if (view === 'log') {
            if (log) log.style.display = 'block';
            if (menuPDV) menuPDV.classList.remove('ativo');
            if (menuLog) menuLog.classList.add('ativo');
            if (menuCupom) menuCupom.classList.remove('ativo');
            if (menuDados) menuDados.classList.remove('ativo');
        } else if (view === 'cupom') {
            if (cupom) cupom.style.display = 'block';
            if (menuPDV) menuPDV.classList.remove('ativo');
            if (menuLog) menuLog.classList.remove('ativo');
            if (menuCupom) menuCupom.classList.add('ativo');
            if (menuDados) menuDados.classList.remove('ativo');

            this.renderizarHistoricoCupons(state.historicoCupons);
            
        } else if (view === 'dados') {
            if (dados) dados.style.display = 'block';
            if (menuPDV) menuPDV.classList.remove('ativo');
            if (menuLog) menuLog.classList.remove('ativo');
            if (menuCupom) menuCupom.classList.remove('ativo');
            if (menuDados) menuDados.classList.add('ativo');
        }
    },

    abrirModalMensagem(texto, objetoMessage, callback) {
        const modal = document.getElementById('modal-mensagens');
        const txtMsg = document.getElementById('texto-mensagem');
        const container = document.getElementById('container-botoes');
        
        modal.style.display = 'flex';
        txtMsg.innerText = texto;
        container.innerHTML = "";

        if (objetoMessage.input) {
            const input = document.createElement('input');  
            input.type = "text";
            input.id = "campo-digitacao";
            input.className = 'input-mensagem';
            container.appendChild(input);
        }

        (objetoMessage.responses || []).forEach(res => {
            const btn = document.createElement('button');
            btn.innerText = res.button;
            btn.className = 'btn-padrao btn-gradient btn-messagem';

            btn.onclick = () => {
                const inputElement = document.getElementById('campo-digitacao');
                const val = inputElement ? inputElement.value : "";

                if (res.end_message_flow) {
                    modal.style.display = 'none';
                }

                if (typeof callback === 'function') {
                callback(res.tag, val);
            }
            };
            container.appendChild(btn);
        });
    },

    mostrarDetalhesLog(titulo, tipo, conteudo, endpoint) {
        const modal = document.getElementById('modal-detalhes-log');
        const campoTitulo = document.getElementById('mensagem-log');
        const campoTipo = document.getElementById('tipo-log');
        const campoEndpoint = document.getElementById('endpoint-log');
        const campoConteudo = document.getElementById('detalhe-log');

        if (modal) {
            campoTitulo.textContent = titulo;
            campoTipo.textContent = tipo;
            campoEndpoint.textContent = `Endpoint: ${endpoint}`; 
            campoConteudo.textContent = conteudo;

            modal.style.display = 'flex';
        }
    },

    abrirModalCupom(cupom) {
    const modal = document.getElementById('modal-cupom');
    if (!modal) return;

    // 1. Extração segura dos itens
    const itensDoCupom = cupom.itens || cupom.items || cupom.carrinho || [];
    
    // 2. Extração segura dos totais
    const totalBruto = Number(cupom.totalBruto || cupom.total_value || cupom.totalGeral || 0).toFixed(2);
    const totalLiquido = Number(cupom.totalLiquido || cupom.net_value || 0).toFixed(2);
    
    // 3. Renderização Condicional do Rateio (Só aparece se > 0)
    const rateio = Number(cupom.rateio || cupom.prorate_value || 0);
    let rateioHTML = '';
    if (rateio > 0) {
        rateioHTML = `<div class="linha-item" style="color: red;"><span>Rateio:</span> <span>- R$ ${rateio.toFixed(2)}</span></div>`;
    }

    // 4. Renderização Condicional dos Descontos Totais
    const totalDescontos = Number(cupom.totalDescontos || cupom.discount_value || cupom.somaDescontoItens || 0);
    let descontosTotaisHTML = '';
    if (totalDescontos > 0) {
        descontosTotaisHTML = `<div class="linha-item" style="color: red;"><span>Descontos:</span> <span>- R$ ${totalDescontos.toFixed(2)}</span></div>`;
    }

    // 5. Itens (com lógica de desconto por item individual)
    let itensHTML = itensDoCupom.map(item => {
        const nome = item.name || item.nome || 'Produto';
        const qtd = item.quantity || item.qtd || 1;
        const preco = Number(item.price || item.preco || 0).toFixed(2);
        const descontoItem = Number(item.discount_value || item.discount || item.desconto || 0);

        let htmlItem = `
            <div class="linha-item">
                <span>${qtd}x ${nome}</span>
                <span>R$ ${preco}</span>
            </div>
        `;
        
        if (descontoItem > 0) {
            htmlItem += `
            <div class="linha-item" style="color: red; font-size: 0.9em;">
                <span>Desconto Item</span>
                <span>- R$ ${descontoItem.toFixed(2)}</span>
            </div>
            `;
        }
        return htmlItem;
    }).join('') || '<p>Nenhum item salvo.</p>';

    // 6. Lógica de Pagamentos (A sua regra de negócio)
    const pagamentosRaw = cupom.pagamentos || cupom.payments || [];
    let pagamentosHTML = '';

    if (pagamentosRaw.length > 0) {
        // Se o Motor mandou formas específicas (Ex: Cash + Cashback)
        pagamentosHTML = pagamentosRaw.map(pag => {
            let forma = pag.payment_form || pag.forma || 'Dinheiro';
            const valor = Number(pag.amount || pag.valor || 0).toFixed(2);
            
            // Tradutor para o Cupom
            if (forma === 'cash') forma = 'Dinheiro';
            if (forma === 'cashback') forma = 'Cashback';
            if (forma === 'payment_discount') forma = 'Desconto Pagamento';

            return `<div class="linha-item"><span>${forma}</span> <span>R$ ${valor}</span></div>`;
        }).join('');
    } else {
        // Fallback: Se não tem nada registrado, "tudo como Dinheiro" do Total Líquido
        pagamentosHTML = `<div class="linha-item"><span>Dinheiro</span> <span>R$ ${totalLiquido}</span></div>`;
    }

    // 7. Botão Cancelar
    const estaCancelado = cupom.status === 'CANCELED';
    const botaoCancelarHTML = estaCancelado 
        ? `<p style="color: red; text-align: center; font-weight: bold; margin-top: 15px;">CUPOM CANCELADO</p>` 
        : `<button id="btn-cancelar-cupom" class="btn-cancelar" onclick="cancelarCupom()" style="margin-top: 15px; width: 100%;">Cancelar Cupom</button>`;

    // 8. Montagem Final
    modal.innerHTML = `
        <div class="cupom">
            <button class="modal-close-btn" onclick="fecharModais()" aria-label="Fechar">
                    <span class="icon-cross"></span>
                </button>
            <h2 style="text-align: center;">CUPOM FISCAL</h2>
            <hr>
            
            <div class="lista-itens">
                ${itensHTML}
            </div>
            
            <hr>
            <div class="totais-cupom">
                <div class="linha-item"><span>Total Bruto:</span> <span>R$ ${totalBruto}</span></div>
                ${descontosTotaisHTML}
                ${rateioHTML}
                <hr>
                <div class="linha-item" style="font-weight: bold; font-size: 1.1em;"><span>Total Líquido:</span> <span>R$ ${totalLiquido}</span></div>
            </div>

            <hr>
            <div class="pagamentos-cupom">
                <p style="text-align: center; font-weight: bold; margin-bottom: 5px;">Formas de Pagamento</p>
                ${pagamentosHTML}
            </div>
            
            ${botaoCancelarHTML}
        </div>
    `;

    modal.style.display = 'flex';
},

    renderizarHistoricoCupons(arrayDeCupons) {
        const cuponsParaRenderizar = arrayDeCupons || state.historicoCupons || [];
        
        const container = document.getElementById('lista-historico-cupons'); 
        
        if (!container) {
            console.error("ERRO UI: Div 'lista-historico-cupons' não encontrada no HTML!");
            return; 
        }

        container.innerHTML = ''; // Limpa a tela velha

        // Se estiver vazio, avisa na tela
        if (cuponsParaRenderizar.length === 0) {
            container.innerHTML = '<p style="padding: 20px;">Nenhum cupom no histórico.</p>';
            return;
        }

        // Desenha os cards
        cuponsParaRenderizar.forEach(cupom => {
            const card = document.createElement('div');
            card.classList.add('card-cupom');

            if (cupom.status === 'CANCELED' || cupom.status === 'cancelado') {
                card.classList.add('cupom-cancelado');
            }

            card.innerHTML = `
                <div class="cupom-info">
                    <strong>Transação:</strong> #${cupom.transactionId || cupom.id || 'N/A'}<br>
                    <strong>Status:</strong> ${cupom.status === 'CANCELED' || cupom.status === 'cancelado' ? 'CANCELADO' : 'CONCLUÍDO'}<br>
                </div>
                <div class="cupom-valor">
                    <strong>Total:</strong> R$ ${(cupom.total || cupom.totalGeral || 0).toFixed(2)}
                </div>
            `;

            card.onclick = () => {
                UI.abrirModalCupom(cupom);
            };

            container.appendChild(card); 
        });
    }
}

