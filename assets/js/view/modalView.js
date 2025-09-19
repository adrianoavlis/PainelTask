import { TaskModel } from '../model/taskModel.js';
import { EventBus } from '../core/eventBus.js';

export const ModalView = {
  modal: null,
  form: null,
  currentTask: null,

  init() {
    const modalHtml = `
    <div class="modal fade" id="taskModal" tabindex="-1" aria-labelledby="taskModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <form id="taskForm">
            <div class="modal-header">
              <h5 class="modal-title" id="taskModalLabel">Nova Tarefa</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body row g-3">
              <div class="col-md-6">
                <label class="form-label">Título</label>
                <input type="text" class="form-control" name="title" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Assunto</label>
                <select class="form-select" name="topic" required></select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Data de Início</label>
                <input type="date" class="form-control" name="startDate">
              </div>
              <div class="col-md-6">
                <label class="form-label">Data Final</label>
                <input type="date" class="form-control" name="dueDate">
              </div>
              <div class="col-md-6">
                <label class="form-label">Prioridade</label>
                <select class="form-select" name="priority">
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label">Tags (separe por vírgulas)</label>
                <input type="text" class="form-control" name="tags" placeholder="ex: urgente, backend, reunião">
              </div>
              <div class="col-12">
                <label class="form-label">Notas</label>
                <textarea class="form-control" name="notes" rows="3"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-success">Salvar</button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.updateTopicOptions();

    this.form = document.getElementById('taskForm');
    const modalEl = document.getElementById('taskModal');
    this.modal = new bootstrap.Modal(modalEl);

    modalEl.addEventListener('hidden.bs.modal', () => {
      this.resetForm();
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(this.form);
      const data = Object.fromEntries(formData.entries());
      data.tags = data.tags
        ? data.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
        : [];

      if (this.currentTask) {
        const existingTask = TaskModel.getTaskById(this.currentTask.id);
        if (existingTask) {
          const updatedTask = {
            ...existingTask,
            ...data,
            tags: data.tags
          };
          TaskModel.updateTask(updatedTask);
        }
      } else {
        TaskModel.addTask(data);
      }

      this.modal.hide();
    });
  },

  updateTopicOptions() {
    const select = document.querySelector('#taskForm select[name="topic"]');
    if (!select) return;
    const options = TaskModel.getTopics()
      .map(topic => `<option value="${topic}">${topic}</option>`)
      .join('');
    select.innerHTML = options;
  },

  open(task = null) {
    this.currentTask = task ? { ...task } : null;
    this.updateTopicOptions();
    this.form.reset();

    const title = document.getElementById('taskModalLabel');
    const submitBtn = this.form.querySelector('button[type="submit"]');

    if (this.currentTask) {
      title.textContent = 'Editar Tarefa';
      submitBtn.textContent = 'Atualizar';
      this.fillForm(this.currentTask);
    } else {
      title.textContent = 'Nova Tarefa';
      submitBtn.textContent = 'Salvar';
    }

    this.modal.show();
  },

  fillForm(task) {
    this.form.querySelector('input[name="title"]').value = task.title || '';
    this.form.querySelector('select[name="topic"]').value = task.topic || '';
    this.form.querySelector('input[name="startDate"]').value = task.startDate || '';
    this.form.querySelector('input[name="dueDate"]').value = task.dueDate || '';
    this.form.querySelector('select[name="priority"]').value = task.priority || 'low';
    this.form.querySelector('input[name="tags"]').value = Array.isArray(task.tags) ? task.tags.join(', ') : '';
    this.form.querySelector('textarea[name="notes"]').value = task.notes || '';
  },

  resetForm() {
    if (!this.form) return;
    this.currentTask = null;
    this.form.reset();
    document.getElementById('taskModalLabel').textContent = 'Nova Tarefa';
    this.form.querySelector('button[type="submit"]').textContent = 'Salvar';
  }
};

EventBus.on('dataLoaded', () => ModalView.updateTopicOptions());
EventBus.on('taskAdded', () => ModalView.updateTopicOptions());
EventBus.on('taskUpdated', () => ModalView.updateTopicOptions());
EventBus.on('openTaskModal', (task) => ModalView.open(task));
