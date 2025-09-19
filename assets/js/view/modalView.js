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
      <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div class="modal-content task-form-modal">
          <form id="taskForm" class="task-form-modal__form">
            <div class="task-form-modal__hero">
              <div class="task-form-modal__hero-main">
                <span class="task-form-modal__badge">
                  <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                  Gestão de tarefa
                </span>
                <h2 class="task-form-modal__title" id="taskModalLabel">Nova Tarefa</h2>
                <p class="task-form-modal__subtitle">Atualize os dados para manter o cronograma alinhado.</p>
              </div>
              <button type="button" class="btn-close btn-close-white task-form-modal__close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>

            <div class="task-form-modal__body">
              <section class="task-form-modal__section">
                <h6 class="task-form-modal__section-title">
                  <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                  Informações principais
                </h6>
                <div class="row g-4">
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
                  <div class="col-md-6">
                    <label class="form-label">Prioridade</label>
                    <select class="form-select" name="priority">
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>
              </section>

              <section class="task-form-modal__section">
                <h6 class="task-form-modal__section-title">
                  <i class="fa-solid fa-calendar-days" aria-hidden="true"></i>
                  Planejamento
                </h6>
                <div class="row g-4">
                  <div class="col-md-6">
                    <label class="form-label">Data de início</label>
                    <input type="date" class="form-control" name="startDate">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Data final</label>
                    <input type="date" class="form-control" name="dueDate">
                  </div>
                </div>
              </section>

              <section class="task-form-modal__section">
                <h6 class="task-form-modal__section-title">
                  <i class="fa-solid fa-diagram-project" aria-hidden="true"></i>
                  Dependências
                </h6>
                <div class="row g-4 align-items-start">
                  <div class="col-12 col-lg-5">
                    <label class="form-label" for="taskDependencySearch">Pesquisar atividades</label>
                    <div class="input-group task-form-modal__search">
                      <span class="input-group-text"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></span>
                      <input type="text" id="taskDependencySearch" class="form-control" placeholder="Digite para filtrar" data-dependency-search>
                    </div>
                    <div class="form-text">Use a busca para localizar rapidamente as atividades relacionadas.</div>
                  </div>
                  <div class="col-12 col-lg-7">
                    <label class="form-label" for="taskDependencySelect">Atividades prévias</label>
                    <select id="taskDependencySelect" class="form-select task-form-modal__dependencies-select" name="dependencies" multiple size="6" data-dependency-options></select>
                    <div class="form-text">Selecione as atividades que precisam ser concluídas antes desta.</div>
                  </div>
                </div>
              </section>

              <section class="task-form-modal__section">
                <h6 class="task-form-modal__section-title">
                  <i class="fa-solid fa-notes-medical" aria-hidden="true"></i>
                  Contexto adicional
                </h6>
                <div class="row g-4">
                  <div class="col-12">
                    <label class="form-label">Tags (separe por vírgulas)</label>
                    <input type="text" class="form-control" name="tags" placeholder="ex: urgente, backend, reunião">
                  </div>
                  <div class="col-12">
                    <label class="form-label">Notas</label>
                    <textarea class="form-control task-form-modal__notes" name="notes" rows="4"></textarea>
                  </div>
                </div>
              </section>
            </div>

            <div class="task-form-modal__footer">
              <div class="task-form-modal__footer-info">
                <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
                <span>Mantenha as informações atualizadas para melhorar a visualização.</span>
              </div>
              <div class="task-form-modal__actions">
                <button type="button" class="btn btn-outline-light" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-success task-form-modal__submit">
                  <i class="fa-solid fa-floppy-disk me-2" aria-hidden="true"></i>
                  <span data-task-form-submit-label>Salvar</span>
                </button>
              </div>
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

  setSubmitButtonText(text) {
    if (!this.form) return;
    const submitBtn = this.form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    const labelEl = submitBtn.querySelector('[data-task-form-submit-label]');
    if (labelEl) {
      labelEl.textContent = text;
    } else {
      submitBtn.textContent = text;
    }
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

    if (this.currentTask) {
      title.textContent = 'Editar Tarefa';
      this.setSubmitButtonText('Atualizar');
      this.fillForm(this.currentTask);
    } else {
      title.textContent = 'Nova Tarefa';
      this.setSubmitButtonText('Salvar');
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
    this.setSubmitButtonText('Salvar');
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
