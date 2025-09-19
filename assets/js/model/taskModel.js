
import { Storage } from '../core/storage.js';
import { EventBus } from '../core/eventBus.js';

export const TaskModel = {
  data: {
    meta: {},
    topics: [],
    tasks: []
  },

  ensureDataIntegrity() {
    if (!Array.isArray(this.data.topics)) {
      this.data.topics = [];
    }
    if (!Array.isArray(this.data.tasks)) {
      this.data.tasks = [];
    }
  },

  async init() {
    const loaded = await Storage.load();
    if (loaded) {
      this.data = loaded;
      this.ensureDataIntegrity();
      EventBus.emit('dataLoaded', this.data);
    }
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
    task.id = `t-${Date.now()}`;
    task.createdAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    this.data.tasks.push(task);
    this.persist();
    EventBus.emit('taskAdded', task);
  },

  updateTask(updatedTask) {
    const index = this.data.tasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      updatedTask.updatedAt = new Date().toISOString();
      this.data.tasks[index] = updatedTask;
      this.persist();
      EventBus.emit('taskUpdated', updatedTask);
    }
  },


  getTasksByTopic(topic) {
    return this.data.tasks.filter(task => task.topic === topic);
  },

  addTopic(name) {
    const topicName = name?.trim();
    if (!topicName) {
      return { success: false, message: 'Informe um nome válido para o assunto.' };
    }
    if (this.data.topics.includes(topicName)) {
      return { success: false, message: 'Já existe um assunto com este nome.' };
    }
    this.data.topics.push(topicName);
    this.data.topics.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    this.persist();
    EventBus.emit('topicsChanged', { topics: this.data.topics });
    return { success: true, topic: topicName };
  },

  renameTopic(oldName, newName) {
    const nextName = newName?.trim();
    if (!nextName) {
      return { success: false, message: 'Informe um nome válido para o assunto.' };
    }
    if (!this.data.topics.includes(oldName)) {
      return { success: false, message: 'O assunto selecionado não existe mais.' };
    }
    if (oldName === nextName) {
      return { success: true, topic: nextName };
    }
    if (this.data.topics.includes(nextName)) {
      return { success: false, message: 'Já existe outro assunto com este nome.' };
    }

    this.data.topics = this.data.topics.map(topic => topic === oldName ? nextName : topic);
    const now = new Date().toISOString();
    this.data.tasks = this.data.tasks.map(task => {
      if (task.topic === oldName) {
        return { ...task, topic: nextName, updatedAt: now };
      }
      return task;
    });

    this.data.topics.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    this.persist();
    EventBus.emit('topicsChanged', { topics: this.data.topics, forcedActive: nextName });
    EventBus.emit('tasksBulkUpdated', this.data.tasks);
    return { success: true, topic: nextName };
  },

  removeTopic(topicName) {
    if (!this.data.topics.includes(topicName)) {
      return { success: false, message: 'O assunto informado não existe.' };
    }

    this.data.topics = this.data.topics.filter(topic => topic !== topicName);
    const tasksBefore = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter(task => task.topic !== topicName);
    const removedTasks = tasksBefore - this.data.tasks.length;

    this.persist();
    EventBus.emit('topicsChanged', { topics: this.data.topics, forcedActive: 'Todos' });
    EventBus.emit('tasksBulkUpdated', this.data.tasks);

    return { success: true, removedTasks };

  removeTask(id) {
    const index = this.data.tasks.findIndex(task => task.id === id);
    if (index !== -1) {
      const [removedTask] = this.data.tasks.splice(index, 1);
      this.persist();
      EventBus.emit('taskRemoved', removedTask);
    }

  },

  persist() {
    Storage.save(this.data);
  }
};
