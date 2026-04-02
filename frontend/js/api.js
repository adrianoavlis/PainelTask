const API_BASE = (window.location.port === '3000' || window.location.port === '5000' || window.location.port === '8082')
    ? 'http://localhost:8081/api'
    : '/api';

const api = {
    _fetch: async (method, path, body = null) => {
        const token = localStorage.getItem('pt_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        if (res.status === 401) {
            localStorage.removeItem('pt_token');
            localStorage.removeItem('pt_user');
            window.location.href = '/pages/login.html';
            return;
        }

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Erro na requisição');
        }
        return data;
    },

    get:    (path)          => api._fetch('GET',    path),
    post:   (path, body)    => api._fetch('POST',   path, body),
    put:    (path, body)    => api._fetch('PUT',    path, body),
    patch:  (path, body)    => api._fetch('PATCH',  path, body),
    delete: (path)          => api._fetch('DELETE', path)
};
