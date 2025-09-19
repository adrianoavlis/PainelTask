import { TaskModel } from '../model/taskModel.js';
import { EventBus } from '../core/eventBus.js';
import { ToastView } from './toastView.js';

export const StatusManagerView = {
  modal: null,
  modalEl: null,
  listEl: null,
  formEl: null,
  inputEl: null,

  dragSetup: false,
  modalInitBound: false,
  pendingOpen: false,


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

                <p class="text-muted small mb-2">Arraste os status para definir a ordem do fluxo.</p>

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

    this._ensureModalInstance();

    this.listEl = this.modalEl.querySelector('[data-status-list]');
    this.formEl = this.modalEl.querySelector('#statusManagerForm');
    this.inputEl = this.modalEl.querySelector('#statusManagerInput');

    this._setupDragAndDrop();

    this.modalEl.addEventListener('shown.bs.modal', () => {
      this.inputEl?.focus();
    });

    this.formEl.addEventListener('submit', (event) => {
      event.preventDefault();
      this._handleAddStatus();
    });
  },

  open() {

    if (!this._ensureModalInstance()) {
      if (!this.pendingOpen && document.readyState !== 'complete') {
        this.pendingOpen = true;
        window.addEventListener('load', () => {
          this.pendingOpen = false;
          this.open();
        }, { once: true });
        return;
      }

      ToastView.show('Não foi possível abrir o gerenciador de status no momento.', 'danger');
      return;
    }

    this.pendingOpen = false;

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

    statuses.forEach((status, index) => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-center gap-2 flex-wrap';
      item.dataset.statusItem = status.id;

      const previousOrder = typeof status.order === 'number' ? status.order : index;
      item.style.cursor = 'grab';

      this._setItemDragBehavior(item);

      const infoContainer = document.createElement('div');
      infoContainer.className = 'd-flex align-items-center gap-2 flex-wrap flex-grow-1';

      const dragHandle = document.createElement('span');
      dragHandle.className = 'text-muted small user-select-none';
      dragHandle.innerHTML = '&#x2630;';
      dragHandle.setAttribute('aria-hidden', 'true');
      dragHandle.title = 'Arraste para reordenar';

      const orderBadge = document.createElement('span');
      orderBadge.className = 'badge rounded-pill text-bg-light text-dark border';
      orderBadge.textContent = `#${previousOrder + 1}`;

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


      infoContainer.appendChild(dragHandle);
      infoContainer.appendChild(orderBadge);

      infoContainer.appendChild(badge);
      infoContainer.appendChild(code);
      infoContainer.appendChild(countBadge);

      const actions = document.createElement('div');
      actions.className = 'app-circle-action-group flex-shrink-0';

      const renameBtn = document.createElement('button');
      renameBtn.type = 'button';
      renameBtn.className = 'app-circle-action app-circle-action--edit';

      renameBtn.innerHTML = `
        <span class="app-circle-action__icon" aria-hidden="true">
          <i class="fa-solid fa-pen"></i>
          <small>Editar</small>
        </span>
      `.trim();
      renameBtn.setAttribute('aria-label', 'Renomear status');
      renameBtn.title = 'Renomear';
      renameBtn.draggable = false;

      renameBtn.addEventListener('click', () => {
        this._handleRenameStatus(status);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'app-circle-action app-circle-action--delete';
      deleteBtn.innerHTML = `
        <span class="app-circle-action__icon" aria-hidden="true">
          <i class="fa-solid fa-trash"></i>
          <small>Excluir</small>
        </span>
      `.trim();
      deleteBtn.setAttribute('aria-label', 'Excluir status');
      deleteBtn.title = 'Excluir';

      deleteBtn.draggable = false;

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

      minimum: 'Mantenha pelo menos um status cadastrado.',
      order: 'Não foi possível reordenar os status.'

    };

    const message = messages[reason] || 'Não foi possível completar a ação.';
    ToastView.show(message, 'danger');

  },

  _ensureModalInstance() {
    if (this.modal || !this.modalEl) {
      return Boolean(this.modal);
    }

    const ModalCtor = window.bootstrap?.Modal;
    if (typeof ModalCtor === 'function') {
      this.modal = new ModalCtor(this.modalEl);
      return true;
    }

    if (!this.modalInitBound) {
      this.modalInitBound = true;
      window.addEventListener('load', () => {
        if (this.modal || !this.modalEl) {
          return;
        }
        const LateCtor = window.bootstrap?.Modal;
        if (typeof LateCtor === 'function') {
          this.modal = new LateCtor(this.modalEl);
        }
      }, { once: true });
    }

    return false;

  },

  _setupDragAndDrop() {
    if (!this.listEl || this.dragSetup) {
      return;
    }

    this.listEl.addEventListener('dragover', (event) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }

      const dragging = this.listEl.querySelector('.dragging');
      if (!dragging) {
        return;
      }

      const afterElement = this._getDragAfterElement(event.clientY);
      if (!afterElement) {
        this.listEl.appendChild(dragging);
      } else if (afterElement !== dragging) {
        this.listEl.insertBefore(dragging, afterElement);
      }
    });

    this.listEl.addEventListener('drop', (event) => {
      event.preventDefault();

      const dragging = this.listEl.querySelector('.dragging');
      if (!dragging) {
        return;
      }

      const newOrder = Array.from(this.listEl.querySelectorAll('[data-status-item]'))
        .map(item => item.dataset.statusItem)
        .filter(Boolean);

      const result = TaskModel.reorderStatuses(newOrder);
      if (!result.success) {
        this._showError('order');
        this.render();
        return;
      }

      if (!result.reordered) {
        this.render();
      }
    });

    this.dragSetup = true;
  },

  _setItemDragBehavior(item) {
    item.setAttribute('draggable', 'true');
    item.addEventListener('dragstart', (event) => {
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', item.dataset.statusItem || '');
      }

      item.classList.add('dragging', 'opacity-75');
      this.listEl?.classList.add('status-dragging-active');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging', 'opacity-75');
      this.listEl?.classList.remove('status-dragging-active');
    });
  },

  _getDragAfterElement(cursorY) {
    if (!this.listEl) {
      return null;
    }

    const items = Array.from(this.listEl.querySelectorAll('[data-status-item]:not(.dragging)'));
    if (items.length === 0) {
      return null;
    }

    return items.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = cursorY - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }

      return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;

  }
};
