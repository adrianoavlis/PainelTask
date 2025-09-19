import { TaskModel } from '../model/taskModel.js';
import { ToastView } from './toastView.js';
import { EventBus } from '../core/eventBus.js';

export const TopicManagerView = {
  init() {
    this.manageBtn = document.getElementById('manage-topics');
    if (!this.manageBtn) return;
    this.manageBtn.addEventListener('click', () => this.open());
    this.renderModal();
  },

  renderModal() {
    const modalHtml = `
    <div class="modal fade" id="topicManagerModal" tabindex="-1" aria-labelledby="topicManagerLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="topicManagerLabel">Gerenciar assuntos</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <form id="topic-form" class="row g-2">
              <div class="col-12">
                <label for="topic-name-input" class="form-label">Nome do assunto</label>
                <input type="text" class="form-control" id="topic-name-input" placeholder="Ex: Trabalho, Estudos" required>
              </div>
              <div class="col-12 d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-outline-secondary btn-sm d-none" id="topic-cancel-edit">Cancelar</button>
                <button type="submit" class="btn btn-primary btn-sm" id="topic-submit-btn">Adicionar assunto</button>
              </div>
            </form>
            <hr>
            <p class="text-muted small mb-2">Selecione um assunto para editar ou remover. Tarefas de assuntos excluídos também serão apagadas.</p>
            <ul class="list-group" id="topic-list"></ul>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    this.modalEl = document.getElementById('topicManagerModal');
    this.listEl = this.modalEl.querySelector('#topic-list');
    this.formEl = this.modalEl.querySelector('#topic-form');
    this.inputEl = this.modalEl.querySelector('#topic-name-input');
    this.submitBtn = this.modalEl.querySelector('#topic-submit-btn');
    this.cancelEditBtn = this.modalEl.querySelector('#topic-cancel-edit');
    this.currentTopic = null;

    this.formEl.addEventListener('submit', (event) => {
      event.preventDefault();
      this.handleSubmit();
    });

    this.cancelEditBtn.addEventListener('click', () => this.resetForm());

    this.listEl.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      const topicIndex = Number.parseInt(target.dataset.topicIndex, 10);
      if (Number.isNaN(topicIndex)) return;
      const topics = TaskModel.getTopics();
      const topicName = topics[topicIndex];
      if (!topicName) return;

      if (target.dataset.action === 'edit') {
        this.startEditing(topicName);
      } else if (target.dataset.action === 'delete') {
        this.deleteTopic(topicName);
      }
    });
  },

  escapeHtml(value) {
    if (!value) return '';
    return value.replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  },

  open() {
    this.resetForm();
    this.updateList();
    const modal = new bootstrap.Modal(this.modalEl);
    modal.show();
  },

  updateList() {
    if (!this.listEl) return;
    const topics = TaskModel.getTopics();
    if (topics.length === 0) {
      this.listEl.innerHTML = '<li class="list-group-item text-muted">Nenhum assunto cadastrado.</li>';
      return;
    }

    this.listEl.innerHTML = topics.map((topic, index) => {
      const safeTopic = this.escapeHtml(topic);
      return `
        <li class="list-group-item d-flex align-items-center justify-content-between gap-2">
          <span class="flex-grow-1">${safeTopic}</span>
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-primary" data-action="edit" data-topic-index="${index}">Editar</button>
            <button type="button" class="btn btn-outline-danger" data-action="delete" data-topic-index="${index}">Excluir</button>
          </div>
        </li>`;
    }).join('');
  },

  startEditing(topicName) {
    this.currentTopic = topicName;
    this.inputEl.value = topicName;
    this.submitBtn.textContent = 'Salvar alterações';
    this.cancelEditBtn.classList.remove('d-none');
    this.inputEl.focus();
  },

  resetForm() {
    this.currentTopic = null;
    this.inputEl.value = '';
    this.submitBtn.textContent = 'Adicionar assunto';
    this.cancelEditBtn.classList.add('d-none');
  },

  handleSubmit() {
    const value = this.inputEl.value.trim();
    if (!value) {
      ToastView.show('Informe um nome para o assunto.', 'warning');
      return;
    }

    if (this.currentTopic) {
      const result = TaskModel.renameTopic(this.currentTopic, value);
      if (!result.success) {
        ToastView.show(result.message, 'warning');
        return;
      }
      ToastView.show('Assunto atualizado com sucesso!', 'success');
    } else {
      const result = TaskModel.addTopic(value);
      if (!result.success) {
        ToastView.show(result.message, 'warning');
        return;
      }
      ToastView.show('Assunto adicionado com sucesso!', 'success');
    }

    this.resetForm();
    this.updateList();
  },

  deleteTopic(topicName) {
    const tasks = TaskModel.getTasksByTopic(topicName);
    const hasTasks = tasks.length > 0;
    const confirmationMessage = hasTasks
      ? `O assunto "${topicName}" possui ${tasks.length} tarefa(s). Ao prosseguir, elas também serão excluídas. Deseja continuar?`
      : `Deseja realmente excluir o assunto "${topicName}"?`;

    if (!confirm(confirmationMessage)) {
      return;
    }

    const result = TaskModel.removeTopic(topicName);
    if (!result.success) {
      ToastView.show(result.message, 'warning');
      return;
    }

    const successMessage = result.removedTasks > 0
      ? `Assunto e ${result.removedTasks} tarefa(s) associada(s) removidos.`
      : 'Assunto removido com sucesso!';

    ToastView.show(successMessage, 'success');
    this.resetForm();
    this.updateList();
  }
};

EventBus.on('topicsChanged', () => {
  TopicManagerView.updateList();
});
