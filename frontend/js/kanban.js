auth.requireAuth();
document.getElementById('navbar').innerHTML = utils.buildNavbar('kanban');

let allTasks = [];

async function loadKanban() {
    try {
        const res = await api.get('/tasks');
        allTasks = res.data;
        renderBoard();
    } catch (err) {
        utils.showToast('Erro ao carregar tarefas: ' + err.message, 'error');
    }
}

function renderBoard() {
    ['TODO', 'DOING', 'DONE'].forEach(status => {
        const col = document.getElementById(`col-${status}`);
        const tasks = allTasks.filter(t => t.status === status);
        col.innerHTML = tasks.length === 0
            ? `<div class="text-muted text-center small p-3">Nenhuma tarefa</div>`
            : tasks.map(cardHtml).join('');
        updateCount(status, tasks.length);
    });
}

function cardHtml(task) {
    const overdue = utils.isOverdue(task.dueDate) && task.status !== 'DONE'
        ? 'border-danger' : '';
    return `
    <div class="kanban-card card mb-2 border-0 shadow-sm ${overdue}"
         draggable="true" data-id="${task.id}" data-status="${task.status}"
         ondragstart="onDragStart(event)">
        <div class="card-body p-2">
            <div class="d-flex justify-content-between align-items-start">
                <p class="mb-1 fw-semibold small">${task.title}</p>
                <button class="btn btn-link btn-sm p-0 ms-1 text-danger" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash-alt fa-xs"></i>
                </button>
            </div>
            <div class="d-flex gap-1 flex-wrap">
                ${utils.priorityBadge(task.priority)}
                ${task.topic ? `<span class="badge bg-light text-dark border">${task.topic}</span>` : ''}
                ${task.dueDate ? `<span class="badge ${utils.isOverdue(task.dueDate) ? 'bg-danger' : 'bg-light text-dark border'}">
                    <i class="fas fa-calendar me-1"></i>${utils.formatDate(task.dueDate)}</span>` : ''}
            </div>
            ${task.assignedTo ? `<div class="mt-1 text-muted small"><i class="fas fa-user me-1"></i>${task.assignedTo.name}</div>` : ''}
        </div>
    </div>`;
}

function updateCount(status, count) {
    const el = document.getElementById(`count-${status}`);
    if (el) el.textContent = count;
}

// Drag & Drop
function onDragStart(e) {
    e.dataTransfer.setData('taskId', e.currentTarget.dataset.id);
}

function onDragOver(e) { e.preventDefault(); }

async function onDrop(e, newStatus) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = allTasks.find(t => String(t.id) === taskId);
    if (!task || task.status === newStatus) return;

    try {
        const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
        allTasks = allTasks.map(t => t.id === res.data.id ? res.data : t);
        renderBoard();
        utils.showToast(`Tarefa movida para ${utils.statusLabel(newStatus)}`);
    } catch (err) {
        utils.showToast('Erro ao mover tarefa: ' + err.message, 'error');
    }
}

async function deleteTask(id) {
    if (!confirm('Remover esta tarefa?')) return;
    try {
        await api.delete(`/tasks/${id}`);
        allTasks = allTasks.filter(t => t.id !== id);
        renderBoard();
        utils.showToast('Tarefa removida');
    } catch (err) {
        utils.showToast('Erro ao remover: ' + err.message, 'error');
    }
}

// Modal de nova tarefa
document.getElementById('form-new-task')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
        const res = await api.post('/tasks', {
            title:    form.querySelector('#task-title').value,
            status:   form.querySelector('#task-status').value,
            priority: form.querySelector('#task-priority').value,
            dueDate:  form.querySelector('#task-due-date').value || null
        });
        allTasks.push(res.data);
        renderBoard();
        bootstrap.Modal.getInstance(document.getElementById('modalNewTask')).hide();
        form.reset();
        utils.showToast('Tarefa criada com sucesso!');
    } catch (err) {
        utils.showToast('Erro ao criar tarefa: ' + err.message, 'error');
    }
});

loadKanban();
