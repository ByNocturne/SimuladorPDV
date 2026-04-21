import { state } from './state.js';

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

export const ApiService = {
    async start() {
        const payload = {
            "transaction_context": { "document_no": state.documentNo, "phone": "" },
            "transaction_id": ""
        };
        const res = await request('/v2.2/transaction/start', 'POST', payload);
        return { res, payload };
    },

    async message(tag, value) {
        const payload = { 
            "input_value": value, 
            "tag": tag, 
            "transaction_id": state.transactionId 
        };
        const res = await request('/v2.2/transaction/message', 'POST', payload);
        return { res, payload };
    },

    async preApply(itens) {
        const payload = {
            "items": itens,
            "origin": "pdv-simulator",
            "transaction_id": state.transactionId
        };
        const res = await request('/v2.2/transaction/pre-apply', 'POST', payload);
        return { res, payload };
    },

    async apply() {
        const payload = {
            "transaction_id": state.transactionId
        };
        const res = await request('/v2.2/transaction/apply', 'POST', payload);
        return { res, payload };
    },

    async confirm() {
        const payload = {
            "transaction_id": state.transactionId
        };
        const res = await request('/v2.2/transaction/confirm', 'POST', payload);
        return { res, payload };
    },

    async cancel() {
        const payload = {
            "transaction_id": state.transactionId
        };
        const res = await request('/v2.2/transaction/cup', 'POST', payload);
        return { res, payload };
    },

    async cupom(itens, pagamentos) {
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
        const res = await request('/v2/coupons', 'POST', payload);
        return { res, payload };
    }

    /* async cupomCancelado() {
        const payload = {
            "transaction_id": state.transactionId
        };
        const res = await request('/v2.2/transaction/cancel', 'POST', payload);
        return { res, payload };
    } */
};