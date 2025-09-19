import { TaskModel } from '../model/taskModel.js';
import { EventBus } from '../core/eventBus.js';
import { ToastView } from './toastView.js';

export const StatusManagerView = {
  modal: null,
  modalEl: null,
  listEl: null,
  formEl: null,
  inputEl: null,

  init() {
    const manageButton = document.getElementById('manage-statuses');
    if (!manageButton) return;

    this._injectModal();

    manageButton.addEventListener('click', () => {
      this.open();
    });

    EventBus.on('dataLoaded', () => this.render());
    EventBus.on('statusesChanged', () => this.render());
  },

  _injectModal() {
    if (this.modalEl) return;

    const modalHtml = `
      <div class="modal fade" id="statusManagerModal" tabindex="-1" aria-labelledby="statusManagerLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="statusManagerLabel">Gerenciar Status</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
              <form id="statusManagerForm" class="row g-2">
                <div class="col-12">
                  <label class="form-label" for="statusManagerInput">Adicionar novo status</label>
                  <div class="input-group">
                    <input type="text" class="form-control" id="statusManagerInput" placeholder="ex: Em Revisão" required>
                    <button class="btn btn-success" type="submit">Adicionar</button>
                  </div>
                </div>
              </form>
              <div class="mt-4">
                <h6 class="fw-semibold">Status cadastrados</h6>
                <div data-status-list class="list-group"></div>
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

    this.modalEl = document.getElementById('statusManagerModal');
    this.modal = new bootstrap.Modal(this.modalEl);
    this.listEl = this.modalEl.querySelector('[data-status-list]');
    this.formEl = this.modalEl.querySelector('#statusManagerForm');
    this.inputEl = this.modalEl.querySelector('#statusManagerInput');

    this.modalEl.addEventListener('shown.bs.modal', () => {
      this.inputEl?.focus();
    });

    this.formEl.addEventListener('submit', (event) => {
      event.preventDefault();
      this._handleAddStatus();
    });
  },

  open() {
    if (!this.modal) return;
    this.render();
    this.modal.show();
  },

  render() {
    if (!this.listEl) return;

    const statuses = TaskModel.getStatuses();
    this.listEl.innerHTML = '';

    if (!Array.isArray(statuses) || statuses.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'list-group-item text-muted';
      emptyItem.textContent = 'Nenhum status cadastrado.';
      this.listEl.appendChild(emptyItem);
      return;
    }

    const tasks = TaskModel.getTasks();

    statuses.forEach(status => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-center gap-2 flex-wrap';

      const infoContainer = document.createElement('div');
      infoContainer.className = 'd-flex align-items-center gap-2';

      const badge = document.createElement('span');
      badge.className = `badge ${status.badgeClass || 'text-bg-secondary'}`;
      badge.textContent = status.label;

      const code = document.createElement('span');
      code.className = 'text-muted small';
      code.textContent = `(${status.id})`;

      const count = tasks.filter(task => task.status === status.id).length;
      const countBadge = document.createElement('span');
      countBadge.className = 'badge bg-light text-dark';
      countBadge.textContent = `${count} tarefa${count === 1 ? '' : 's'}`;

      infoContainer.appendChild(badge);
      infoContainer.appendChild(code);
      infoContainer.appendChild(countBadge);

      const actions = document.createElement('div');
      actions.className = 'btn-group btn-group-sm';

      const renameBtn = document.createElement('button');
      renameBtn.type = 'button';
      renameBtn.className = 'btn btn-outline-secondary';
      renameBtn.textContent = 'Renomear';
      renameBtn.addEventListener('click', () => {
        this._handleRenameStatus(status);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-outline-danger';
      deleteBtn.textContent = 'Excluir';
      deleteBtn.addEventListener('click', () => {
        this._handleRemoveStatus(status);
      });

      actions.appendChild(renameBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(infoContainer);
      item.appendChild(actions);

      this.listEl.appendChild(item);
    });
  },

  _handleAddStatus() {
    const value = this.inputEl?.value ?? '';
    const result = TaskModel.addStatus(value);

    if (!result.success) {
      this._showError(result.reason);
      return;
    }

    this.inputEl.value = '';
  },

  _handleRenameStatus(status) {
    const newLabel = prompt('Informe o novo nome para o status:', status.label);
    if (newLabel === null) {
      return;
    }

    const result = TaskModel.updateStatus(status.id, newLabel);
    if (!result.success) {
      this._showError(result.reason);
    }
  },

  _handleRemoveStatus(status) {
    const confirmation = confirm(`Deseja realmente excluir o status "${status.label}"?`);
    if (!confirmation) {
      return;
    }

    const result = TaskModel.removeStatus(status.id);
    if (!result.success) {
      this._showError(result.reason);
    }
  },

  _showError(reason) {
    const messages = {
      empty: 'Informe um nome válido para o status.',
      duplicate: 'Já existe um status com esse nome.',
      unchanged: 'O status já possui esse nome.',
      notfound: 'Status não encontrado.',
      minimum: 'Mantenha pelo menos um status cadastrado.'
    };

    const message = messages[reason] || 'Não foi possível completar a ação.';
    ToastView.show(message, 'danger');
  }
};
