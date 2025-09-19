
import { Storage } from '../core/storage.js';
import { EventBus } from '../core/eventBus.js';

const FALLBACK_TOPIC = 'Geral';

const ALLOWED_STATUSES = new Set(['todo', 'doing', 'done']);

const normalizeStatus = (status) => ALLOWED_STATUSES.has(status) ? status : 'todo';

const normalizeTopicName = (topic) =>
  typeof topic === 'string' ? topic.trim() : '';

const nowISO = () => new Date().toISOString();

export const TaskModel = {
  data: {
    meta: {},
    topics: [],
    tasks: []
  },

  async init() {
    const loaded = await Storage.load();
    if (loaded) {
      this.data = loaded;
    }

    if (!Array.isArray(this.data.topics)) {
      this.data.topics = [];
    }

    if (!Array.isArray(this.data.tasks)) {
      this.data.tasks = [];
    }

    if (this.data.topics.length === 0) {
      this.data.topics.push(FALLBACK_TOPIC);
    }

    this._ensureTasksHaveValidTopics();

    EventBus.emit('dataLoaded', this.data);
  },

  getTasks() {
    return this.data.tasks;
  },

  getTopics() {
    return this.data.topics;
  },

  getTaskById(id) {
    return this.data.tasks.find(task => task.id === id);
  },

  addTask(task) {
    const topic = this._resolveExistingTopic(task.topic) || this.data.topics[0] || FALLBACK_TOPIC;

    task.id = `t-${Date.now()}`;
    task.topic = topic;
    task.status = normalizeStatus(task.status);
    task.createdAt = nowISO();
    task.updatedAt = nowISO();

    this.data.tasks.push(task);
    this.persist();
    EventBus.emit('taskAdded', task);
  },

  importTasks(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return [];
    }

    if (!Array.isArray(this.data.topics) || this.data.topics.length === 0) {
      this.data.topics = [FALLBACK_TOPIC];
    }

    const defaultTopic = this.data.topics[0] || FALLBACK_TOPIC;
    const now = nowISO();
    const baseTime = Date.now();
    const imported = [];

    tasks.forEach((incomingTask, index) => {
      if (!incomingTask || typeof incomingTask !== 'object') {
        return;
      }

      const title = typeof incomingTask.title === 'string' && incomingTask.title.trim()
        ? incomingTask.title.trim()
        : null;

      const startDate = incomingTask.startDate || incomingTask.dueDate || null;
      const dueDate = incomingTask.dueDate || incomingTask.startDate || null;

      if (!title || !dueDate) {
        return;
      }

      const topic = this._resolveExistingTopic(incomingTask.topic) || defaultTopic;
      const status = normalizeStatus(incomingTask.status);
      const priority = typeof incomingTask.priority === 'string' && incomingTask.priority.trim()
        ? incomingTask.priority
        : 'medium';

      const tags = Array.isArray(incomingTask.tags)
        ? incomingTask.tags.filter(tag => typeof tag === 'string')
        : [];

      const checklist = Array.isArray(incomingTask.checklist)
        ? incomingTask.checklist.filter(item => item && typeof item.text === 'string').map(item => ({
          text: item.text,
          done: Boolean(item.done)
        }))
        : [];

      const task = {
        id: `t-${baseTime + index}`,
        title,
        topic,
        status,
        priority,
        startDate,
        dueDate,
        allDay: Boolean(incomingTask.allDay),
        repeat: incomingTask.repeat ?? null,
        tags,
        notes: typeof incomingTask.notes === 'string' ? incomingTask.notes : '',
        checklist,
        createdAt: now,
        updatedAt: now
      };

      this.data.tasks.push(task);
      imported.push(task);
    });

    if (imported.length > 0) {
      this.persist();
      EventBus.emit('tasksImported', { tasks: imported });
      EventBus.emit('tasksBulkUpdated', [...this.data.tasks]);
    }

    return imported;
  },

  updateTask(updatedTask) {
    const index = this.data.tasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      const topic = this._resolveExistingTopic(updatedTask.topic) || this.data.topics[0] || FALLBACK_TOPIC;

      updatedTask.topic = topic;
      updatedTask.status = normalizeStatus(updatedTask.status);
      updatedTask.updatedAt = nowISO();
      this.data.tasks[index] = updatedTask;

      this.persist();
      EventBus.emit('taskUpdated', updatedTask);
    }
  },

  removeTask(id) {
    const index = this.data.tasks.findIndex(task => task.id === id);
    if (index !== -1) {
      const [removedTask] = this.data.tasks.splice(index, 1);
      this.persist();
      EventBus.emit('taskRemoved', removedTask);
    }
  },

  addTopic(name) {
    const topic = normalizeTopicName(name);
    if (!topic) {
      return { success: false, reason: 'empty' };
    }

    if (this._findTopicInsensitive(topic)) {
      return { success: false, reason: 'duplicate' };
    }

    this.data.topics.push(topic);
    this.persist();

    EventBus.emit('topicAdded', topic);
    EventBus.emit('topicsChanged', [...this.data.topics]);

    return { success: true, topic };
  },

  updateTopic(oldName, newName) {
    const currentTopic = this._findTopicInsensitive(oldName);
    if (!currentTopic) {
      return { success: false, reason: 'notfound' };
    }

    const topicIndex = this.data.topics.indexOf(currentTopic);
    const newTopic = normalizeTopicName(newName);

    if (!newTopic) {
      return { success: false, reason: 'empty' };
    }

    const existing = this._findTopicInsensitive(newTopic);
    if (existing && existing !== currentTopic) {
      return { success: false, reason: 'duplicate' };
    }

    if (currentTopic === newTopic) {
      return { success: false, reason: 'unchanged' };
    }

    this.data.topics[topicIndex] = newTopic;

    let updatedCount = 0;
    this.data.tasks.forEach(task => {
      if (task.topic === currentTopic) {
        task.topic = newTopic;
        task.updatedAt = nowISO();
        updatedCount++;
      }
    });

    this.persist();

    EventBus.emit('topicUpdated', { oldTopic: currentTopic, newTopic, updatedCount });
    EventBus.emit('topicsChanged', [...this.data.topics]);

    if (updatedCount > 0) {
      EventBus.emit('tasksBulkUpdated', [...this.data.tasks]);
    }

    return { success: true, newTopic, updatedCount };
  },

  removeTopic(name) {
    const topic = this._findTopicInsensitive(name);
    if (!topic) {
      return { success: false, reason: 'notfound' };
    }

    const remainingTopics = this.data.topics.filter(t => t !== topic);
    let replacement = remainingTopics[0];
    let createdFallback = false;

    if (!replacement) {
      replacement = FALLBACK_TOPIC;
      createdFallback = true;
      remainingTopics.push(replacement);
    }

    this.data.topics = remainingTopics;

    let reassignedCount = 0;
    this.data.tasks.forEach(task => {
      if (task.topic === topic) {
        task.topic = replacement;
        task.updatedAt = nowISO();
        reassignedCount++;
      }
    });

    this.persist();

    EventBus.emit('topicRemoved', {
      topic,
      replacement,
      reassignedCount,
      createdFallback
    });

    EventBus.emit('topicsChanged', [...this.data.topics]);

    if (reassignedCount > 0) {
      EventBus.emit('tasksBulkUpdated', [...this.data.tasks]);
    }

    return { success: true, replacement, reassignedCount, createdFallback };
  },

  persist() {
    Storage.save(this.data);
  },

  _ensureTasksHaveValidTopics() {
    const validTopics = new Set(this.data.topics);
    if (validTopics.size === 0) {
      const fallback = FALLBACK_TOPIC;
      this.data.topics = [fallback];
      validTopics.add(fallback);
    }

    const fallbackTopic = this.data.topics[0];
    let needsPersist = false;

    this.data.tasks.forEach(task => {
      const resolved = this._resolveExistingTopic(task.topic) || fallbackTopic;
      const normalizedStatus = normalizeStatus(task.status);
      let updated = false;

      if (task.topic !== resolved) {
        task.topic = resolved;
        updated = true;
      }

      if (task.status !== normalizedStatus) {
        task.status = normalizedStatus;
        updated = true;
      }

      if (updated) {
        task.updatedAt = nowISO();
        needsPersist = true;
      }
    });

    if (needsPersist) {
      this.persist();
    }
  },

  _findTopicInsensitive(topicName) {
    if (!topicName) return undefined;
    const normalized = normalizeTopicName(topicName).toLowerCase();
    return this.data.topics.find(topic => topic.toLowerCase() === normalized);
  },

  _resolveExistingTopic(topicName) {
    return this._findTopicInsensitive(topicName);
  }
};
