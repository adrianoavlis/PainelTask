import { TaskModel } from '../model/taskModel.js';
import { EventBus } from '../core/eventBus.js';

export const ModalView = {
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

    const form = document.getElementById('taskForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      data.tags = data.tags
        ? data.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
        : [];

      TaskModel.addTask(data);
      bootstrap.Modal.getInstance(document.getElementById('taskModal')).hide();
      form.reset();
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

  open() {
    const modalEl = document.getElementById('taskModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
};

EventBus.on('dataLoaded', () => ModalView.updateTopicOptions());
EventBus.on('taskAdded', () => ModalView.updateTopicOptions());
EventBus.on('taskUpdated', () => ModalView.updateTopicOptions());
EventBus.on('openTaskModal', () => ModalView.open());
