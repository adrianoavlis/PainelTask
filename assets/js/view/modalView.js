import { TaskModel } from '../model/taskModel.js';
import { EventBus } from '../core/eventBus.js';

export const ModalView = {
  modal: null,
  form: null,
  currentTask: null,
  dependencySearchInput: null,

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
                <label class="form-label">Colaborador</label>
                <select class="form-select" name="collaborator"></select>
              </div>
              <div class="col-12">
                <label class="form-label">Dependências</label>
                <div class="dependency-field">
                  <input type="text" class="form-control mb-2" placeholder="Pesquisar atividades" data-dependency-search>
                  <select class="form-select" name="dependencies" multiple size="6" data-dependency-options></select>
                  <div class="form-text">Selecione as atividades que precisam ser concluídas antes desta.</div>
                </div>
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
    this.form = document.getElementById('taskForm');
    const modalEl = document.getElementById('taskModal');
    this.modal = new bootstrap.Modal(modalEl);
    this.dependencySearchInput = this.form?.querySelector('[data-dependency-search]') || null;

    this.updateTopicOptions();
    this.updateCollaboratorOptions();
    this.updateDependencyOptions();

    if (this.dependencySearchInput) {
      this.dependencySearchInput.addEventListener('input', () => {
        this.filterDependencyOptions();
      });
    }

    modalEl.addEventListener('hidden.bs.modal', () => {
      this.resetForm();
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(this.form);
      const dependencies = formData.getAll('dependencies').filter(Boolean);
      const dataEntries = [...formData.entries()].filter(([key]) => key !== 'dependencies');
      const data = Object.fromEntries(dataEntries);
      data.dependencies = dependencies;
      data.tags = data.tags
        ? data.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
        : [];
      data.collaborator = data.collaborator ? data.collaborator : null;

      if (this.currentTask) {
        const existingTask = TaskModel.getTaskById(this.currentTask.id);
        if (existingTask) {
          const updatedTask = {
            ...existingTask,
            ...data,
            tags: data.tags,
            dependencies: data.dependencies
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

  updateCollaboratorOptions() {
    const select = document.querySelector('#taskForm select[name="collaborator"]');
    if (!select) return;
    const collaborators = TaskModel.getCollaborators();
    const options = [`<option value="">Sem colaborador</option>`]
      .concat(collaborators.map(collaborator => `<option value="${collaborator}">${collaborator}</option>`))
      .join('');
    select.innerHTML = options;
  },

  updateDependencyOptions(selectedValues = null) {
    const select = this.form
      ? this.form.querySelector('select[name="dependencies"]')
      : document.querySelector('#taskForm select[name="dependencies"]');
    if (!select) return;

    const currentSelections = Array.isArray(selectedValues)
      ? selectedValues
      : Array.from(select.selectedOptions || []).map(option => option.value);
    const excludeId = this.currentTask?.id ?? null;
    const tasks = TaskModel.getTasks();
    const normalizedSelection = new Set(currentSelections);

    select.innerHTML = '';

    tasks.forEach(task => {
      if (!task || task.id === excludeId) {
        return;
      }

      const option = document.createElement('option');
      option.value = task.id;
      const topicLabel = task.topic ? ` (${task.topic})` : '';
      option.textContent = `${task.title || 'Tarefa sem título'}${topicLabel}`;
      option.title = option.textContent;
      if (normalizedSelection.has(task.id)) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    this.filterDependencyOptions();
  },

  filterDependencyOptions() {
    const select = this.form
      ? this.form.querySelector('select[name="dependencies"]')
      : document.querySelector('#taskForm select[name="dependencies"]');
    const searchInput = this.dependencySearchInput
      || (this.form ? this.form.querySelector('[data-dependency-search]') : document.querySelector('[data-dependency-search]'));

    if (!select) return;

    const term = searchInput?.value?.toLowerCase().trim() || '';
    Array.from(select.options || []).forEach(option => {
      const text = option.textContent.toLowerCase();
      option.hidden = term !== '' && !text.includes(term);
    });
  },

  open(task = null) {
    this.currentTask = task ? { ...task } : null;
    this.updateTopicOptions();
    this.updateCollaboratorOptions();
    const dependencies = this.currentTask?.dependencies ?? [];
    this.updateDependencyOptions(Array.isArray(dependencies) ? dependencies : []);
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
    const collaboratorSelect = this.form.querySelector('select[name="collaborator"]');
    if (collaboratorSelect) {
      const options = Array.from(collaboratorSelect.options).map(option => option.value);
      const value = task.collaborator && options.includes(task.collaborator)
        ? task.collaborator
        : '';
      collaboratorSelect.value = value;
    }
    this.form.querySelector('input[name="startDate"]').value = task.startDate || '';
    this.form.querySelector('input[name="dueDate"]').value = task.dueDate || '';
    this.form.querySelector('select[name="priority"]').value = task.priority || 'low';
    this.form.querySelector('input[name="tags"]').value = Array.isArray(task.tags) ? task.tags.join(', ') : '';
    this.form.querySelector('textarea[name="notes"]').value = task.notes || '';
    const dependencies = Array.isArray(task.dependencies) ? task.dependencies : [];
    this.updateDependencyOptions(dependencies);
    const dependencySelect = this.form.querySelector('select[name="dependencies"]');
    if (dependencySelect) {
      Array.from(dependencySelect.options || []).forEach(option => {
        option.selected = dependencies.includes(option.value);
      });
    }
    if (this.dependencySearchInput) {
      this.dependencySearchInput.value = '';
    }
    this.filterDependencyOptions();
  },

  resetForm() {
    if (!this.form) return;
    this.currentTask = null;
    this.form.reset();
    document.getElementById('taskModalLabel').textContent = 'Nova Tarefa';
    this.form.querySelector('button[type="submit"]').textContent = 'Salvar';
    this.updateDependencyOptions([]);
    if (this.dependencySearchInput) {
      this.dependencySearchInput.value = '';
    }
    this.filterDependencyOptions();
  }
};

EventBus.on('dataLoaded', () => ModalView.updateTopicOptions());
EventBus.on('taskAdded', () => ModalView.updateTopicOptions());
EventBus.on('taskUpdated', () => ModalView.updateTopicOptions());
EventBus.on('topicsChanged', () => ModalView.updateTopicOptions());
EventBus.on('dataLoaded', () => ModalView.updateCollaboratorOptions());
EventBus.on('collaboratorsChanged', () => ModalView.updateCollaboratorOptions());
EventBus.on('openTaskModal', (task) => ModalView.open(task));
EventBus.on('dataLoaded', () => ModalView.updateDependencyOptions());
EventBus.on('taskAdded', () => ModalView.updateDependencyOptions());
EventBus.on('taskUpdated', () => ModalView.updateDependencyOptions());
EventBus.on('taskRemoved', () => ModalView.updateDependencyOptions());
EventBus.on('tasksBulkUpdated', () => ModalView.updateDependencyOptions());
