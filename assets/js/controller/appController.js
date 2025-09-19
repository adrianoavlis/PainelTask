
import { TaskModel } from '../model/taskModel.js';
import { CalendarView } from '../view/calendarView.js';
import { ListView } from '../view/listView.js';
import { ModalView } from '../view/modalView.js';
import { ToastView } from '../view/toastView.js';
import { EventBus } from '../core/eventBus.js';

export const AppController = {
  async init() {
    ToastView.init();
    ModalView.init();

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

    EventBus.on('openTaskModal', () => {
      ModalView.open();
    });

    await TaskModel.init();
  }
};

