# Frontend Agent

## Responsabilidade
Criar e manter páginas HTML, integração com a API REST e experiência de usuário do PainelTask.

## Contexto
- Stack: HTML5 + Bootstrap 5.3 + Vanilla JS
- Servido por: Nginx
- API: `http://localhost:8080/api` (local) ou via proxy Nginx em prod

## O que este agente faz

### Criar nova página
1. Criar `frontend/pages/nova-pagina.html` com navbar e estrutura Bootstrap
2. Criar `frontend/js/nova-pagina.js` com lógica da página
3. Adicionar `auth.requireAuth()` no topo do JS (se página protegida)
4. Usar `api.get()`, `api.post()`, etc. para chamar o backend
5. Adicionar link de navegação na navbar (em outras páginas se necessário)

### Integração com API
```js
// SEMPRE importar api.js e auth.js antes do script da página
// Chamar a API
const tasks = await api.get('/tasks');
const task  = await api.post('/tasks', { title, status, priority });
await api.patch(`/tasks/${id}/status`, { status: 'DONE' });
await api.delete(`/tasks/${id}`);
```

### Autenticação nas páginas
```js
// Início de todo script de página protegida
import { auth } from '../js/auth.js';
auth.requireAuth(); // redireciona para login se não autenticado

const user = auth.getUser();
if (auth.isAdmin()) { /* mostrar opções de admin */ }
```

### Kanban — adicionar coluna ou card
- Colunas mapeadas: `TODO` → #col-todo, `DOING` → #col-doing, `DONE` → #col-done
- Cards são `draggable="true"` com `data-id` e `data-status`
- Drop → `PATCH /api/tasks/{id}/status`

## Arquivos chave
- `frontend/js/api.js` — wrapper de fetch com JWT e tratamento de erros
- `frontend/js/auth.js` — gestão de autenticação e usuário logado
- `frontend/js/utils.js` — formatação de datas, prioridades, badges
- `frontend/css/style.css` — estilos customizados além do Bootstrap
