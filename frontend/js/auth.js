const auth = {
    getToken: () => localStorage.getItem('pt_token'),
    getUser:  () => JSON.parse(localStorage.getItem('pt_user') || 'null'),
    isAdmin:  () => auth.getUser()?.role === 'ADMIN',

    requireAuth: () => {
        if (!auth.getToken()) {
            window.location.href = '/pages/login.html';
        }
    },

    setSession: (token, user) => {
        localStorage.setItem('pt_token', token);
        localStorage.setItem('pt_user', JSON.stringify(user));
    },

    logout: () => {
        localStorage.removeItem('pt_token');
        localStorage.removeItem('pt_user');
        window.location.href = '/pages/login.html';
    }
};
