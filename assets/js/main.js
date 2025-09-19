
import { TaskModel } from './model/taskModel.js';
import { Storage } from './core/storage.js';
import { CalendarView } from './view/calendarView.js';
import { TabsView } from './view/tabsView.js';
import { ModalView } from './view/modalView.js';
import { ListView } from './view/listView.js';
import { ToastView } from './view/toastView.js';
import { ExportUtils } from './core/exportUtils.js';
import { ICSUtils } from './core/icsUtils.js';
import { EventBus } from './core/eventBus.js';

document.addEventListener('DOMContentLoaded', async () => {
  ToastView.init();
  ModalView.init();

  const modeToggleBtn = document.getElementById('toggle-mode');
  const importBtn = document.getElementById('import-json');
  const exportBtn = document.getElementById('export-json');
  const exportICSBtn = document.getElementById('export-ics');
  const fileInput = document.getElementById('json-file');

  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'local';
  Storage.setMode(mode);
  modeToggleBtn.textContent = `Modo: ${mode === 'repo' ? 'Repo' : 'Local'}`;

  modeToggleBtn.addEventListener('click', () => {
    const newMode = Storage.mode === 'local' ? 'repo' : 'local';
    Storage.setMode(newMode);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('mode', newMode);
    window.location.search = searchParams.toString();
  });

  exportBtn.addEventListener('click', () => {
    ExportUtils.exportJSON();
  });

  exportICSBtn.addEventListener('click', () => {
    ICSUtils.exportICS();
  });

  importBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const json = await ExportUtils.importJSON(file);
      if (json.tasks && json.topics) {
        TaskModel.data = json;
        TaskModel.persist();
        ToastView.show('Importação concluída com sucesso!', 'success');
        window.location.reload();
      } else {
        throw new Error('Formato inválido');
      }
    } catch (err) {
      console.error(err);
      ToastView.show('Erro ao importar JSON.', 'danger');
    }
  });

  await TaskModel.init();

  const fab = document.createElement('button');
  fab.className = 'btn btn-primary rounded-circle position-fixed';
  fab.style.bottom = '20px';
  fab.style.right = '20px';
  fab.style.width = '56px';
  fab.style.height = '56px';
  fab.innerHTML = '<strong>+</strong>';
  fab.title = 'Nova tarefa';
  fab.onclick = () => EventBus.emit('openTaskModal');
  document.body.appendChild(fab);

  EventBus.on('topicSelected', topic => {
    CalendarView.render();
    ListView.render(topic);
  });

  EventBus.on('taskAdded', () => {
    ToastView.show('Tarefa salva com sucesso!', 'success');
  });

  EventBus.on('taskUpdated', () => {
    ToastView.show('Tarefa atualizada com sucesso!', 'info');
  });

  EventBus.on('taskRemoved', () => {
    ToastView.show('Tarefa excluída com sucesso!', 'warning');
  });
});
