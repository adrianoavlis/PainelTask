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
        card.className = 'card mb-2';
        card.innerHTML = `
          <div class="card-body p-2">
            <h6 class="card-title mb-1">${task.title}</h6>
            <small class="text-muted">${task.dueDate || 'Sem data'}</small>
            <div class="mt-1">
              <span class="badge bg-secondary">${task.topic}</span>
              <span class="badge bg-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'light'} text-dark">
                ${task.priority}
              </span>
            </div>
          </div>
        `;
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

EventBus.on('tasksBulkUpdated', () => {
  const activeTab = document.querySelector('#tab-topics .nav-link.active');
  const topic = activeTab?.dataset.topic || 'Todos';
  ListView.render(topic);
});
