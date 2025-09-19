
import { Storage } from './storage.js';

export const Router = {
  init() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || 'local';
    Storage.setMode(mode);

    const modeBtn = document.getElementById('toggle-mode');
    modeBtn.textContent = `Modo: ${mode === 'repo' ? 'Repo' : 'Local'}`;

    modeBtn.addEventListener('click', () => {
      const newMode = Storage.mode === 'local' ? 'repo' : 'local';
      Storage.setMode(newMode);
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('mode', newMode);
      window.location.search = searchParams.toString();
    });
  }
};
