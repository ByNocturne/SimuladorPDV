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

    abrirModalCupom(cupom) {
        const modal = document.getElementById('modal-cupom');
        if (!modal) return;

        // Buscando os itens com a chave correta (provavelmente 'carrinho' ou 'itens')
        const itensDoCupom = cupom.carrinho || cupom.itens || cupom.items || [];
        const estaCancelado = cupom.status === 'CANCELED' || cupom.status === 'cancelado';

        // Abrimos a div .cupom e colocamos TUDO dentro dela!
        // O position: relative garante que o botão X fique preso no canto do cupom.
        let html = `
            <div class="cupom" style="position: relative; padding-top: 30px;">
                <button class="modal-close-btn" data-modal="modal-cupom" aria-label="Fechar" style="position: absolute; top: 10px; right: 10px;">
                    <div class="icon-cross"></div>
                </button>
                
                <h3 style="text-align: center; margin-top: 0;">CUPOM FISCAL</h3>
                <div style="margin-bottom: 15px; font-size: 0.9em;">
                    <strong>Transação:</strong> #${cupom.transactionId || cupom.id || 'N/A'}<br>
                    <strong>Status:</strong> ${estaCancelado ? '<span style="color: #d63031; font-weight: bold;">CANCELADO</span>' : 'CONCLUÍDO'}
                </div>
                
                <hr style="border: 0; border-top: 1px dashed #333; margin: 10px 0;">
                
                <div class="itens-cupom">
        `;

        // Renderização dos itens (usando .sku e .preco que é o padrão do seu state.js)
        if (itensDoCupom.length === 0) {
            html += `<div style="text-align: center; color: #d63031;">Nenhum item salvo na transação.</div>`;
        } else {
            itensDoCupom.forEach(item => {
                html += `
                    <div class="linha-item" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>${item.qtd || 1}x ${item.sku || item.nome || 'Item'}</span>
                        <span>R$ ${Number(item.preco || item.precoUnitario || 0).toFixed(2)}</span>
                    </div>
                `;
            });
        }

        html += `
                </div>
                
                <hr style="border: 0; border-top: 1px dashed #333; margin: 10px 0;">
                
                <div style="display: flex; justify-content: space-between; font-size: 1.1em; font-weight: bold;">
                    <span>TOTAL</span>
                    <span>R$ ${Number(cupom.total || cupom.totalGeral || 0).toFixed(2)}</span>
                </div>
        `;

        // Botão de cancelar agora nasce DENTRO da notinha
        if (!estaCancelado) {
            html += `
                <div style="text-align: center; margin-top: 20px;">
                    <button id="btn-cancelar-cupom" class="btn-padrao btn-cancelar" style="background-color: #d63031; color: white; width: 100%; padding: 10px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;" onclick="handleCancelarCupom()">
                        Cancelar Cupom
                    </button>
                </div>
            `;
        }

        html += `
            </div> `;

        modal.innerHTML = html;
        modal.style.display = 'flex';
    },

    renderizarHistoricoCupons(arrayDeCupons) {
        const container = document.getElementById('lista-historico-cupons'); 
        
        if (!container) return; 
        container.innerHTML = '';

        if (!arrayDeCupons || arrayDeCupons.length === 0) {
            container.innerHTML = '<p>Nenhum cupom no histórico.</p>';
            return;
        }

        arrayDeCupons.forEach(cupom => {
            const card = document.createElement('div');
            card.classList.add('card-cupom');

            if (cupom.status === 'CANCELED' || cupom.status === 'cancelado') {
                card.classList.add('cupom-cancelado');
            }

            card.innerHTML = `
                <div class="cupom-info">
                    <strong>Transação:</strong> #${cupom.transactionId || cupom.id || 'N/A'}<br>
                    <strong>Status:</strong> ${cupom.status === 'CANCELED' ? 'CANCELADO' : 'CONCLUÍDO'}<br>
                </div>
                <div class="cupom-valor">
                    <strong>Total:</strong> R$ ${(cupom.total || cupom.totalGeral || 0).toFixed(2)}
                </div>
            `;

            card.onclick = () => {
                if (typeof abrirModalCupom === 'function') {
                    abrirModalCupom(cupom);
                }
            };

            container.appendChild(card);
        });
    }
}

