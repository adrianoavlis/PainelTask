
import { TaskModel } from '../model/taskModel.js';

export const ICSUtils = {
  exportICS() {
    const tasks = TaskModel.getTasks();
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TaskBoard//EN'
    ];

    tasks.forEach(task => {
      if (!task.dueDate) return;
      const start = task.startDate || task.dueDate;
      const uid = task.id + '@taskboard';
      const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const dtstart = start.replace(/-/g, '') + 'T000000Z';
      const dtend = task.dueDate.replace(/-/g, '') + 'T235900Z';

      lines.push(
        'BEGIN:VEVENT',
        'UID:' + uid,
        'DTSTAMP:' + dtstamp,
        'SUMMARY:' + task.title,
        'DESCRIPTION:' + (task.notes || ''),
        'DTSTART:' + dtstart,
        'DTEND:' + dtend,
        'STATUS:' + (task.status === 'done' ? 'COMPLETED' : 'CONFIRMED'),
        'END:VEVENT'
      );
    });

    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taskboard-export.ics';
    a.click();
    URL.revokeObjectURL(url);
  }
};
