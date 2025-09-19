import { EventBus } from '../core/eventBus.js';
import { TaskModel } from '../model/taskModel.js';

export const TaskDetailView = {
  modal: null,
  modalEl: null,
  currentTask: null,

  init() {
    const modalHtml = `
      <div class="modal fade" id="taskDetailModal" tabindex="-1" aria-labelledby="taskDetailModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="taskDetailModalLabel">Detalhes da Tarefa</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <h6 class="fw-bold">Título</h6>
                <p class="mb-0" data-detail="title"></p>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <h6 class="fw-bold">Assunto</h6>
                  <p class="mb-0" data-detail="topic"></p>
                </div>
                <div class="col-md-6">
                  <h6 class="fw-bold">Colaborador</h6>
                  <p class="mb-0" data-detail="collaborator"></p>
                </div>
                <div class="col-md-3">
                  <h6 class="fw-bold">Início</h6>
                  <p class="mb-0" data-detail="startDate"></p>
                </div>
                <div class="col-md-3">
                  <h6 class="fw-bold">Fim</h6>
                  <p class="mb-0" data-detail="dueDate"></p>
                </div>
              </div>
              <div class="mt-3 row g-3 align-items-end">
                <div class="col-md-6">
                  <h6 class="fw-bold mb-1">Status</h6>
                  <select class="form-select" data-detail="statusSelect"></select>
                  <small class="d-block mt-2 text-muted">Atual: <span class="badge" data-detail="statusBadge"></span></small>
                </div>
                <div class="col-md-6">
                  <h6 class="fw-bold mb-1">Prioridade</h6>
                  <span class="badge" data-detail="priority"></span>
                </div>
              </div>
              <div class="mt-3">
                <h6 class="fw-bold">Tags</h6>
                <div class="d-flex flex-wrap gap-2" data-detail="tags"></div>
              </div>
              <div class="mt-3">
                <h6 class="fw-bold">Dependências</h6>
                <div class="d-flex flex-column gap-2" data-detail="dependencies"></div>
              </div>
              <div class="mt-3">
                <h6 class="fw-bold">Notas</h6>
                <p class="mb-0" data-detail="notes"></p>
              </div>
            </div>
            <div class="modal-footer d-flex justify-content-between">
              <button type="button" class="btn btn-outline-danger" data-action="delete">Excluir</button>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Fechar</button>
                <button type="button" class="btn btn-primary" data-action="edit">Editar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.modalEl = document.getElementById('taskDetailModal');
    this.modal = new bootstrap.Modal(this.modalEl);

    const statusSelect = this.modalEl.querySelector('[data-detail="statusSelect"]');
    this._populateStatusSelect();

    statusSelect.addEventListener('change', event => {
      if (!this.currentTask) {
        return;
      }

      const newStatus = event.target.value;
      if (!TaskModel.getStatusById(newStatus)) {
        event.target.value = this.currentTask.status || TaskModel.getDefaultStatusId();
        return;
      }

      const latestTask = TaskModel.getTaskById(this.currentTask.id);
      if (!latestTask || latestTask.status === newStatus) {
        return;
      }

      const updatedTask = { ...latestTask, status: newStatus };
      TaskModel.updateTask(updatedTask);
      this.currentTask = { ...updatedTask };
      this.fillDetails(this.currentTask);
    });

    this.modalEl.querySelector('[data-action="edit"]').addEventListener('click', () => {
      if (!this.currentTask) return;
      this.modal.hide();
      EventBus.emit('openTaskModal', this.currentTask);
    });

    this.modalEl.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (!this.currentTask) return;
      if (confirm('Deseja excluir esta tarefa?')) {
        TaskModel.removeTask(this.currentTask.id);
        this.modal.hide();
      }
    });

    this.modalEl.addEventListener('hidden.bs.modal', () => {
      this.currentTask = null;
      this.clearDetails();
    });

    EventBus.on('openTaskDetail', task => this.open(task));

    EventBus.on('statusesChanged', () => {
      if (this.currentTask) {
        const latestTask = TaskModel.getTaskById(this.currentTask.id);
        if (latestTask) {
          this.currentTask = { ...latestTask };
          this.fillDetails(this.currentTask);
          return;
        }
      }

      this._populateStatusSelect();
      this._updateStatusBadge(TaskModel.getDefaultStatusId());
    });

  },

  open(task) {
    if (!task) return;
    const latestTask = TaskModel.getTaskById(task.id);
    this.currentTask = latestTask ? { ...latestTask } : { ...task };

    this.fillDetails(this.currentTask);
    this.modal.show();
  },

  fillDetails(task) {
    this.setText('title', task.title || '—');
    this.setText('topic', task.topic || '—');
    this.setText('collaborator', task.collaborator || '—');
    this.setText('startDate', task.startDate || '—');
    this.setText('dueDate', task.dueDate || '—');

    const resolvedStatus = TaskModel.resolveStatusId(task.status);
    this._populateStatusSelect(resolvedStatus);
    const statusSelect = this.modalEl.querySelector('[data-detail="statusSelect"]');
    if (statusSelect) {
      statusSelect.value = resolvedStatus;
    }
    this._updateStatusBadge(resolvedStatus);

    const priorityEl = this.modalEl.querySelector('[data-detail="priority"]');
    const priorityLabels = {
      high: { text: 'Alta', className: 'bg-danger' },
      medium: { text: 'Média', className: 'bg-warning text-dark' },
      low: { text: 'Baixa', className: 'bg-secondary' }
    };
    const priorityInfo = priorityLabels[task.priority] || { text: task.priority || '—', className: 'bg-light text-dark' };
    priorityEl.className = `badge ${priorityInfo.className}`;
    priorityEl.textContent = priorityInfo.text;

    const tagsContainer = this.modalEl.querySelector('[data-detail="tags"]');
    tagsContainer.innerHTML = '';
    if (Array.isArray(task.tags) && task.tags.length > 0) {
      task.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'badge bg-light text-dark';
        span.textContent = tag;
        tagsContainer.appendChild(span);
      });
    } else {
      const span = document.createElement('span');
      span.className = 'text-muted';
      span.textContent = 'Sem tags';
      tagsContainer.appendChild(span);
    }

    this.setText('notes', task.notes || 'Sem notas');
    this._renderDependencies(task.dependencies);
  },

  clearDetails() {
    this.modalEl.querySelectorAll('[data-detail]').forEach(el => {
      if (el.tagName === 'SELECT') {
        return;
      }
      if (el.tagName === 'DIV' || el.tagName === 'SPAN') {
        el.innerHTML = '';
      } else {
        el.textContent = '';
      }
    });
    const priorityEl = this.modalEl.querySelector('[data-detail="priority"]');
    if (priorityEl) {
      priorityEl.className = 'badge';
    }
    const statusSelect = this.modalEl.querySelector('[data-detail="statusSelect"]');
    const defaultStatus = TaskModel.getDefaultStatusId();
    if (statusSelect) {
      this._populateStatusSelect(defaultStatus);
      statusSelect.value = defaultStatus;
    }
    this._updateStatusBadge(defaultStatus);
  },

  setText(attribute, text) {
    const element = this.modalEl.querySelector(`[data-detail="${attribute}"]`);
    if (element) {
      element.textContent = text;
    }
  },

  _updateStatusBadge(statusId) {
    const statusBadge = this.modalEl.querySelector('[data-detail="statusBadge"]');
    if (!statusBadge) {
      return;
    }

    const status = TaskModel.getStatusById(statusId) || TaskModel.getStatusById(TaskModel.getDefaultStatusId());
    const label = status?.label || 'A Fazer';
    const badgeClass = status?.badgeClass || 'bg-secondary';

    statusBadge.className = `badge ${badgeClass}`;
    statusBadge.textContent = label;
  },

  _populateStatusSelect(selectedId) {
    const statusSelect = this.modalEl?.querySelector('[data-detail="statusSelect"]');
    if (!statusSelect) {
      return;
    }

    const statuses = TaskModel.getStatuses();
    statusSelect.innerHTML = '';

    statuses.forEach(status => {
      const option = document.createElement('option');
      option.value = status.id;
      option.textContent = status.label;
      statusSelect.appendChild(option);
    });

    const defaultStatus = TaskModel.getDefaultStatusId();
    const statusToSelect = statuses.find(status => status.id === selectedId)?.id || defaultStatus;
    statusSelect.value = statusToSelect;

  }
};
