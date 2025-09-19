
import { TaskModel } from '../model/taskModel.js';

export const ExportUtils = {
  exportJSON() {
    const data = TaskModel.data;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `taskboard-${new Date().toISOString().slice(0, 10)}.json`;
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (event) {
        try {
          const parsed = JSON.parse(event.target.result);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsText(file);
    });
  }
};
