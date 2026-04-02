const utils = {
    priorityBadge: (p) => ({
        LOW:    '<span class="badge bg-success">Baixa</span>',
        MEDIUM: '<span class="badge bg-warning text-dark">Média</span>',
        HIGH:   '<span class="badge bg-danger">Alta</span>'
    }[p] || p),

    statusBadge: (s) => ({
        TODO:  '<span class="badge bg-secondary">A Fazer</span>',
        DOING: '<span class="badge bg-primary">Em Progresso</span>',
        DONE:  '<span class="badge bg-success">Concluído</span>'
    }[s] || s),

    statusLabel: (s) => ({ TODO: 'A Fazer', DOING: 'Em Progresso', DONE: 'Concluído' }[s] || s),

    formatDate: (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR') : '—',

    isOverdue: (dueDate) => dueDate && new Date(dueDate) < new Date(),

    showToast: (message, type = 'success') => {
        const container = document.getElementById('toast-container') || (() => {
            const el = document.createElement('div');
            el.id = 'toast-container';
            el.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(el);
            return el;
        })();

        const id = `toast-${Date.now()}`;
        const bg = type === 'error' ? 'text-bg-danger' : type === 'warning' ? 'text-bg-warning' : 'text-bg-success';
        container.insertAdjacentHTML('beforeend', `
            <div id="${id}" class="toast align-items-center ${bg} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>`);
        const el = document.getElementById(id);
        const toast = new bootstrap.Toast(el, { delay: 3500 });
        toast.show();
        el.addEventListener('hidden.bs.toast', () => el.remove());
    },

    buildNavbar: (activePage) => {
        const user = auth.getUser();
        const adminLink = auth.isAdmin()
            ? `<li class="nav-item"><a class="nav-link${activePage === 'users' ? ' active' : ''}" href="users.html">Colaboradores</a></li>`
            : '';
        return `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <div class="container-fluid">
                <a class="navbar-brand fw-bold" href="dashboard.html">PainelTask</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navMenu">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item"><a class="nav-link${activePage === 'dashboard' ? ' active' : ''}" href="dashboard.html">Dashboard</a></li>
                        <li class="nav-item"><a class="nav-link${activePage === 'kanban' ? ' active' : ''}" href="kanban.html">Kanban</a></li>
                        <li class="nav-item"><a class="nav-link${activePage === 'tasks' ? ' active' : ''}" href="tasks.html">Tarefas</a></li>
                        ${adminLink}
                    </ul>
                    <ul class="navbar-nav">
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                                <i class="fas fa-user-circle me-1"></i>${user?.name || 'Usuário'}
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><span class="dropdown-item-text text-muted small">${user?.email}</span></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="auth.logout()">Sair</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>`;
    }
};
