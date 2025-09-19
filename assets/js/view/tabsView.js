import { EventBus } from '../core/eventBus.js';

export const TabsView = {
  render(topics) {
    const ul = document.getElementById('tab-topics');
    ul.innerHTML = '';

    const allTopics = ['Todos', ...topics];
    let firstTopic = allTopics[0];

    allTopics.forEach((topic, index) => {
      const li = document.createElement('li');
      li.className = 'nav-item';

      const a = document.createElement('a');
      a.className = 'nav-link' + (index === 0 ? ' active' : '');
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

    if (firstTopic) {
      EventBus.emit('topicSelected', firstTopic);
    }
  }
};

EventBus.on('dataLoaded', (data) => {
  TabsView.render(data.topics);
});
