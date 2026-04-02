auth.requireAuth();
document.getElementById('navbar').innerHTML = utils.buildNavbar('tasks');

let tasks = [];
let colaboradores = [];
let editingId = null;

async function loadColaboradores() {
    try {
        const res = await api.get('/users/active');
        colaboradores = res.data;
        const sel = document.getElementById('field-assigned-to');
        const current = sel.value;
        sel.innerHTML = '<option value="">— Sem responsável —</option>' +
            colaboradores.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        if (current) sel.value = current;
    } catch (_) { /* silencioso */ }
}

async function loadTasks() {
    try {
        const res = await api.get('/tasks');
        tasks = res.data;
        renderTable();
    } catch (err) {
        utils.showToast('Erro ao carregar tarefas: ' + err.message, 'error');
    }
}

function renderTable() {
    const tbody = document.getElementById('tasks-tbody');
    if (!tasks.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhuma tarefa encontrada</td></tr>';
        return;
    }
    tbody.innerHTML = tasks.map(t => `
        <tr class="${utils.isOverdue(t.dueDate) && t.status !== 'DONE' ? 'table-danger' : ''}">
            <td class="fw-semibold">${t.title}</td>
            <td>${utils.statusBadge(t.status)}</td>
            <td>${utils.priorityBadge(t.priority)}</td>
            <td>${t.assignedTo ? `<span class="badge bg-light text-dark border"><i class="fas fa-user me-1"></i>${t.assignedTo.name}</span>` : '<span class="text-muted">—</span>'}</td>
            <td>${t.topic || '—'}</td>
            <td>${utils.formatDate(t.dueDate)}</td>
            <td>
                <button class="btn btn-outline-primary btn-sm me-1" onclick="openEdit(${t.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="deleteTask(${t.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>`).join('');
}

function openCreate() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nova Tarefa';
    document.getElementById('form-task').reset();
    loadColaboradores();
    new bootstrap.Modal(document.getElementById('modalTask')).show();
}

function openEdit(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editingId = id;
    document.getElementById('modal-title').textContent = 'Editar Tarefa';
    document.getElementById('field-title').value       = task.title || '';
    document.getElementById('field-description').value = task.description || '';
    document.getElementById('field-status').value      = task.status || 'TODO';
    document.getElementById('field-priority').value    = task.priority || 'MEDIUM';
    document.getElementById('field-due-date').value    = task.dueDate || '';
    document.getElementById('field-topic').value       = task.topic || '';
    document.getElementById('field-tags').value        = task.tags || '';
    document.getElementById('field-notes').value       = task.notes || '';
    loadColaboradores().then(() => {
        document.getElementById('field-assigned-to').value = task.assignedTo?.id || '';
    });
    new bootstrap.Modal(document.getElementById('modalTask')).show();
}

async function deleteTask(id) {
    if (!confirm('Remover esta tarefa?')) return;
    try {
        await api.delete(`/tasks/${id}`);
        tasks = tasks.filter(t => t.id !== id);
        renderTable();
        utils.showToast('Tarefa removida com sucesso');
    } catch (err) {
        utils.showToast('Erro: ' + err.message, 'error');
    }
}

document.getElementById('form-task').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        title:       document.getElementById('field-title').value,
        description: document.getElementById('field-description').value,
        status:      document.getElementById('field-status').value,
        priority:    document.getElementById('field-priority').value,
        dueDate:     document.getElementById('field-due-date').value || null,
        topic:       document.getElementById('field-topic').value,
        tags:         document.getElementById('field-tags').value,
        notes:        document.getElementById('field-notes').value,
        assignedToId: document.getElementById('field-assigned-to').value
                        ? Number(document.getElementById('field-assigned-to').value)
                        : null
    };

    try {
        if (editingId) {
            const res = await api.put(`/tasks/${editingId}`, payload);
            tasks = tasks.map(t => t.id === res.data.id ? res.data : t);
            utils.showToast('Tarefa atualizada!');
        } else {
            const res = await api.post('/tasks', payload);
            tasks.push(res.data);
            utils.showToast('Tarefa criada!');
        }
        renderTable();
        bootstrap.Modal.getInstance(document.getElementById('modalTask')).hide();
    } catch (err) {
        utils.showToast('Erro: ' + err.message, 'error');
    }
});

// Filtros
document.getElementById('filter-status')?.addEventListener('change', (e) => {
    const val = e.target.value;
    const rows = document.querySelectorAll('#tasks-tbody tr');
    rows.forEach(row => row.style.display = (val === '' || row.textContent.includes(utils.statusLabel(val))) ? '' : 'none');
});

loadTasks();
