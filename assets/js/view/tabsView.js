import { EventBus } from '../core/eventBus.js';

export const TabsView = {
  render(payload) {
    const { topics, forcedActive } = Array.isArray(payload)
      ? { topics: payload, forcedActive: null }
      : { topics: payload?.topics ?? [], forcedActive: payload?.forcedActive ?? null };

    const ul = document.getElementById('tab-topics');
    const previousActive = document.querySelector('#tab-topics .nav-link.active')?.dataset.topic;
    ul.innerHTML = '';

    const allTopics = ['Todos', ...topics];
    const currentActive = forcedActive || previousActive;
    const activeTopic = allTopics.includes(currentActive) ? currentActive : allTopics[0];

    allTopics.forEach((topic, index) => {
      const li = document.createElement('li');
      li.className = 'nav-item';

      const a = document.createElement('a');
      const isActive = topic === activeTopic || (!activeTopic && index === 0);
      a.className = 'nav-link' + (isActive ? ' active' : '');
      a.dataset.topic = topic;
      a.href = '#';
      a.textContent = topic;

      a.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('#tab-topics .nav-link').forEach(link => link.classList.remove('active'));
        a.classList.add('active');
        EventBus.emit('topicSelected', topic);
      });

      li.appendChild(a);
      ul.appendChild(li);
    });

    if (activeTopic) {
      EventBus.emit('topicSelected', activeTopic);
    }
  }
};

EventBus.on('dataLoaded', (data) => {
  TabsView.render(data.topics);
});

EventBus.on('topicsChanged', (payload) => {
  TabsView.render(payload);
});
