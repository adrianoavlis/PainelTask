
# 📝 TaskBoard – Lista de Tarefas e Calendário

Uma aplicação que permite gerenciar tarefas por assunto e visualizar tudo num calendário mensal.

---

## ✅ Funcionalidades

- 📅 **Calendário dinâmico** (modo grade mensal)
- 🗂️ **Abas por assunto** (ex: TCC, Trabalho, Pessoal)
- 🧱 **Lista estilo Kanban** com status (To-do, Doing, Done)
- ✏️ **CRUD de tarefas** com formulário modal
- 💾 **Modo Local (LocalStorage)** e **Modo Repo (JSON externo)**
- 🔁 **Importar e Exportar tarefas em JSON**
- 📆 **Exportar para Calendário (ICS - iCalendar)**
- 🔔 **Toasts de feedback**
- 📦 **Deploy-ready no GitHub Pages**

---

## 🚀 Como usar

### 1. **Abrir localmente**
- Use Live Server (VSCode) ou abra `index.html` com navegador moderno.
- Adicione `?mode=local` ou `?mode=repo` à URL:
  ```
  index.html?mode=local
  index.html?mode=repo
  ```

### 2. **GitHub Pages**

- Acesse: `https://adrianoavlis.github.io/PainelTask/`)

---

## 🧾 Gerar relatórios automáticos

Crie um resumo mensal a partir dos arquivos JSON com o script:

```bash
node scripts/generate-report.js data/2025/2025-09.json reports/2025-09-19.md
```

O relatório é exportado em Markdown com panorama geral, destaques por status e recomendações baseadas nos dados do snapshot.

Também é possível gerar o relatório atual diretamente pelo menu **Gerar Relatório** na interface web.

---

## 📁 Estrutura do projeto

```
/
├── index.html
├── data/
│   └── 2025/
│       └── 2025-09.json
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js
│       ├── model/taskModel.js
│       ├── core/
│       │   ├── eventBus.js
│       │   ├── storage.js
│       │   ├── exportUtils.js
│       │   └── icsUtils.js
│       └── view/
│           ├── calendarView.js
│           ├── listView.js
│           ├── modalView.js
│           ├── tabsView.js
│           └── toastView.js
```

---

## 🛠️ Tecnologias utilizadas

- HTML5 + CSS3
- Bootstrap 5.3.3
- JavaScript moderno (ES Modules)
- localStorage / JSON externo
- ICS (.ics) export para integração com calendários

---

## 📦 Modos de uso dos dados

### Modo Local (`?mode=local`)
Salva tarefas no `localStorage` do navegador. Ideal para uso pessoal, testes, ou como rascunho.

### Modo Repositório (`?mode=repo`)
Lê dados diretamente de `/data/YYYY-MM.json`. Para atualizar:
1. Exporte as tarefas via botão.
2. Faça **commit** no GitHub com o novo JSON.

---

## 💡 Dicas

- Use a aba **Todos** para visualizar todas as tarefas.
- Exporte em `.ics` para importar no Google Calendar ou Outlook.
- Mantenha backups dos JSONs exportados.
- Combine com controle de versão para histórico completo de tarefas.

---

## 🧠 Contribuições futuras (sugestões)

- Drag-and-drop nos cards (Kanban)
- Checklist por tarefa
- Notificações de vencimento
- Tema escuro / claro
- Sincronização com Google Calendar (via backend)

---

Desenvolvido por [Luis Adriano] para projeto pessoal e open-source!

