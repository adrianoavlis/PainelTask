
import { Storage } from '../core/storage.js';
import { EventBus } from '../core/eventBus.js';

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
