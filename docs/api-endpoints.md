# API Endpoints — PainelTask

Base URL: `http://localhost:8080/api`

Todos os endpoints (exceto `/auth/**`) requerem header:
```
Authorization: Bearer <jwt_token>
```

Todas as respostas seguem o envelope:
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "Erro", "data": null }
```

---

## Auth

### POST /api/auth/login
```json
// Request
{ "email": "admin@paineltask.com", "password": "admin123" }

// Response 200
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "user": { "id": 1, "name": "Administrador", "email": "...", "role": "ADMIN" }
  }
}
```

### POST /api/auth/register
```json
// Request
{ "name": "João Silva", "email": "joao@empresa.com", "password": "senha123" }

// Response 201
{ "success": true, "data": { "id": 2, "name": "João Silva", "email": "...", "role": "USER" } }
```

---

## Users

### GET /api/users — ADMIN only
```json
// Response 200
{ "success": true, "data": [ { "id": 1, "name": "...", "email": "...", "role": "ADMIN", "active": true } ] }
```

### GET /api/users/me
```json
// Response 200
{ "success": true, "data": { "id": 2, "name": "João", "email": "...", "role": "USER" } }
```

### PUT /api/users/{id} — ADMIN ou próprio usuário
```json
// Request
{ "name": "João da Silva" }

// Response 200
{ "success": true, "data": { "id": 2, "name": "João da Silva", ... } }
```

### DELETE /api/users/{id} — ADMIN only
```json
// Response 200
{ "success": true, "message": "Usuário desativado com sucesso" }
```

---

## Tasks

### GET /api/tasks
```
Query params opcionais:
  status=TODO|DOING|DONE
  priority=LOW|MEDIUM|HIGH
  topic=string
  assignedTo=userId
```
```json
// Response 200
{ "success": true, "data": [ { "id": 1, "title": "...", "status": "TODO", "priority": "HIGH", ... } ] }
```

### POST /api/tasks
```json
// Request
{
  "title": "Implementar relatório mensal",
  "description": "Relatório em PDF com métricas",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2024-12-31",
  "topic": "Relatórios",
  "tags": "relatório,pdf",
  "assignedToId": 2
}

// Response 201
{ "success": true, "data": { "id": 5, "title": "...", ... } }
```

### GET /api/tasks/{id}
```json
// Response 200
{ "success": true, "data": { "id": 5, "title": "...", "status": "TODO", "createdBy": { "id": 1, ... } } }

// Response 404
{ "success": false, "message": "Task não encontrada com id: 5" }
```

### PUT /api/tasks/{id}
```json
// Request — mesmos campos do POST (todos opcionais)
{ "title": "Novo título", "status": "DOING" }

// Response 200
{ "success": true, "data": { "id": 5, "title": "Novo título", "status": "DOING", ... } }
```

### DELETE /api/tasks/{id}
```json
// Response 200
{ "success": true, "message": "Task removida com sucesso" }
```

### PATCH /api/tasks/{id}/status
```json
// Request
{ "status": "DONE" }

// Response 200
{ "success": true, "data": { "id": 5, "status": "DONE", ... } }
```

---

## Dashboard

### GET /api/dashboard/summary
```json
// Response 200
{
  "success": true,
  "data": {
    "totalTasks": 42,
    "byStatus": { "TODO": 15, "DOING": 10, "DONE": 17 },
    "byPriority": { "LOW": 5, "MEDIUM": 20, "HIGH": 17 },
    "overdueTasks": 3,
    "completionRate": 40.5
  }
}
```

---

## HTTP Status Codes

| Código | Situação |
|--------|---------|
| 200 | Sucesso |
| 201 | Criado |
| 400 | Payload inválido (Bean Validation) |
| 401 | Não autenticado (token ausente ou expirado) |
| 403 | Sem permissão (role insuficiente) |
| 404 | Recurso não encontrado |
| 500 | Erro interno |
