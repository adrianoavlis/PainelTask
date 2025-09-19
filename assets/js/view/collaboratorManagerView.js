import { TaskModel } from '../model/taskModel.js';
import { EventBus } from '../core/eventBus.js';
import { ToastView } from './toastView.js';

export const CollaboratorManagerView = {
  modal: null,
  modalEl: null,
  listEl: null,
  formEl: null,
  inputEl: null,

  init() {
    const manageButton = document.getElementById('manage-collaborators');
    if (!manageButton) return;

    this._injectModal();

    manageButton.addEventListener('click', () => {
      this.open();
    });

    EventBus.on('dataLoaded', () => this.render());
    EventBus.on('collaboratorsChanged', () => this.render());
  },

  _injectModal() {
    if (this.modalEl) return;

    const modalHtml = `
      <div class="modal fade" id="collaboratorManagerModal" tabindex="-1" aria-labelledby="collaboratorManagerLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="collaboratorManagerLabel">Gerenciar Colaboradores</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
              <form id="collaboratorManagerForm" class="row g-2">
                <div class="col-12">
                  <label class="form-label" for="collaboratorManagerInput">Adicionar novo colaborador</label>
                  <div class="input-group">
                    <input type="text" class="form-control" id="collaboratorManagerInput" placeholder="ex: Maria Silva" required>
                    <button class="btn btn-success" type="submit">Adicionar</button>
                  </div>
                </div>
              </form>
              <div class="mt-4">
                <h6 class="fw-semibold">Colaboradores cadastrados</h6>
                <div data-collaborator-list class="list-group"></div>
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

    this.modalEl = document.getElementById('collaboratorManagerModal');
    this.modal = new bootstrap.Modal(this.modalEl);
    this.listEl = this.modalEl.querySelector('[data-collaborator-list]');
    this.formEl = this.modalEl.querySelector('#collaboratorManagerForm');
    this.inputEl = this.modalEl.querySelector('#collaboratorManagerInput');

    this.modalEl.addEventListener('shown.bs.modal', () => {
      this.inputEl?.focus();
    });

    this.formEl.addEventListener('submit', (event) => {
      event.preventDefault();
      this._handleAddCollaborator();
    });
  },

  open() {
    if (!this.modal) return;
    this.render();
    this.modal.show();
  },

  render() {
    if (!this.listEl) return;
    const collaborators = TaskModel.getCollaborators();
    this.listEl.innerHTML = '';

    if (!Array.isArray(collaborators) || collaborators.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'list-group-item text-muted';
      emptyItem.textContent = 'Nenhum colaborador cadastrado.';
      this.listEl.appendChild(emptyItem);
      return;
    }

    collaborators.forEach(collaborator => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-center';

      const title = document.createElement('span');
      title.textContent = collaborator;
      title.className = 'me-3';

      const actions = document.createElement('div');
      actions.className = 'btn-group btn-group-sm';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-outline-secondary';
      editBtn.textContent = 'Renomear';
      editBtn.addEventListener('click', () => {
        this._handleRenameCollaborator(collaborator);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-outline-danger';
      deleteBtn.textContent = 'Excluir';
      deleteBtn.addEventListener('click', () => {
        this._handleRemoveCollaborator(collaborator);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(title);
      item.appendChild(actions);
      this.listEl.appendChild(item);
    });
  },

  _handleAddCollaborator() {
    const value = this.inputEl?.value ?? '';
    const result = TaskModel.addCollaborator(value);

    if (!result.success) {
      this._showError(result.reason);
      return;
    }

    this.inputEl.value = '';
  },

  _handleRenameCollaborator(collaborator) {
    const newName = prompt('Informe o novo nome para o colaborador:', collaborator);
    if (newName === null) {
      return;
    }

    const result = TaskModel.updateCollaborator(collaborator, newName);
    if (!result.success) {
      this._showError(result.reason);
    }
  },

  _handleRemoveCollaborator(collaborator) {
    const confirmation = confirm(`Deseja realmente excluir o colaborador "${collaborator}"?`);
    if (!confirmation) {
      return;
    }

    const result = TaskModel.removeCollaborator(collaborator);
    if (!result.success) {
      this._showError(result.reason);
    }
  },

  _showError(reason) {
    const messages = {
      empty: 'Informe um nome válido para o colaborador.',
      duplicate: 'Já existe um colaborador com esse nome.',
      notfound: 'Colaborador não encontrado.',
      unchanged: 'O colaborador já possui esse nome.'
    };

    const message = messages[reason] || 'Não foi possível completar a ação.';
    ToastView.show(message, 'danger');
  }
};
