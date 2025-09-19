import { TaskModel } from '../model/taskModel.js';
import { EventBus } from '../core/eventBus.js';

const PAGE_SIZE = 3;

export const ListView = {
  pageState: new Map(),

  render(currentTopic = 'Todos') {
    const content = document.getElementById('tab-content');
    content.innerHTML = '';

    const tasks = TaskModel.getTasks();
    const filtered = currentTopic === 'Todos' ? tasks : tasks.filter(t => t.topic === currentTopic);

    const statuses = TaskModel.getStatuses();

    const row = document.createElement('div');
    row.className = 'row';

    if (!Array.isArray(statuses) || statuses.length === 0) {
      const emptyCol = document.createElement('div');
      emptyCol.className = 'col-12';
      const emptyBox = document.createElement('div');
      emptyBox.className = 'alert alert-light border text-center';
      emptyBox.textContent = 'Nenhum status disponível.';
      emptyCol.appendChild(emptyBox);
      row.appendChild(emptyCol);
      content.appendChild(row);
      return;
    }

    statuses.forEach(status => {
      const col = document.createElement('div');
      col.className = 'col-md-4 mb-4 status-column';

      const box = document.createElement('div');
      box.className = 'status-column__card h-100';

      const statusTasks = filtered.filter(t => t.status === status.id);
      const totalPages = Math.max(1, Math.ceil(statusTasks.length / PAGE_SIZE));
      const stateKey = `${currentTopic}::${status.id}`;
      let currentPage = this.pageState.get(stateKey) || 1;

      if (currentPage > totalPages) {
        currentPage = totalPages;
      }

      this.pageState.set(stateKey, currentPage);

      const header = document.createElement('div');
      header.className = 'status-column__header d-flex justify-content-between align-items-start';

      const headerTitle = document.createElement('h6');
      headerTitle.textContent = status.label;
      headerTitle.className = 'status-column__title mb-0';

      const headerCount = document.createElement('span');
      headerCount.className = 'status-column__count badge';
      headerCount.textContent = statusTasks.length;

      header.appendChild(headerTitle);
      header.appendChild(headerCount);
      box.appendChild(header);

      if (statusTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'status-column__empty text-center text-muted';
        emptyState.innerHTML = `
          <i class="fa-regular fa-circle-check"></i>
          <p class="mb-0">Sem atividades</p>
        `;
        box.appendChild(emptyState);
      } else {
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const visibleTasks = statusTasks.slice(startIndex, startIndex + PAGE_SIZE);

        const list = document.createElement('div');
        list.className = 'status-column__list';

        visibleTasks.forEach(task => {
          const card = document.createElement('div');

          card.className = 'card task-card';
          card.tabIndex = 0;
          card.setAttribute('role', 'button');

          const body = document.createElement('div');
          body.className = 'card-body';

          const title = document.createElement('h6');
          title.className = 'card-title mb-1';
          title.textContent = task.title;

          const date = document.createElement('small');
          date.className = 'text-muted';
          date.textContent = task.dueDate || 'Sem data';

          const meta = document.createElement('div');
          meta.className = 'task-card__meta';

          const topicBadge = document.createElement('span');
          topicBadge.className = 'badge bg-secondary';
          topicBadge.textContent = task.topic;

          const priorityBadge = document.createElement('span');
          const priorityClasses = {
            high: 'badge bg-danger',
            medium: 'badge bg-warning text-dark',
            low: 'badge bg-light text-dark'
          };
          priorityBadge.className = priorityClasses[task.priority] || 'badge bg-light text-dark';
          priorityBadge.textContent = task.priority;

          meta.appendChild(topicBadge);
          meta.appendChild(priorityBadge);

          if (task.collaborator) {
            const collaboratorBadge = document.createElement('span');
            collaboratorBadge.className = 'badge bg-info text-dark';
            collaboratorBadge.textContent = task.collaborator;
            meta.appendChild(collaboratorBadge);
          }

          if (Array.isArray(task.dependencies) && task.dependencies.length > 0) {
            const dependencyBadge = document.createElement('span');
            dependencyBadge.className = 'badge bg-light text-dark border';
            const count = task.dependencies.length;
            dependencyBadge.textContent = count === 1
              ? '1 dependência'
              : `${count} dependências`;
            meta.appendChild(dependencyBadge);
          }

          body.appendChild(title);
          body.appendChild(date);
          body.appendChild(meta);

          card.appendChild(body);
          card.addEventListener('click', () => {
            EventBus.emit('openTaskDetail', task);
          });
          card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              EventBus.emit('openTaskDetail', task);
            }
          });

          list.appendChild(card);
        });

        box.appendChild(list);

        if (totalPages > 1) {
          const pagination = document.createElement('div');
          pagination.className = 'status-pagination';

          const summary = document.createElement('span');
          summary.className = 'status-pagination__summary';
          const endItem = Math.min(startIndex + PAGE_SIZE, statusTasks.length);
          summary.textContent = `Mostrando ${startIndex + 1}-${endItem} de ${statusTasks.length}`;

          const controls = document.createElement('div');
          controls.className = 'status-pagination__controls';

          const prevBtn = document.createElement('button');
          prevBtn.type = 'button';
          prevBtn.className = 'btn btn-sm';
          prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
          prevBtn.disabled = currentPage === 1;
          prevBtn.addEventListener('click', () => {
            this.pageState.set(stateKey, currentPage - 1);
            this.render(currentTopic);
          });

          const pageIndicator = document.createElement('span');
          pageIndicator.className = 'status-pagination__indicator';
          pageIndicator.textContent = `${currentPage}/${totalPages}`;

          const nextBtn = document.createElement('button');
          nextBtn.type = 'button';
          nextBtn.className = 'btn btn-sm';
          nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
          nextBtn.disabled = currentPage === totalPages;
          nextBtn.addEventListener('click', () => {
            this.pageState.set(stateKey, currentPage + 1);
            this.render(currentTopic);
          });

          controls.appendChild(prevBtn);
          controls.appendChild(pageIndicator);
          controls.appendChild(nextBtn);

          pagination.appendChild(summary);
          pagination.appendChild(controls);

          box.appendChild(pagination);
        }
      }

      col.appendChild(box);
      row.appendChild(col);
    });

    content.appendChild(row);
  }
};

EventBus.on('topicSelected', topic => {
  ListView.render(topic);
});

EventBus.on('taskAdded', () => {
  const activeTab = document.querySelector('#tab-topics .nav-link.active');
  const topic = activeTab?.dataset.topic || 'Todos';
  ListView.render(topic);
});

EventBus.on('taskUpdated', () => {
  const activeTab = document.querySelector('#tab-topics .nav-link.active');
  const topic = activeTab?.dataset.topic || 'Todos';
  ListView.render(topic);
});

EventBus.on('taskRemoved', () => {
  const activeTab = document.querySelector('#tab-topics .nav-link.active');
  const topic = activeTab?.dataset.topic || 'Todos';
  ListView.render(topic);
});

EventBus.on('tasksBulkUpdated', () => {
  const activeTab = document.querySelector('#tab-topics .nav-link.active');
  const topic = activeTab?.dataset.topic || 'Todos';
  ListView.render(topic);
});

EventBus.on('statusesChanged', () => {
  const activeTab = document.querySelector('#tab-topics .nav-link.active');
  const topic = activeTab?.dataset.topic || 'Todos';
  ListView.render(topic);
});
