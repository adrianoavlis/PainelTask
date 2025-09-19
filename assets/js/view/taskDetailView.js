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
                <div class="col-md-3">
                  <h6 class="fw-bold">Início</h6>
                  <p class="mb-0" data-detail="startDate"></p>
                </div>
                <div class="col-md-3">
                  <h6 class="fw-bold">Fim</h6>
                  <p class="mb-0" data-detail="dueDate"></p>
                </div>
              </div>
              <div class="mt-3">
                <h6 class="fw-bold">Prioridade</h6>
                <span class="badge" data-detail="priority"></span>
              </div>
              <div class="mt-3">
                <h6 class="fw-bold">Tags</h6>
                <div class="d-flex flex-wrap gap-2" data-detail="tags"></div>
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
    this.setText('startDate', task.startDate || '—');
    this.setText('dueDate', task.dueDate || '—');

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
  },

  clearDetails() {
    this.modalEl.querySelectorAll('[data-detail]').forEach(el => {
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
  },

  setText(attribute, text) {
    const element = this.modalEl.querySelector(`[data-detail="${attribute}"]`);
    if (element) {
      element.textContent = text;
    }
  }
};
