import { EventBus } from '../core/eventBus.js';

export const TabsView = {
  lastActive: 'Todos',

  render(topics) {
    const ul = document.getElementById('tab-topics');
    if (!ul) return;

    const currentActive = document.querySelector('#tab-topics .nav-link.active')?.dataset.topic;
    const allTopics = ['Todos', ...topics];

    const preferredActive = currentActive || this.lastActive;
    const activeTopic = allTopics.includes(preferredActive) ? preferredActive : allTopics[0];

    ul.innerHTML = '';

    allTopics.forEach(topic => {
      const li = document.createElement('li');
      li.className = 'nav-item';

      const a = document.createElement('a');
      a.className = 'nav-link';
      if (topic === activeTopic) {
        a.classList.add('active');
      }
      a.dataset.topic = topic;
      a.href = '#';
      a.textContent = topic;

      a.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('#tab-topics .nav-link').forEach(link => link.classList.remove('active'));
        a.classList.add('active');
        this.lastActive = topic;
        EventBus.emit('topicSelected', topic);
      });

      li.appendChild(a);
      ul.appendChild(li);
    });

    if (activeTopic) {
      this.lastActive = activeTopic;
      EventBus.emit('topicSelected', activeTopic);
    }
  }
};

EventBus.on('dataLoaded', (data) => {
  TabsView.render(data.topics);
});

EventBus.on('topicsChanged', (topics) => {
  if (Array.isArray(topics)) {
    TabsView.render(topics);
  }
});

EventBus.on('topicUpdated', ({ oldTopic, newTopic }) => {
  if (TabsView.lastActive === oldTopic) {
    TabsView.lastActive = newTopic;
  }
});

EventBus.on('topicRemoved', ({ topic, replacement }) => {
  if (TabsView.lastActive === topic) {
    TabsView.lastActive = replacement || 'Todos';
  }
});
