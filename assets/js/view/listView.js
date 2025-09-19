import { TaskModel } from '../model/taskModel.js';
import { EventBus } from '../core/eventBus.js';

export const ListView = {
  render(currentTopic = 'Todos') {
    const content = document.getElementById('tab-content');
    content.innerHTML = '';

    const tasks = TaskModel.getTasks();
    const filtered = currentTopic === 'Todos' ? tasks : tasks.filter(t => t.topic === currentTopic);

    const statusList = ['todo', 'doing', 'done'];
    const statusLabels = {
      'todo': 'A Fazer',
      'doing': 'Em Progresso',
      'done': 'Concluído'
    };

    const row = document.createElement('div');
    row.className = 'row';

    statusList.forEach(status => {
      const col = document.createElement('div');
      col.className = 'col-md-4 mb-3';

      const box = document.createElement('div');
      box.className = 'border rounded bg-white shadow-sm p-2';

      const header = document.createElement('h6');
      header.textContent = statusLabels[status];
      header.className = 'text-primary border-bottom pb-1 mb-2';

      box.appendChild(header);

      filtered.filter(t => t.status === status).forEach(task => {
        const card = document.createElement('div');

        card.className = 'card mb-2 task-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');

        const body = document.createElement('div');
        body.className = 'card-body p-2';

        const title = document.createElement('h6');
        title.className = 'card-title mb-1';
        title.textContent = task.title;

        const date = document.createElement('small');
        date.className = 'text-muted';
        date.textContent = task.dueDate || 'Sem data';

        const meta = document.createElement('div');
        meta.className = 'mt-1 d-flex flex-wrap gap-1';

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

        box.appendChild(card);
      });

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
