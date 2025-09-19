
import { TaskModel } from '../model/taskModel.js';
import { EventBus } from '../core/eventBus.js';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek
} from 'https://cdn.jsdelivr.net/npm/date-fns@3.6.0/+esm';
import { ptBR } from 'https://cdn.jsdelivr.net/npm/date-fns@3.6.0/locale/pt-BR/+esm';

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const STATUS_BADGE = {
  todo: 'text-bg-secondary',
  doing: 'text-bg-info',
  done: 'text-bg-success'
};

export const CalendarView = {
  currentMonth: startOfMonth(new Date()),
  currentTopic: 'Todos',

  render(monthDate = CalendarView.currentMonth, topic = CalendarView.currentTopic) {
    this.currentMonth = startOfMonth(monthDate);
    this.currentTopic = topic;

    const container = document.getElementById('calendar-view');
    container.classList.remove('d-none');
    container.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'card shadow-sm';

    card.appendChild(this._buildHeader());
    card.appendChild(this._buildCalendarBody());

    container.appendChild(card);
  },

  _buildHeader() {
    const header = document.createElement('div');
    header.className = 'card-header d-flex justify-content-between align-items-center';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'btn btn-sm btn-outline-secondary';
    prevBtn.textContent = '‹ Mês anterior';
    prevBtn.addEventListener('click', () => {
      this.render(addMonths(this.currentMonth, -1), this.currentTopic);
    });

    const title = document.createElement('h5');
    title.className = 'mb-0';
    const monthLabel = format(this.currentMonth, "MMMM 'de' yyyy", { locale: ptBR });
    title.textContent = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn btn-sm btn-outline-secondary';
    nextBtn.textContent = 'Próximo mês ›';
    nextBtn.addEventListener('click', () => {
      this.render(addMonths(this.currentMonth, 1), this.currentTopic);
    });

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);

    return header;
  },

  _buildCalendarBody() {
    const body = document.createElement('div');
    body.className = 'card-body p-0';

    const table = document.createElement('table');
    table.className = 'table table-bordered table-sm mb-0 calendar-table align-middle';

    table.appendChild(this._buildTableHead());
    table.appendChild(this._buildTableBody());

    body.appendChild(table);
    return body;
  },

  _buildTableHead() {
    const thead = document.createElement('thead');
    const row = document.createElement('tr');
    row.className = 'text-center';

    WEEK_DAYS.forEach(day => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = day;
      row.appendChild(th);
    });

    thead.appendChild(row);
    return thead;
  },

  _buildTableBody() {
    const tbody = document.createElement('tbody');

    const start = startOfWeek(startOfMonth(this.currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(this.currentMonth), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const today = new Date();

    const tasks = this._getTasksForTopic();

    for (let i = 0; i < days.length; i += 7) {
      const week = days.slice(i, i + 7);
      const row = document.createElement('tr');

      week.forEach(day => {
        const cell = document.createElement('td');
        cell.className = 'align-top calendar-day-cell';

        if (!isSameMonth(day, this.currentMonth)) {
          cell.classList.add('bg-light', 'text-muted');
        }

        const dayHeader = document.createElement('div');
        dayHeader.className = 'd-flex justify-content-between align-items-start';

        const dayNumber = document.createElement('span');
        dayNumber.className = 'fw-semibold small';
        dayNumber.textContent = format(day, 'd', { locale: ptBR });

        dayHeader.appendChild(dayNumber);

        if (isSameDay(day, today)) {
          const todayBadge = document.createElement('span');
          todayBadge.className = 'badge text-bg-primary';
          todayBadge.textContent = 'Hoje';
          dayHeader.appendChild(todayBadge);
        }

        cell.appendChild(dayHeader);

        const dayTasks = tasks.filter(task => this._isTaskInDay(task, day));

        if (dayTasks.length > 0) {
          const list = document.createElement('div');
          list.className = 'd-flex flex-column gap-1 mt-2';

          dayTasks.forEach(task => {
            const badge = document.createElement('span');
            const badgeClass = STATUS_BADGE[task.status] || 'text-bg-primary';
            badge.className = `badge ${badgeClass} d-block text-start text-wrap w-100`;
            badge.textContent = this._formatTaskLabel(task);
            const periodLabel = this._formatTaskPeriod(task);
            if (periodLabel) {
              badge.title = `${task.title} — ${periodLabel}`;
            } else {
              badge.title = task.title;
            }
            list.appendChild(badge);
          });

          cell.appendChild(list);
        }

        row.appendChild(cell);
      });

      tbody.appendChild(row);
    }

    return tbody;
  },

  _getTasksForTopic() {
    const tasks = TaskModel.getTasks();
    if (this.currentTopic === 'Todos') {
      return tasks;
    }
    return tasks.filter(task => task.topic === this.currentTopic);
  },

  _isTaskInDay(task, day) {
    const interval = this._resolveTaskInterval(task);
    if (!interval) {
      return false;
    }

    return isWithinInterval(day, interval);
  },

  _resolveTaskInterval(task) {
    const startDate = task.startDate || task.dueDate;
    const endDate = task.dueDate || task.startDate;

    if (!startDate && !endDate) {
      return null;
    }

    const start = startDate ? parseISO(startDate) : parseISO(endDate);
    const end = endDate ? parseISO(endDate) : parseISO(startDate);

    if (Number.isNaN(start?.getTime()) || Number.isNaN(end?.getTime())) {
      return null;
    }

    return start <= end ? { start, end } : { start: end, end: start };
  },

  _formatTaskLabel(task) {
    if (this.currentTopic === 'Todos' && task.topic) {
      return `${task.topic} · ${task.title}`;
    }
    return task.title;
  },

  _formatTaskPeriod(task) {
    const interval = this._resolveTaskInterval(task);
    if (!interval) {
      return '';
    }

    const sameDay = isSameDay(interval.start, interval.end);
    const startLabelRaw = format(interval.start, "d 'de' MMMM", { locale: ptBR });
    const endLabelRaw = format(interval.end, "d 'de' MMMM", { locale: ptBR });
    const startLabel = startLabelRaw.charAt(0).toUpperCase() + startLabelRaw.slice(1);
    const endLabel = endLabelRaw.charAt(0).toUpperCase() + endLabelRaw.slice(1);

    return sameDay ? startLabel : `${startLabel} – ${endLabel}`;
  }
};

EventBus.on('dataLoaded', () => {
  CalendarView.render();
});

EventBus.on('taskAdded', () => {
  CalendarView.render();
});

EventBus.on('taskUpdated', () => {
  CalendarView.render();
});

EventBus.on('taskRemoved', () => {
  CalendarView.render();
});

EventBus.on('tasksBulkUpdated', () => {
  CalendarView.render(CalendarView.currentMonth, CalendarView.currentTopic);
});
