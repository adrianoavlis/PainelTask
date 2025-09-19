
import { TaskModel } from '../model/taskModel.js';

const STATUS_MAP = {
  completed: 'done',
  cancelled: 'todo',
  tentative: 'todo',
  'in-process': 'doing'
};

const unfoldLines = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .reduce((acc, line) => {
      if (/^[ \t]/.test(line) && acc.length > 0) {
        acc[acc.length - 1] += line.trim();
      } else {
        acc.push(line.trim());
      }
      return acc;
    }, [])
    .filter(Boolean);
};

const parseProperty = (raw) => {
  const segments = raw.split(';');
  const key = segments[0].toUpperCase();
  const params = {};

  segments.slice(1).forEach(segment => {
    const [paramKey, paramValue] = segment.split('=');
    if (paramKey && paramValue) {
      params[paramKey.toUpperCase()] = paramValue;
    }
  });

  return { key, params };
};

const decodeICSString = (value = '') =>
  value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');

const parseICSDate = (field) => {
  if (!field || !field.value) {
    return { date: null, allDay: false };
  }

  let raw = field.value.trim();
  if (!raw) {
    return { date: null, allDay: false };
  }

  const allDay = field.params.VALUE === 'DATE' || !raw.includes('T');
  raw = raw.replace('Z', '');
  const datePart = raw.slice(0, 8);

  if (datePart.length !== 8 || /\D/.test(datePart)) {
    return { date: null, allDay };
  }

  const date = `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
  return { date, allDay };
};

const parseICSEvents = (text) => {
  const lines = unfoldLines(text);
  const events = [];
  let current = null;

  lines.forEach(line => {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      return;
    }

    if (line === 'END:VEVENT') {
      if (current) {
        events.push(current);
      }
      current = null;
      return;
    }

    if (!current) return;

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) return;

    const property = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    const { key, params } = parseProperty(property);

    current[key] = { value: value.trim(), params };
  });

  return events;
};

const normalizeStatus = (statusField) => {
  if (!statusField || !statusField.value) {
    return TaskModel.getDefaultStatusId();
  }

  const normalized = statusField.value.toLowerCase();
  const mapped = STATUS_MAP[normalized];
  if (mapped) {
    return TaskModel.resolveStatusId(mapped);
  }

  if (normalized.includes('progress')) {
    return TaskModel.resolveStatusId('doing');
  }

  if (normalized.includes('complete')) {
    return TaskModel.resolveStatusId('done');
  }

  return TaskModel.getDefaultStatusId();
};

const resolveTopic = (categoriesField) => {
  if (!categoriesField || !categoriesField.value) {
    return undefined;
  }

  const categories = categoriesField.value
    .split(',')
    .map(cat => cat.trim())
    .filter(Boolean);

  if (categories.length === 0) {
    return undefined;
  }

  const first = categories[0];
  const existing = TaskModel.getTopics().find(topic => topic.toLowerCase() === first.toLowerCase());

  if (existing) {
    return existing;
  }

  const result = TaskModel.addTopic(first);
  if (result && result.success) {
    return result.topic;
  }

  return undefined;
};

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
        'STATUS:' + (TaskModel.resolveStatusId(task.status) === 'done' ? 'COMPLETED' : 'CONFIRMED'),
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
  },

  async importICS(file) {
    const text = await file.text();
    const events = parseICSEvents(text);

    if (events.length === 0) {
      return { count: 0 };
    }

    const tasksToImport = events.reduce((acc, event) => {
      const { date: startDate, allDay } = parseICSDate(event.DTSTART);
      const endInfo = parseICSDate(event.DTEND);
      const dueDate = endInfo.date || startDate;

      if (!startDate && !dueDate) {
        return acc;
      }

      const topic = resolveTopic(event.CATEGORIES);

      acc.push({
        title: decodeICSString(event.SUMMARY?.value || 'Evento importado'),
        topic,
        status: normalizeStatus(event.STATUS),
        priority: 'medium',
        startDate: startDate || dueDate,
        dueDate,
        allDay: allDay || endInfo.allDay,
        repeat: null,
        tags: [],
        notes: decodeICSString(event.DESCRIPTION?.value || ''),
        checklist: []
      });

      return acc;
    }, []);

    if (tasksToImport.length === 0) {
      return { count: 0 };
    }

    const imported = TaskModel.importTasks(tasksToImport);
    return { count: imported.length };
  }
};
