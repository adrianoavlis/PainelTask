class FakeEvent {
  constructor(type) {
    this.type = type;
    this.defaultPrevented = false;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }
}

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.parent = null;
    this.children = [];
    this.dataset = {};
    this.eventListeners = {};
    this.style = {};
    this.attributes = {};
    this._classes = new Set();
    this._innerHTML = '';
    this.textContent = '';
  }

  appendChild(child) {
    child.parent = this;
    if (child.ownerDocument !== this.ownerDocument) {
      child.ownerDocument = this.ownerDocument;
    }
    this.children.push(child);
    this.ownerDocument._registerTree(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
      this.ownerDocument._unregisterTree(child);
    }
    return child;
  }

  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  set id(value) {
    this.attributes.id = value;
    this.ownerDocument._registerElement(this);
  }

  get id() {
    return this.attributes.id;
  }

  set name(value) {
    this.attributes.name = value;
  }

  get name() {
    return this.attributes.name;
  }

  set className(value) {
    this._classes = new Set((value || '').split(/\s+/).filter(Boolean));
  }

  get className() {
    return Array.from(this._classes).join(' ');
  }

  get classList() {
    const element = this;
    return {
      add(...classes) {
        classes.flatMap(cls => cls.split(/\s+/)).filter(Boolean).forEach(cls => element._classes.add(cls));
      },
      remove(...classes) {
        classes.flatMap(cls => cls.split(/\s+/)).filter(Boolean).forEach(cls => element._classes.delete(cls));
      },
      contains(cls) {
        return element._classes.has(cls);
      }
    };
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === '') {
      this.children.slice().forEach(child => child.remove());
    }
  }

  get innerHTML() {
    if (this.children.length > 0) {
      return this.children.map(child => child.innerHTML || '').join('');
    }
    return this._innerHTML;
  }

  setAttribute(name, value) {
    if (name === 'id') {
      this.id = value;
      return;
    }
    if (name === 'class') {
      this.className = value;
      return;
    }
    this.attributes[name] = value;
  }

  getAttribute(name) {
    if (name === 'id') {
      return this.id || null;
    }
    if (name === 'class') {
      return this.className;
    }
    return Object.prototype.hasOwnProperty.call(this.attributes, name)
      ? this.attributes[name]
      : null;
  }

  addEventListener(type, handler) {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [];
    }
    this.eventListeners[type].push(handler);
  }

  dispatchEvent(event) {
    event.target = this;
    const listeners = this.eventListeners[event.type] || [];
    listeners.forEach(listener => listener(event));
    return !event.defaultPrevented;
  }

  findDescendants(predicate, results = []) {
    this.children.forEach(child => {
      if (predicate(child)) {
        results.push(child);
      }
      child.findDescendants(predicate, results);
    });
    return results;
  }
}

class FakeDocument {
  constructor() {
    this.elementsById = new Map();
    this.body = new FakeElement('body', this);
    this._registerTree(this.body);
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  getElementById(id) {
    return this.elementsById.get(id) || null;
  }

  querySelector(selector) {
    if (selector === '#taskForm select[name="topic"]') {
      const form = this.getElementById('taskForm');
      if (!form) return null;
      const matches = form.findDescendants(el => el.tagName === 'SELECT' && (el.name === 'topic' || el.getAttribute('name') === 'topic'));
      return matches[0] || null;
    }
    if (selector === '#taskForm select[name="dependencies"]') {
      const form = this.getElementById('taskForm');
      if (!form) return null;
      const matches = form.findDescendants(el => el.tagName === 'SELECT' && (el.name === 'dependencies' || el.getAttribute('name') === 'dependencies'));
      return matches[0] || null;
    }
    if (selector === '#tab-topics .nav-link.active') {
      const links = this.querySelectorAll('#tab-topics .nav-link');
      return links.find(link => link.classList.contains('active')) || null;
    }
    return null;
  }

  querySelectorAll(selector) {
    if (selector === '#tab-topics .nav-link') {
      const container = this.getElementById('tab-topics');
      if (!container) return [];
      return container.findDescendants(el => el.classList && el.classList.contains('nav-link'));
    }
    return [];
  }

  _registerElement(element) {
    if (element.id) {
      this.elementsById.set(element.id, element);
    }
  }

  _registerTree(element) {
    if (element.id) {
      this.elementsById.set(element.id, element);
    }
    element.children.forEach(child => this._registerTree(child));
  }

  _unregisterTree(element) {
    if (element.id) {
      this.elementsById.delete(element.id);
    }
    element.children.forEach(child => this._unregisterTree(child));
  }
}

export function createFakeDocument() {
  return new FakeDocument();
}

export function createEvent(type) {
  return new FakeEvent(type);
}
