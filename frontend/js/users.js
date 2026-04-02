auth.requireAuth();
if (!auth.isAdmin()) window.location.href = 'dashboard.html';
document.getElementById('navbar').innerHTML = utils.buildNavbar('users');

let editingId = null;

async function loadUsers() {
    try {
        const res = await api.get('/users');
        const tbody = document.getElementById('users-tbody');
        if (!res.data.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhum colaborador cadastrado</td></tr>';
            return;
        }
        tbody.innerHTML = res.data.map(u => `
            <tr class="${!u.active ? 'opacity-50' : ''}">
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                             style="width:32px;height:32px;font-size:13px;flex-shrink:0;">
                            ${u.name.charAt(0).toUpperCase()}
                        </div>
                        <span class="fw-semibold">${u.name}</span>
                    </div>
                </td>
                <td class="text-muted">${u.email}</td>
                <td>
                    <span class="badge ${u.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'}">
                        ${u.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}
                    </span>
                </td>
                <td>
                    <span class="badge ${u.active ? 'bg-success' : 'bg-secondary'}">
                        ${u.active ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td class="text-muted small">${utils.formatDate(u.createdAt)}</td>
                <td>
                    <button class="btn btn-outline-primary btn-sm me-1" onclick="openEdit(${u.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${u.active
                        ? `<button class="btn btn-outline-danger btn-sm" onclick="toggleActive(${u.id}, false)" title="Desativar">
                               <i class="fas fa-user-slash"></i>
                           </button>`
                        : `<button class="btn btn-outline-success btn-sm" onclick="toggleActive(${u.id}, true)" title="Reativar">
                               <i class="fas fa-user-check"></i>
                           </button>`
                    }
                </td>
            </tr>`).join('');
    } catch (err) {
        utils.showToast('Erro ao carregar colaboradores: ' + err.message, 'error');
    }
}

function openCreate() {
    editingId = null;
    document.getElementById('modal-colab-title').textContent = 'Novo Colaborador';
    document.getElementById('form-colaborador').reset();
    document.getElementById('colab-email-group').style.display = '';
    document.getElementById('colab-email').required = true;
    document.getElementById('colab-password').required = true;
    document.getElementById('colab-password-hint').textContent = '';
    document.getElementById('colab-password-label').textContent = 'Senha *';
    new bootstrap.Modal(document.getElementById('modalColaborador')).show();
}

function openEdit(id) {
    editingId = id;
    api.get(`/users/${id}`).then(res => {
        const u = res.data;
        document.getElementById('modal-colab-title').textContent = 'Editar Colaborador';
        document.getElementById('colab-name').value  = u.name;
        document.getElementById('colab-email').value = u.email;
        document.getElementById('colab-role').value  = u.role;
        document.getElementById('colab-password').value = '';
        document.getElementById('colab-password').required = false;
        document.getElementById('colab-password-hint').textContent = 'Deixe em branco para manter a senha atual';
        document.getElementById('colab-password-label').textContent = 'Nova Senha';
        document.getElementById('colab-email-group').style.display = 'none';
        new bootstrap.Modal(document.getElementById('modalColaborador')).show();
    }).catch(err => utils.showToast('Erro: ' + err.message, 'error'));
}

async function toggleActive(id, activate) {
    if (!confirm(`Deseja ${activate ? 'reativar' : 'desativar'} este colaborador?`)) return;
    try {
        if (activate) {
            await api.put(`/users/${id}/activate`, {});
        } else {
            await api.delete(`/users/${id}`);
        }
        utils.showToast(`Colaborador ${activate ? 'reativado' : 'desativado'} com sucesso`);
        loadUsers();
    } catch (err) {
        utils.showToast('Erro: ' + err.message, 'error');
    }
}

document.getElementById('form-colaborador').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name     = document.getElementById('colab-name').value.trim();
    const email    = document.getElementById('colab-email').value.trim();
    const password = document.getElementById('colab-password').value;
    const role     = document.getElementById('colab-role').value;

    try {
        if (editingId) {
            const payload = { name, role };
            if (password) payload.password = password;
            await api.put(`/users/${editingId}`, payload);
            utils.showToast('Colaborador atualizado com sucesso');
        } else {
            await api.post('/users', { name, email, password, role });
            utils.showToast('Colaborador criado com sucesso');
        }
        bootstrap.Modal.getInstance(document.getElementById('modalColaborador')).hide();
        loadUsers();
    } catch (err) {
        utils.showToast('Erro: ' + err.message, 'error');
    }
});

loadUsers();
