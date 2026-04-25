# Simulador de PDV

Este projeto é um simulador de Ponto de Venda (PDV) desenvolvido para validar e testar fluxos de integração com APIs de transações e CRM. Ele permite simular o ciclo de vida de uma venda, desde o início da transação, resposta de mensagens dinâmicas, aplicação de descontos, finalização ou cancelamento da transação e geração do cupom.

## 📱 Estrutura do Simulador

O projeto é dividido em quatro módulos principais, acessíveis pelo menu lateral:

* **🖥️ PDV**: A interface principal de vendas. É aqui que o usuário insere o documento de identificação e inicia o fluxo de transação com a API.
* **⚙️ Configurações**: Local para gerenciar as variáveis de ambiente, como a URL Base da API e tokens de autenticação, armazenados no estado global da aplicação.
* **🔍 Histórico de Logs**: Menu técnico que registra todas as requisições enviadas e respostas recebidas. Permite a inspeção de payloads JSON via modal detalhado.
* **🎫 Histórico de Cupons**: Exibição dos cupons gerados após a finalização bem-sucedida das transações.

## 🚀 Funcionalidades

- **Simulação de Vendas**: Simula uma venda real com comunicação de APis externos.
- **Mensagens Dinâmicas**: Interface preparada para processar e responder payloads complexos da API.
- **Sistema de Logs**: Histórico detalhado de requisições e respostas com visualização em modal.
- **Visualização de Cupom**: Simula a criação de um Cupom Fiscal pós finalização da venda.
- **Arquitetura Centralizada**: Uso de uma função principal para gerenciar chamadas HTTP via Fetch API.

## 🏗️ Arquitetura do Sistema

Para manter o código organizado, o simulador é dividido em responsabilidades claras:

- **Interface e Visual (UI)**: Arquivos que cuidam do que o usuário vê (HTML/CSS) e das funções que mexem na tela, como abrir modais e exibir alertas.
- - ui.js
- **Lógica de Comunicação (Engines) e Gerenciamento**: Arquivos que cuidam da centralização de counicação com as APIs. Cada API tem uma engine, com um sistema que controla qual engine será utilizada para a venda atual
- - janev22.js -> Engine da API v2.2 da Mercafacil
- - consinco.js -> Engine da API do Acrux PDV da Consinco (TOTVS)
- - engineManager.js -> Sistema de controle de engines
- **Gerenciamento de Dados (State)**: Arquivo central que guarda as informações importantes da transação atual.
- - state.js
- **Funções úteis**: Funções de apoio para o funcionamento das engines.
- - utils.js
- **Gerenciador do Sistema**: Arquivo principal que gerencia toda a aplicação, liga toda arquitetura do sistema

## 🛠️ Tecnologias Utilizadas

* [JavaScript Vanilla](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript) (ES6+)
* [HTML5](https://developer.mozilla.org/pt-BR/docs/Web/HTML) & [CSS3](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
* [Fetch API](https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API) para comunicações assíncronas.

## ⚙️ Como Executar o Projeto

1. Clone o repositório:
   ```bash
   git clone [https://github.com/ByNocturne/SimuladorPDV.git](https://github.com/ByNocturne/SimuladorPDV.git)