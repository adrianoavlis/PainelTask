import { EventBus } from '../core/eventBus.js';
import { TaskModel } from '../model/taskModel.js';

export const TaskDetailView = {
  modal: null,
  modalEl: null,
  currentTask: null,
  tooltips: [],

  init() {
    const modalHtml = `
      <div class="modal fade" id="taskDetailModal" tabindex="-1" aria-labelledby="taskDetailModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div class="modal-content task-detail-modal">
            <div class="task-detail-modal__hero">
              <div class="task-detail-modal__hero-main">
                <span class="task-detail-modal__topic" data-detail="topic"></span>
                <h2 class="task-detail-modal__title" id="taskDetailModalLabel" data-detail="title"></h2>
                <div class="task-detail-modal__meta">
                  <div class="task-detail-modal__meta-item">
                    <i class="fa-solid fa-user" aria-hidden="true"></i>
                    <span data-detail="collaborator"></span>
                  </div>
                  <div class="task-detail-modal__meta-item">
                    <i class="fa-solid fa-calendar-day" aria-hidden="true"></i>
                    <span>Início: <strong data-detail="startDate"></strong></span>
                  </div>
                  <div class="task-detail-modal__meta-item">
                    <i class="fa-solid fa-calendar-check" aria-hidden="true"></i>
                    <span>Fim: <strong data-detail="dueDate"></strong></span>
                  </div>
                </div>
              </div>
              <div class="task-detail-modal__hero-side">
                <div class="task-detail-modal__status">
                  <label for="taskDetailStatusSelect" class="form-label">Status</label>
                  <select class="form-select form-select-sm" id="taskDetailStatusSelect" data-detail="statusSelect"></select>
                  <span class="badge task-detail-modal__status-badge" data-detail="statusBadge"></span>
                </div>
                <div class="task-detail-modal__priority">
                  <span class="task-detail-modal__priority-label">Prioridade</span>
                  <span class="badge" data-detail="priority"></span>
                </div>
              </div>
              <button type="button" class="btn-close btn-close-white task-detail-modal__close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="task-detail-modal__body">
              <section class="task-detail-modal__section">
                <h6 class="task-detail-modal__section-title">
                  <i class="fa-solid fa-tags" aria-hidden="true"></i>
                  Tags
                </h6>
                <div class="task-detail-modal__tags" data-detail="tags"></div>
              </section>
              <section class="task-detail-modal__section">
                <h6 class="task-detail-modal__section-title">
                  <i class="fa-solid fa-link" aria-hidden="true"></i>
                  Dependências
                </h6>
                <div class="task-detail-modal__dependencies" data-detail="dependencies"></div>
              </section>
              <section class="task-detail-modal__section">
                <h6 class="task-detail-modal__section-title">
                  <i class="fa-regular fa-note-sticky" aria-hidden="true"></i>
                  Notas
                </h6>
                <p class="task-detail-modal__notes" data-detail="notes"></p>
              </section>
            </div>
            <div class="task-detail-modal__footer">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">
                <i class="fa-solid fa-arrow-left me-2" aria-hidden="true"></i>
                Fechar
              </button>
              <div class="task-detail-modal__actions">
                <button type="button" class="task-detail-modal__action task-detail-modal__action--edit" data-action="edit" data-bs-toggle="tooltip" data-bs-placement="top" title="Editar tarefa" aria-label="Editar tarefa">
                  <span class="task-detail-modal__action-icon">
                    <i class="fa-solid fa-pen" aria-hidden="true"></i>
                    <small>Editar</small>
                  </span>
                </button>
                <button type="button" class="task-detail-modal__action task-detail-modal__action--delete" data-action="delete" data-bs-toggle="tooltip" data-bs-placement="top" title="Excluir tarefa" aria-label="Excluir tarefa">
                  <span class="task-detail-modal__action-icon">
                    <i class="fa-solid fa-trash" aria-hidden="true"></i>
                    <small>Excluir</small>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.modalEl = document.getElementById('taskDetailModal');
    this.modal = new bootstrap.Modal(this.modalEl);

    this._initActionTooltips();

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
      this.tooltips.forEach(tooltip => tooltip.hide());
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
    const topicText = task.topic || 'Sem assunto';
    this.setText('title', task.title || '—');
    this.setText('topic', topicText);
    this.setText('collaborator', task.collaborator || 'Sem colaborador');
    this.setText('startDate', this._formatDate(task.startDate));
    this.setText('dueDate', this._formatDate(task.dueDate));

    const topicEl = this.modalEl.querySelector('[data-detail="topic"]');
    topicEl?.classList.toggle('task-detail-modal__topic--empty', !task.topic);

    const collaboratorEl = this.modalEl.querySelector('[data-detail="collaborator"]');
    collaboratorEl?.classList.toggle('text-muted', !task.collaborator);

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
      low: { text: 'Baixa', className: 'bg-success-subtle text-success-emphasis' }
    };
    const priorityInfo = priorityLabels[task.priority] || { text: task.priority || '—', className: 'bg-secondary' };
    priorityEl.className = `badge ${priorityInfo.className}`;
    priorityEl.textContent = priorityInfo.text;

    const tagsContainer = this.modalEl.querySelector('[data-detail="tags"]');
    tagsContainer.innerHTML = '';
    if (Array.isArray(task.tags) && task.tags.length > 0) {
      task.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'badge rounded-pill task-detail-modal__tag';
        span.textContent = tag;
        tagsContainer.appendChild(span);
      });
    } else {
      const span = document.createElement('span');
      span.className = 'task-detail-modal__empty';
      span.textContent = 'Sem tags cadastradas.';
      tagsContainer.appendChild(span);
    }

    const notesEl = this.modalEl.querySelector('[data-detail="notes"]');
    const trimmedNotes = (task.notes || '').trim();
    if (trimmedNotes) {
      notesEl.textContent = trimmedNotes;
      notesEl.classList.remove('text-muted');
    } else {
      notesEl.textContent = 'Sem notas adicionais.';
      notesEl.classList.add('text-muted');
    }

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

    const topicEl = this.modalEl.querySelector('[data-detail="topic"]');
    topicEl?.classList.remove('task-detail-modal__topic--empty');

    const collaboratorEl = this.modalEl.querySelector('[data-detail="collaborator"]');
    collaboratorEl?.classList.remove('text-muted');

    const notesEl = this.modalEl.querySelector('[data-detail="notes"]');
    notesEl?.classList.remove('text-muted');

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

    statusBadge.className = `badge task-detail-modal__status-badge ${badgeClass}`;
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
  },

  _renderDependencies(dependencies) {
    const container = this.modalEl.querySelector('[data-detail="dependencies"]');
    if (!container) {
      return;
    }

    container.innerHTML = '';

    if (!Array.isArray(dependencies) || dependencies.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'task-detail-modal__empty';
      empty.textContent = 'Sem dependências vinculadas.';
      container.appendChild(empty);
      return;
    }

    dependencies.forEach(dependencyId => {
      const dependency = TaskModel.getTaskById(dependencyId);
      const item = document.createElement('div');
      item.className = 'task-detail-modal__dependency';

      const title = document.createElement('span');
      title.className = 'task-detail-modal__dependency-title';
      title.textContent = dependency?.title || 'Atividade removida';
      item.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'task-detail-modal__dependency-meta';

      if (dependency) {
        if (dependency.topic) {
          const topic = document.createElement('span');
          topic.className = 'badge task-detail-modal__dependency-topic';
          topic.textContent = dependency.topic;
          meta.appendChild(topic);
        }

        const statusId = TaskModel.resolveStatusId(dependency.status);
        const status = TaskModel.getStatusById(statusId);
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge ${status?.badgeClass || 'bg-secondary'}`;
        statusBadge.textContent = status?.label || 'A Fazer';
        meta.appendChild(statusBadge);

        const start = this._formatDate(dependency.startDate);
        const end = this._formatDate(dependency.dueDate);
        if (start !== '—' || end !== '—') {
          const dates = document.createElement('small');
          dates.className = 'text-muted';
          if (start === end) {
            dates.textContent = `Prazo: ${end}`;
          } else {
            const startLabel = start !== '—' ? `Início ${start}` : '';
            const endLabel = end !== '—' ? `Fim ${end}` : '';
            dates.textContent = [startLabel, endLabel].filter(Boolean).join(' · ');
          }
          meta.appendChild(dates);
        }
      } else {
        item.classList.add('task-detail-modal__dependency--missing');
        const missing = document.createElement('small');
        missing.className = 'text-muted';
        missing.textContent = 'Atividade original não encontrada.';
        meta.appendChild(missing);
      }

      item.appendChild(meta);
      container.appendChild(item);
    });
  },

  _initActionTooltips() {
    this.tooltips.forEach(tooltip => tooltip.dispose());
    this.tooltips = [];

    const actionButtons = this.modalEl?.querySelectorAll('[data-bs-toggle="tooltip"]') || [];
    actionButtons.forEach(button => {
      const instance = new bootstrap.Tooltip(button);
      this.tooltips.push(instance);
    });
  },

  _formatDate(dateString) {
    if (!dateString) {
      return '—';
    }

    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
      return dateString;
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(parsed);
  }
};
