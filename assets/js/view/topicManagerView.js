import { TaskModel } from '../model/taskModel.js';
import { EventBus } from '../core/eventBus.js';
import { ToastView } from './toastView.js';

export const TopicManagerView = {
  modal: null,
  modalEl: null,
  listEl: null,
  formEl: null,
  inputEl: null,

  init() {
    const manageButton = document.getElementById('manage-topics');
    if (!manageButton) return;

    this._injectModal();

    manageButton.addEventListener('click', () => {
      this.open();
    });

    EventBus.on('dataLoaded', () => this.render());
    EventBus.on('topicsChanged', () => this.render());
  },

  _injectModal() {
    if (this.modalEl) return;

    const modalHtml = `
      <div class="modal fade" id="topicManagerModal" tabindex="-1" aria-labelledby="topicManagerLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="topicManagerLabel">Gerenciar Assuntos</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
              <form id="topicManagerForm" class="row g-2">
                <div class="col-12">
                  <label class="form-label" for="topicManagerInput">Adicionar novo assunto</label>
                  <div class="input-group">
                    <input type="text" class="form-control" id="topicManagerInput" placeholder="ex: Pessoal" required>
                    <button class="btn btn-primary" type="submit">Adicionar</button>
                  </div>
                </div>
              </form>
              <div class="mt-4">
                <h6 class="fw-semibold">Assuntos existentes</h6>
                <div data-topic-list class="list-group"></div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    this.modalEl = document.getElementById('topicManagerModal');
    this.modal = new bootstrap.Modal(this.modalEl);
    this.listEl = this.modalEl.querySelector('[data-topic-list]');
    this.formEl = this.modalEl.querySelector('#topicManagerForm');
    this.inputEl = this.modalEl.querySelector('#topicManagerInput');

    this.modalEl.addEventListener('shown.bs.modal', () => {
      this.inputEl?.focus();
    });

    this.formEl.addEventListener('submit', (event) => {
      event.preventDefault();
      this._handleAddTopic();
    });
  },

  open() {
    if (!this.modal) return;
    this.render();
    this.modal.show();
  },

  render() {
    if (!this.listEl) return;
    const topics = TaskModel.getTopics();
    this.listEl.innerHTML = '';

    if (!Array.isArray(topics) || topics.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'list-group-item text-muted';
      emptyItem.textContent = 'Nenhum assunto cadastrado.';
      this.listEl.appendChild(emptyItem);
      return;
    }

    topics.forEach(topic => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-center';

      const title = document.createElement('span');
      title.textContent = topic;
      title.className = 'me-3';

      const actions = document.createElement('div');
      actions.className = 'btn-group btn-group-sm';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-outline-secondary';
      editBtn.textContent = 'Renomear';
      editBtn.addEventListener('click', () => {
        this._handleRenameTopic(topic);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-outline-danger';
      deleteBtn.textContent = 'Excluir';
      deleteBtn.addEventListener('click', () => {
        this._handleRemoveTopic(topic);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(title);
      item.appendChild(actions);
      this.listEl.appendChild(item);
    });
  },

  _handleAddTopic() {
    const value = this.inputEl?.value ?? '';
    const result = TaskModel.addTopic(value);

    if (!result.success) {
      this._showError(result.reason);
      return;
    }

    this.inputEl.value = '';
  },

  _handleRenameTopic(topic) {
    const newName = prompt('Informe o novo nome para o assunto:', topic);
    if (newName === null) {
      return;
    }

    const result = TaskModel.updateTopic(topic, newName);
    if (!result.success) {
      this._showError(result.reason);
    }
  },

  _handleRemoveTopic(topic) {
    const confirmation = confirm(`Deseja realmente excluir o assunto "${topic}"?`);
    if (!confirmation) {
      return;
    }

    const result = TaskModel.removeTopic(topic);
    if (!result.success) {
      this._showError(result.reason);
    }
  },

  _showError(reason) {
    const messages = {
      empty: 'Informe um nome válido para o assunto.',
      duplicate: 'Já existe um assunto com esse nome.',
      notfound: 'Assunto não encontrado.',
      unchanged: 'O assunto já possui esse nome.'
    };

    const message = messages[reason] || 'Não foi possível completar a ação.';
    ToastView.show(message, 'danger');
  }
};
