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
        const menuPDV = document.querySelector('.item-menu:nth-child(1)');
        const menuLog = document.querySelector('.item-menu:nth-child(3)');
        const menuCupom = document.querySelector('.item-menu:nth-child(4)');
        const menuDados = document.querySelector('.item-menu:nth-child(5)');

        pdv.style.display = 'none';
        log.style.display = 'none';
        cupom.style.display = 'none';
        dados.style.display = 'none';

        if (view === 'pdv') {
            pdv.style.display = 'block';
            menuPDV.classList.add('ativo');
            menuLog.classList.remove('ativo');
            menuCupom.classList.remove('ativo');
        } else if ((view === 'log')) {
            log.style.display = 'block';
            menuPDV.classList.remove('ativo');
            menuLog.classList.add('ativo');
            menuCupom.classList.remove('ativo');
        } else if (view === 'cupom') {
            cupom.style.display = 'block';
            menuPDV.classList.remove('ativo');
            menuLog.classList.remove('ativo');
            menuCupom.classList.add('ativo');

            UI.renderizarHistoricoCupons();
        }else if (view === 'dados') {
            dados.style.display = 'block';
            menuPDV.classList.remove('ativo');
            menuLog.classList.remove('ativo');
            menuCupom.classList.remove('ativo');
            menuDados.classList.add('ativo');
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
            campoEndpoint.textContent = `Endpoint: ${endpoint}`; // Exibe o endpoint aqui
            campoConteudo.textContent = conteudo;

            modal.style.display = 'flex';
        }
    },

    abrirModalCupom(dadosHistorico = null) {
        const modal = document.getElementById('modal-cupom');
        
        const dados = dadosHistorico || {
            transactionId: state.transactionId,
            totalGeral: state.totalGeral,
            somaDesconto: state.somaDesconto,
            somaDescontoItens: state.somaDescontoItens,
            totalLiquido: state.totalLiquido,
            descontoRateio: state.descontoRateio,
            descontoFormaDePagamento: state.descontoFormaDePagamento,
            carrinho: state.carrinho,
            pagDinheiro: state.pagDinheiro
        };

        let itensHtml = "";

        dados.carrinho.forEach((item, index) => {
            itensHtml += `
                <div class="item-cupom-linha" style="margin-bottom: 10px;">
                    <span>#${index + 1} SKU: ${item.sku} | Qtd: ${item.qtd} | Bruto: R$ ${item.preco.toFixed(2)}</span>
                    ${item.descontoItens > 0 ? `<div style="color: green; font-size: 0.7rem; margin-left: 20px;">Desc. Item: - R$ ${item.descontoItens.toFixed(2)}</div>` : ''}
                    ${item.descontoItemRateio > 0 ? `<div style="color: purple; font-size: 0.7rem; margin-left: 20px;">Rateio: - R$ ${item.descontoItemRateio.toFixed(2)}</div>` : ''}
                    <div style="text-align: right; font-weight: bold;">Líquido: R$ ${item.precoComDesconto.toFixed(2)}</div>
                </div>`;
        });

        modal.innerHTML = `
            <div class="cupom">
                <h2 style="text-align: center;">CUPOM FISCAL</h2>
                <p style="text-align: center;">Mercafacil - Simulação PDV</p>
                <p>ID Transação: ${dados.transactionId || '---'}</p>
                <hr>
                <div id="lista-itens-cupom-interno">${itensHtml}</div>
                <hr>
                <div style="text-align: right;">
                    <p>Total Bruto: R$ ${dados.totalGeral.toFixed(2)}</p>
                    <p>Total Desc. Itens: R$ ${dados.somaDescontoItens.toFixed(2)}</p>

                    ${dados.descontoRateio > 0 ? `
                        <div font-size: 0.7rem; margin-left: 20px;">
                            Desc. Rateio: - R$ ${dados.descontoRateio.toFixed(2)}
                        </div>
                    ` : ''}
                    <p>Total Descontos: R$ ${dados.somaDesconto.toFixed(2)}</p>
                    <hr>

                    <p>Pagamentos</p>
                    ${dados.descontoFormaDePagamento > 0 ? `
                        <div style="font-size: 0.7rem; margin-left: 20px;">
                            <p>Desc. Forma de Pag.: R$ ${dados.descontoFormaDePagamento.toFixed(2)}</p>
                            <p>Dinheiro: R$ ${dados.pagDinheiro.toFixed(2)}
                        </div>
                    ` : 
                        `<div style="font-size: 0.7rem; margin-left: 20px;">
                            <p>Dinheiro: R$ ${dados.descontoFormaDePagamento.toFixed(2)}</p>
                        </div>`}
                    <hr>
                    
                    <h3 style="margin: 0;">TOTAL LÍQUIDO: R$ ${dados.totalLiquido.toFixed(2)}</h3>
                </div>
                <br>
                <button id="btn-cancelar-cupom" onclick="cancelarCupom()" class="btn-padrao btn-cancelar">Cancelar Cupom</button>
            </div>
        `;
        modal.style.display = 'flex';
    },

    renderizarHistoricoCupons() {
        const container = document.querySelector('.container-historico-cupons');
        if (!container) return;
        container.innerHTML = '';

        if (state.historicoCupons.length === 0) {
            container.innerHTML = '<p style="color: #666; padding: 20px;">Nenhum cupom finalizado ainda.</p>';
            return;
        }

        state.historicoCupons.forEach((cupom, index) => {
            const card = document.createElement('div');
            card.className = 'card-cupom';
            card.onclick = () => this.abrirModalCupom(cupom); 

            card.innerHTML = `
                <div style="font-weight: bold; color: var(--brand-navy); margin-bottom: 5px;">Venda #${index + 1}</div>
                <div style="font-size: 0.8rem; color: var(--brand-green); font-weight: bold;">
                    R$ ${cupom.totalLiquido.toFixed(2)}
                </div>
                <div style="font-size: 0.65rem; color: #999; margin-top: 5px;">
                    ${cupom.data}<br>
                    ID: ${cupom.transactionId ? cupom.transactionId : '---'}
                </div>
            `;
            container.appendChild(card);
        });
    }
}

