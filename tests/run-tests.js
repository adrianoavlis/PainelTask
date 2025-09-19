import { strict as assert } from 'node:assert';
import { createFakeDocument, createEvent } from './helpers/fakeDom.js';

// Provide minimal bootstrap stub used by ModalView
globalThis.bootstrap = {
  Modal: class {
    constructor() {}
    show() {}
    static getInstance() {
      return { hide() {} };
    }
  }
};

// Load application modules after globals are prepared
import { TabsView } from '../assets/js/view/tabsView.js';
import { ToastView } from '../assets/js/view/toastView.js';
import { ModalView } from '../assets/js/view/modalView.js';
import { TaskModel } from '../assets/js/model/taskModel.js';
import { EventBus } from '../assets/js/core/eventBus.js';

function cloneEvents(events) {
  const clone = {};
  for (const [event, handlers] of Object.entries(events)) {
    clone[event] = handlers.slice();
  }
  return clone;
}

function restoreEvents(snapshot) {
  EventBus.events = {};
  for (const [event, handlers] of Object.entries(snapshot)) {
    EventBus.events[event] = handlers.slice();
  }
}

const BASE_EVENTS = cloneEvents(EventBus.events);

class TestRunner {
  constructor() {
    this.tests = [];
  }

  add(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    let passed = 0;
    for (const { name, fn } of this.tests) {
      try {
        await fn();
        console.log(`\u2714 ${name}`);
        passed += 1;
      } catch (error) {
        console.error(`\u2716 ${name}`);
        console.error(error);
      }
    }

    console.log(`\n${passed}/${this.tests.length} tests passed.`);
    if (passed !== this.tests.length) {
      process.exitCode = 1;
    }
  }
}

const runner = new TestRunner();

function test(name, fn) {
  runner.add(name, fn);
}

test('TabsView.render cria abas e emite seleção inicial', () => {
  restoreEvents(BASE_EVENTS);
  const document = createFakeDocument();
  globalThis.document = document;

  const tabContainer = document.createElement('ul');
  tabContainer.id = 'tab-topics';
  document.body.appendChild(tabContainer);

  const originalEmit = EventBus.emit;
  const emitted = [];
  EventBus.emit = function(event, data) {
    emitted.push({ event, data });
    const handlers = this.events[event];
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  };

  EventBus.events = {};

  TabsView.render(['Trabalho', 'Pessoal']);

  const links = document.querySelectorAll('#tab-topics .nav-link');
  assert.equal(links.length, 3, 'deve criar abas para todos os tópicos');
  assert.equal(links[0].classList.contains('active'), true, 'primeira aba deve iniciar ativa');
  assert.deepEqual(emitted, [{ event: 'topicSelected', data: 'Todos' }], 'deve emitir tópico "Todos" inicialmente');

  EventBus.emit = originalEmit;
  restoreEvents(BASE_EVENTS);
});

test('TabsView.render alterna a aba ativa ao clicar', () => {
  restoreEvents(BASE_EVENTS);
  const document = createFakeDocument();
  globalThis.document = document;

  const tabContainer = document.createElement('ul');
  tabContainer.id = 'tab-topics';
  document.body.appendChild(tabContainer);

  const originalEmit = EventBus.emit;
  const emitted = [];
  EventBus.emit = function(event, data) {
    emitted.push({ event, data });
  };

  EventBus.events = {};

  TabsView.render(['Trabalho']);

  const links = document.querySelectorAll('#tab-topics .nav-link');
  emitted.length = 0; // limpar evento inicial

  const workLink = links[1];
  workLink.dispatchEvent(createEvent('click'));

  assert.equal(links[0].classList.contains('active'), false, 'aba "Todos" deve perder a seleção');
  assert.equal(workLink.classList.contains('active'), true, 'aba clicada deve ficar ativa');
  assert.deepEqual(emitted, [{ event: 'topicSelected', data: 'Trabalho' }], 'deve emitir o tópico clicado');

  EventBus.emit = originalEmit;
  restoreEvents(BASE_EVENTS);
});

test('ModalView.updateTopicOptions popula o select com os tópicos atuais', () => {
  restoreEvents(BASE_EVENTS);
  const document = createFakeDocument();
  globalThis.document = document;

  const form = document.createElement('form');
  form.id = 'taskForm';
  const select = document.createElement('select');
  select.name = 'topic';
  form.appendChild(select);
  document.body.appendChild(form);

  const originalGetTopics = TaskModel.getTopics;
  TaskModel.getTopics = () => ['Frontend', 'Backend'];

  ModalView.updateTopicOptions();

  assert.equal(select.innerHTML, '<option value="Frontend">Frontend</option><option value="Backend">Backend</option>', 'select deve ser preenchido com opções dos tópicos');

  TaskModel.getTopics = originalGetTopics;
  restoreEvents(BASE_EVENTS);
});

test('ModalView atualiza opções ao responder aos eventos do EventBus', () => {
  restoreEvents(BASE_EVENTS);
  const document = createFakeDocument();
  globalThis.document = document;

  const form = document.createElement('form');
  form.id = 'taskForm';
  const select = document.createElement('select');
  select.name = 'topic';
  form.appendChild(select);
  document.body.appendChild(form);

  const snapshot = cloneEvents(EventBus.events);
  const modalHandlers = handler => handler.toString().includes('updateTopicOptions');
  EventBus.events = {
    dataLoaded: (snapshot.dataLoaded || []).filter(modalHandlers),
    taskAdded: (snapshot.taskAdded || []).filter(modalHandlers),
    taskUpdated: (snapshot.taskUpdated || []).filter(modalHandlers)
  };

  let calls = 0;
  const originalUpdate = ModalView.updateTopicOptions;
  ModalView.updateTopicOptions = function(...args) {
    calls += 1;
    return originalUpdate.apply(this, args);
  };

  EventBus.emit('taskAdded');
  EventBus.emit('taskUpdated');
  EventBus.emit('dataLoaded', { topics: [] });

  assert.equal(calls, 3, 'updateTopicOptions deve responder aos três eventos monitorados');

  ModalView.updateTopicOptions = originalUpdate;
  restoreEvents(BASE_EVENTS);
});

test('ToastView exibe e remove automaticamente a notificação', () => {
  restoreEvents(BASE_EVENTS);
  const document = createFakeDocument();
  globalThis.document = document;

  ToastView.init();

  const timeouts = [];
  const originalSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (fn, delay) => {
    timeouts.push({ fn, delay });
    return delay;
  };

  ToastView.show('Operação concluída', 'info');

  const container = document.getElementById('toast-container');
  assert.ok(container, 'container de toast deve existir');
  assert.equal(container.children.length, 1, 'deve haver um toast visível');
  assert.ok(container.children[0].innerHTML.includes('Operação concluída'), 'toast deve conter a mensagem informada');

  timeouts.forEach(timeout => timeout.fn());
  assert.equal(container.children.length, 0, 'toast deve ser removido após o tempo configurado');

  globalThis.setTimeout = originalSetTimeout;
  restoreEvents(BASE_EVENTS);
});

await runner.run();
