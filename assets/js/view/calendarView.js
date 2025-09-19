
import { TaskModel } from '../model/taskModel.js';
import { EventBus } from '../core/eventBus.js';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'https://cdn.jsdelivr.net/npm/date-fns@3.6.0/+esm';

export const CalendarView = {
  render(monthDate = new Date()) {
    const container = document.getElementById('calendar-view');
    container.classList.remove('d-none');
    container.innerHTML = '';

    const days = eachDayOfInterval({
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate)
    });

    const offset = getDay(days[0]); // Quantos dias até domingo

    for (let i = 0; i < offset; i++) {
      const empty = document.createElement('div');
      container.appendChild(empty);
    }

    const tasks = TaskModel.getTasks();
    days.forEach(day => {
      const div = document.createElement('div');
      div.className = 'calendar-cell';

      const dateStr = format(day, 'yyyy-MM-dd');
      const header = document.createElement('div');
      header.className = 'date';
      header.textContent = format(day, 'd');
      div.appendChild(header);

      const dayTasks = tasks.filter(t => t.dueDate === dateStr);
      if (dayTasks.length > 0) {
        const badge = document.createElement('span');
        badge.className = 'badge bg-primary mt-2';
        badge.textContent = `${dayTasks.length} tarefa(s)`;
        div.appendChild(badge);
      }

      container.appendChild(div);
    });
  }
};

EventBus.on('dataLoaded', () => {
  CalendarView.render();
});
