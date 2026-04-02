# Frontend Skill

## Stack
- HTML5 + CSS3 + Bootstrap 5.3
- JavaScript Vanilla (ES Modules onde possível)
- Nginx para servir os assets estáticos

## Padrões

### API Layer (`js/api.js`)
Todas as chamadas passam pelo wrapper central:
```js
const res = await api.get('/tasks');
const res = await api.post('/tasks', { title, status, priority });
```
O wrapper injeta o `Authorization: Bearer <token>` automaticamente e redireciona para `/pages/login.html` em 401.

### Autenticação
- Token JWT armazenado em `localStorage` com chave `'pt_token'`
- Dados do usuário em `localStorage` com chave `'pt_user'` (JSON)
- `auth.js` expõe `getToken()`, `getUser()`, `logout()`, `isAdmin()`
- Todas as páginas (exceto login) chamam `auth.requireAuth()` no início do script

### Kanban
- Colunas: `TODO`, `DOING`, `DONE`
- Drag & drop nativo HTML5 (`draggable="true"`, `ondragover`, `ondrop`)
- PATCH `/api/tasks/{id}/status` para atualizar status via drop

### Estrutura das Páginas
```html
<!-- Padrão de toda página autenticada -->
<nav> <!-- navbar Bootstrap com nome do usuário e botão logout --> </nav>
<main class="container-fluid mt-4"> <!-- conteúdo --> </main>
<script src="../js/api.js"></script>
<script src="../js/auth.js"></script>
<script src="../js/[page].js"></script>
```

## Variáveis de Config
```js
// js/api.js
const API_BASE = 'http://localhost:8080/api';
```
Em produção, sobrescrever com a URL real do backend.
