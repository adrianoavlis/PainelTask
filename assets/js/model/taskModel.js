
import { Storage } from '../core/storage.js';
import { EventBus } from '../core/eventBus.js';

const FALLBACK_TOPIC = 'Geral';

const DEFAULT_STATUSES = [
  { id: 'todo', label: 'A Fazer', badgeClass: 'text-bg-secondary' },
  { id: 'doing', label: 'Em Progresso', badgeClass: 'text-bg-info text-dark' },
  { id: 'done', label: 'Concluído', badgeClass: 'text-bg-success' }
];

const sanitizeStatusLabel = (label) =>
  typeof label === 'string' ? label.trim() : '';

const slugify = (label) => {
  if (typeof label !== 'string') {
    return 'status';
  }

  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'status';
};

const normalizeTopicName = (topic) =>
  typeof topic === 'string' ? topic.trim() : '';

const normalizeCollaboratorName = (name) =>
  typeof name === 'string' ? name.trim() : '';

const nowISO = () => new Date().toISOString();

export const TaskModel = {
  data: {
    meta: {},
    topics: [],
    collaborators: [],
    statuses: [],
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

    const sanitizedTasks = [];
    const usedIds = new Set();
    const baseTime = Date.now();

    this.data.tasks.forEach((task, index) => {
      if (!task || typeof task !== 'object') {
        return;
      }

      let id = typeof task.id === 'string' ? task.id.trim() : '';
      if (!id) {
        id = `t-${baseTime + index}`;
      }

      while (usedIds.has(id)) {
        id = `t-${baseTime + index}-${usedIds.size}`;
      }

      usedIds.add(id);

      const normalizedTask = {
        ...task,
        id,
        dependencies: Array.isArray(task.dependencies) ? [...task.dependencies] : []
      };

      sanitizedTasks.push(normalizedTask);
    });

    this.data.tasks = sanitizedTasks;

    if (!Array.isArray(this.data.collaborators)) {
      this.data.collaborators = [];
    }

    if (!Array.isArray(this.data.statuses)) {
      this.data.statuses = [];
    }

    const normalizedStatuses = [];
    const usedStatusIds = new Set();

    this.data.statuses.forEach(status => {
      const normalized = this._normalizeStatusDefinition(status);
      if (!normalized) {
        return;
      }

      let candidateId = normalized.id;
      let suffix = 1;
      while (usedStatusIds.has(candidateId)) {
        candidateId = `${normalized.id}-${suffix++}`;
      }

      normalized.id = candidateId;
      usedStatusIds.add(candidateId);
      normalizedStatuses.push(normalized);
    });

    if (normalizedStatuses.length === 0) {
      DEFAULT_STATUSES.forEach(status => {
        normalizedStatuses.push({ ...status });
      });
    }

    this.data.statuses = normalizedStatuses;

    if (this.data.topics.length === 0) {
      this.data.topics.push(FALLBACK_TOPIC);
    }

    this._ensureDataIntegrity();

    EventBus.emit('dataLoaded', this.data);
  },

  getTasks() {
    return this.data.tasks;
  },

  getTopics() {
    return this.data.topics;
  },

  getCollaborators() {
    return this.data.collaborators;
  },

  getDefaultStatus() {
    return this.data.statuses[0] || null;
  },

  getDefaultStatusId() {
    const defaultStatus = this.getDefaultStatus();
    if (defaultStatus) {
      return defaultStatus.id;
    }

    return DEFAULT_STATUSES[0].id;
  },

  getStatusById(id) {
    return this._findStatusById(id) || null;
  },

  resolveStatusId(value) {
    return this._normalizeStatusId(value);
  },

  getStatuses() {
    return this.data.statuses;
  },

  getTaskById(id) {
    return this.data.tasks.find(task => task.id === id);
  },

  addTask(task) {
    const topic = this._resolveExistingTopic(task.topic) || this.data.topics[0] || FALLBACK_TOPIC;

    task.id = `t-${Date.now()}`;
    task.topic = topic;
    task.collaborator = this._resolveExistingCollaborator(task.collaborator) || null;
    task.status = this._normalizeStatusId(task.status);
    task.dependencies = this._normalizeDependencies(task.dependencies, {
      excludeId: task.id,
      validIds: new Set(this.data.tasks.map(existingTask => existingTask.id))
    });
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
      const status = this._normalizeStatusId(incomingTask.status);
      const priority = typeof incomingTask.priority === 'string' && incomingTask.priority.trim()
        ? incomingTask.priority
        : 'medium';

      const tags = Array.isArray(incomingTask.tags)
        ? incomingTask.tags.filter(tag => typeof tag === 'string')
        : [];

      const collaborator = this._resolveExistingCollaborator(incomingTask.collaborator) || null;

      const checklist = Array.isArray(incomingTask.checklist)
        ? incomingTask.checklist.filter(item => item && typeof item.text === 'string').map(item => ({
          text: item.text,
          done: Boolean(item.done)
        }))
        : [];

      const taskId = `t-${baseTime + index}`;
      const dependencies = this._normalizeDependencies(incomingTask.dependencies, {
        excludeId: taskId,
        validIds: new Set(this.data.tasks.map(task => task.id))
      });

      const task = {
        id: taskId,
        title,
        topic,
        status,
        priority,
        collaborator,
        startDate,
        dueDate,
        allDay: Boolean(incomingTask.allDay),
        repeat: incomingTask.repeat ?? null,
        tags,
        notes: typeof incomingTask.notes === 'string' ? incomingTask.notes : '',
        checklist,
        dependencies,
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
    if (index === -1) {
      return;
    }

    const existingTask = this.data.tasks[index];
    const mergedTask = {
      ...existingTask,
      ...updatedTask
    };

    const topic = this._resolveExistingTopic(mergedTask.topic) || this.data.topics[0] || FALLBACK_TOPIC;

    mergedTask.topic = topic;
    mergedTask.collaborator = this._resolveExistingCollaborator(mergedTask.collaborator) || null;
    mergedTask.status = this._normalizeStatusId(mergedTask.status);
    mergedTask.tags = Array.isArray(mergedTask.tags) ? mergedTask.tags : [];
    mergedTask.dependencies = this._normalizeDependencies(
      Array.isArray(updatedTask.dependencies) ? updatedTask.dependencies : existingTask.dependencies,
      {
        excludeId: existingTask.id,
        validIds: new Set(this.data.tasks.map(task => task.id))
      }
    );
    mergedTask.updatedAt = nowISO();

    this.data.tasks[index] = mergedTask;

    this.persist();
    EventBus.emit('taskUpdated', mergedTask);
  },

  removeTask(id) {
    const index = this.data.tasks.findIndex(task => task.id === id);
    if (index !== -1) {
      const [removedTask] = this.data.tasks.splice(index, 1);

      let clearedDependencies = 0;
      const now = nowISO();
      this.data.tasks.forEach(task => {
        if (!Array.isArray(task.dependencies) || task.dependencies.length === 0) {
          return;
        }

        if (task.dependencies.includes(removedTask.id)) {
          task.dependencies = task.dependencies.filter(depId => depId !== removedTask.id);
          task.updatedAt = now;
          clearedDependencies++;
        }
      });

      this.persist();
      EventBus.emit('taskRemoved', removedTask);

      if (clearedDependencies > 0) {
        EventBus.emit('tasksBulkUpdated', [...this.data.tasks]);
      }
    }
  },

  addCollaborator(name) {
    const collaborator = normalizeCollaboratorName(name);
    if (!collaborator) {
      return { success: false, reason: 'empty' };
    }

    if (this._findCollaboratorInsensitive(collaborator)) {
      return { success: false, reason: 'duplicate' };
    }

    this.data.collaborators.push(collaborator);
    this.persist();

    EventBus.emit('collaboratorAdded', collaborator);
    EventBus.emit('collaboratorsChanged', [...this.data.collaborators]);

    return { success: true, collaborator };
  },

  updateCollaborator(oldName, newName) {
    const current = this._findCollaboratorInsensitive(oldName);
    if (!current) {
      return { success: false, reason: 'notfound' };
    }

    const collaboratorIndex = this.data.collaborators.indexOf(current);
    const normalizedNew = normalizeCollaboratorName(newName);

    if (!normalizedNew) {
      return { success: false, reason: 'empty' };
    }

    const existing = this._findCollaboratorInsensitive(normalizedNew);
    if (existing && existing !== current) {
      return { success: false, reason: 'duplicate' };
    }

    if (current === normalizedNew) {
      return { success: false, reason: 'unchanged' };
    }

    this.data.collaborators[collaboratorIndex] = normalizedNew;

    let updatedCount = 0;
    const now = nowISO();
    this.data.tasks.forEach(task => {
      if (task.collaborator === current) {
        task.collaborator = normalizedNew;
        task.updatedAt = now;
        updatedCount++;
      }
    });

    this.persist();

    EventBus.emit('collaboratorUpdated', { oldName: current, newName: normalizedNew, updatedCount });
    EventBus.emit('collaboratorsChanged', [...this.data.collaborators]);

    if (updatedCount > 0) {
      EventBus.emit('tasksBulkUpdated', [...this.data.tasks]);
    }

    return { success: true, newName: normalizedNew, updatedCount };
  },

  removeCollaborator(name) {
    const collaborator = this._findCollaboratorInsensitive(name);
    if (!collaborator) {
      return { success: false, reason: 'notfound' };
    }

    this.data.collaborators = this.data.collaborators.filter(item => item !== collaborator);

    let clearedAssignments = 0;
    const now = nowISO();
    this.data.tasks.forEach(task => {
      if (task.collaborator === collaborator) {
        task.collaborator = null;
        task.updatedAt = now;
        clearedAssignments++;
      }
    });

    this.persist();

    EventBus.emit('collaboratorRemoved', { collaborator, clearedAssignments });
    EventBus.emit('collaboratorsChanged', [...this.data.collaborators]);

    if (clearedAssignments > 0) {
      EventBus.emit('tasksBulkUpdated', [...this.data.tasks]);
    }

    return { success: true, clearedAssignments };
  },

  addStatus(label) {
    const normalizedLabel = sanitizeStatusLabel(label);
    if (!normalizedLabel) {
      return { success: false, reason: 'empty' };
    }

    if (this._findStatusByLabelInsensitive(normalizedLabel)) {
      return { success: false, reason: 'duplicate' };
    }

    const baseId = slugify(normalizedLabel);
    let candidateId = baseId;
    let suffix = 1;

    while (this._findStatusById(candidateId)) {
      candidateId = `${baseId}-${suffix++}`;
    }

    const status = {
      id: candidateId,
      label: normalizedLabel,
      badgeClass: 'text-bg-secondary'
    };

    this.data.statuses.push(status);
    this.persist();

    EventBus.emit('statusAdded', { ...status });
    EventBus.emit('statusesChanged', [...this.data.statuses]);

    return { success: true, status };
  },

  updateStatus(identifier, newLabel) {
    const status = this._resolveExistingStatus(identifier);
    if (!status) {
      return { success: false, reason: 'notfound' };
    }

    const normalizedLabel = sanitizeStatusLabel(newLabel);
    if (!normalizedLabel) {
      return { success: false, reason: 'empty' };
    }

    const existing = this._findStatusByLabelInsensitive(normalizedLabel);
    if (existing && existing.id !== status.id) {
      return { success: false, reason: 'duplicate' };
    }

    if (status.label === normalizedLabel) {
      return { success: false, reason: 'unchanged' };
    }

    const previousLabel = status.label;
    status.label = normalizedLabel;

    this.persist();

    EventBus.emit('statusUpdated', {
      id: status.id,
      oldLabel: previousLabel,
      newLabel: status.label
    });
    EventBus.emit('statusesChanged', [...this.data.statuses]);

    return { success: true, status: { ...status } };
  },

  removeStatus(identifier) {
    const status = this._resolveExistingStatus(identifier);
    if (!status) {
      return { success: false, reason: 'notfound' };
    }

    if (this.data.statuses.length <= 1) {
      return { success: false, reason: 'minimum' };
    }

    const remaining = this.data.statuses.filter(item => item.id !== status.id);

    let fallback = remaining[0];
    if (!fallback) {
      fallback = { ...DEFAULT_STATUSES[0] };
      remaining.push(fallback);
    }

    this.data.statuses = remaining;

    let reassignedCount = 0;
    const now = nowISO();
    this.data.tasks.forEach(task => {
      if (task.status === status.id) {
        task.status = fallback.id;
        task.updatedAt = now;
        reassignedCount++;
      }
    });

    this.persist();

    EventBus.emit('statusRemoved', {
      removed: { ...status },
      fallback: { ...fallback },
      reassignedCount
    });
    EventBus.emit('statusesChanged', [...this.data.statuses]);

    if (reassignedCount > 0) {
      EventBus.emit('tasksBulkUpdated', [...this.data.tasks]);
    }

    return { success: true, fallback, reassignedCount };
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

  _ensureDataIntegrity() {
    if (!Array.isArray(this.data.topics) || this.data.topics.length === 0) {
      this.data.topics = [FALLBACK_TOPIC];
    }

    if (!Array.isArray(this.data.statuses) || this.data.statuses.length === 0) {
      this.data.statuses = DEFAULT_STATUSES.map(status => ({ ...status }));
    }

    const validTopics = new Set(this.data.topics);
    const validCollaborators = new Set(this.data.collaborators);
    const validStatuses = new Set(this.data.statuses.map(status => status.id));
    const validTaskIds = new Set(this.data.tasks.map(task => task.id));

    const fallbackTopic = this.data.topics[0];
    const fallbackStatus = this.getDefaultStatusId();

    let needsPersist = false;

    this.data.tasks.forEach(task => {
      const resolvedTopic = this._resolveExistingTopic(task.topic) || fallbackTopic;
      const normalizedStatus = validStatuses.has(task.status)
        ? task.status
        : fallbackStatus;

      let updated = false;

      if (task.topic !== resolvedTopic) {
        task.topic = resolvedTopic;
        updated = true;
      }

      if (task.status !== normalizedStatus) {
        task.status = normalizedStatus;
        updated = true;
      }

      if (task.collaborator && !validCollaborators.has(task.collaborator)) {
        task.collaborator = null;
        updated = true;
      }

      const normalizedDependencies = this._normalizeDependencies(task.dependencies, {
        excludeId: task.id,
        validIds: validTaskIds
      });

      if (!this._areArraysEqual(task.dependencies, normalizedDependencies)) {
        task.dependencies = normalizedDependencies;
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

  _normalizeStatusDefinition(status) {
    if (!status) {
      return null;
    }

    if (typeof status === 'string') {
      const label = sanitizeStatusLabel(status);
      if (!label) {
        return null;
      }

      const id = slugify(label);
      return { id, label, badgeClass: 'text-bg-secondary' };
    }

    const label = sanitizeStatusLabel(status.label ?? status.name ?? status.id);
    if (!label) {
      return null;
    }

    let id = typeof status.id === 'string' && status.id.trim()
      ? slugify(status.id)
      : slugify(label);

    if (!id) {
      id = slugify(label);
    }

    const badgeClass = typeof status.badgeClass === 'string' && status.badgeClass.trim()
      ? status.badgeClass.trim()
      : 'text-bg-secondary';

    return { id, label, badgeClass };
  },

  _findTopicInsensitive(topicName) {
    if (!topicName) return undefined;
    const normalized = normalizeTopicName(topicName).toLowerCase();
    return this.data.topics.find(topic => topic.toLowerCase() === normalized);
  },

  _resolveExistingTopic(topicName) {
    return this._findTopicInsensitive(topicName);
  },

  _findCollaboratorInsensitive(name) {
    if (!name) return undefined;
    const normalized = normalizeCollaboratorName(name).toLowerCase();
    return this.data.collaborators.find(collaborator => collaborator.toLowerCase() === normalized);
  },

  _resolveExistingCollaborator(name) {
    return this._findCollaboratorInsensitive(name);
  },

  _findStatusById(id) {
    if (!id) return undefined;
    const normalized = id.toLowerCase();
    return this.data.statuses.find(status => status.id.toLowerCase() === normalized);
  },

  _findStatusByLabelInsensitive(label) {
    if (!label) return undefined;
    const normalized = sanitizeStatusLabel(label).toLowerCase();
    return this.data.statuses.find(status => status.label.toLowerCase() === normalized);
  },

  _resolveExistingStatus(value) {
    if (!value) {
      return undefined;
    }

    return this._findStatusById(value) || this._findStatusByLabelInsensitive(value);
  },

  _normalizeStatusId(status) {
    const resolved = this._resolveExistingStatus(status);
    if (resolved) {
      return resolved.id;
    }

    const defaultStatus = this.getDefaultStatus();
    if (defaultStatus) {
      return defaultStatus.id;
    }

    const fallback = { ...DEFAULT_STATUSES[0] };
    this.data.statuses.push(fallback);
    return fallback.id;
  },

  _normalizeDependencies(dependencies, { excludeId = null, validIds = null } = {}) {
    if (!Array.isArray(dependencies)) {
      return [];
    }

    const referenceIds = validIds || new Set(this.data.tasks.map(task => task.id));
    const normalized = [];
    const seen = new Set();

    dependencies.forEach(candidate => {
      if (typeof candidate !== 'string') {
        return;
      }

      const trimmed = candidate.trim();
      if (!trimmed) {
        return;
      }

      if (excludeId && trimmed === excludeId) {
        return;
      }

      if (!referenceIds.has(trimmed)) {
        return;
      }

      if (seen.has(trimmed)) {
        return;
      }

      seen.add(trimmed);
      normalized.push(trimmed);
    });

    return normalized;
  },

  _areArraysEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      return Array.isArray(a) === Array.isArray(b) && (Array.isArray(a) ? a.length : 0) === (Array.isArray(b) ? b.length : 0);
    }

    if (a.length !== b.length) {
      return false;
    }

    for (let index = 0; index < a.length; index += 1) {
      if (a[index] !== b[index]) {
        return false;
      }
    }

    return true;
  }
};
