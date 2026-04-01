
const STORAGE_KEY = 'taskboard-data';

function getRepoPath() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `./data/${year}/${year}-${month}.json`;
}

export const Storage = {
  mode: 'local', // 'local' | 'repo'

  setMode(newMode) {
    this.mode = newMode;
  },

  async load() {
    if (this.mode === 'repo') {
      try {
        const response = await fetch(getRepoPath());
        if (!response.ok) throw new Error('Erro ao carregar dados do repositório.');
        const json = await response.json();
        return json;
      } catch (error) {
        console.error(error);
        alert('Erro ao carregar JSON remoto.');
        return null;
      }
    } else {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    }
  },

  async save(data) {
    if (this.mode === 'local') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } else {
      alert('Você está no modo de repositório. Para salvar, exporte e faça commit manualmente.');
      return false;
    }
  },

  clear() {
    if (this.mode === 'local') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};
