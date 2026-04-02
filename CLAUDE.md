# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
# Backend (Spring Boot)
cd backend
mvn clean install          # build + tests
mvn spring-boot:run        # run local (SQL Server must be up)
mvn test                   # unit tests only
mvn test -Dtest=TaskServiceTest  # single test class

# Frontend
# Serve staticamente (qualquer servidor HTTP)
# Ou via Docker (recomendado)

# Docker — ambiente completo
docker-compose up --build          # sobe tudo (sqlserver + backend + frontend)
docker-compose up -d               # background
docker-compose down                # para tudo
docker-compose logs -f backend     # logs do backend

# Scripts de conveniência
bash scripts/start.sh   # build + docker-compose up
bash scripts/stop.sh    # docker-compose down
bash scripts/build.sh   # mvn build + docker build
```

---

## Arquitetura

### Visão Geral

```
[Frontend: Nginx :80]
       |  REST (JSON + JWT)
[Backend: Spring Boot :8080]
       |  JPA/Hibernate
[SQL Server :1433]
```

O frontend é HTML + Bootstrap 5 + Vanilla JS servido por Nginx. Toda lógica de negócio está no backend. A comunicação é exclusivamente via REST API com autenticação JWT Bearer.

### Estrutura de Pastas

```
/backend      → Spring Boot 3 + Java 17 (Maven)
/frontend     → HTML/CSS/JS estático (servido por Nginx)
/docker       → init.sql e configs de infra
/docs         → arquitetura, endpoints, setup
/scripts      → utilitários de build/deploy
/skills       → perfis de habilidades para agentes
/agents       → definições de agentes especializados
/hooks        → hooks de ciclo de vida CI/CD
```

O código original do protótipo (index.html, assets/) permanece na raiz para referência histórica.

### Backend — Camadas

```
controller/   → REST endpoints (@RestController), validação de entrada, delegam para service
service/      → regras de negócio, autorização contextual, usa repositórios
repository/   → Spring Data JPA interfaces
model/        → entidades JPA (User, Task) + enums (Role, TaskStatus, Priority)
dto/          → objetos de entrada (request/) e saída (response/); NUNCA expor entities diretamente
security/     → JwtTokenProvider, JwtAuthenticationFilter, UserDetailsServiceImpl
config/       → SecurityConfig (SecurityFilterChain)
exception/    → GlobalExceptionHandler (@RestControllerAdvice), exceções customizadas
```

**Fluxo de autenticação:**
1. POST `/api/auth/login` → valida credenciais → retorna JWT
2. Frontend inclui `Authorization: Bearer <token>` em todas as requisições
3. `JwtAuthenticationFilter` intercepta, valida token, popula SecurityContext

**Autorização:**
- `ADMIN` — acesso total, vê todas as tasks de todos os usuários
- `USER` — vê/gerencia apenas suas próprias tasks

### Frontend — Páginas

| Página | Arquivo | Acesso |
|--------|---------|--------|
| Login | `pages/login.html` | público |
| Dashboard | `pages/dashboard.html` | autenticado |
| Kanban | `pages/kanban.html` | autenticado |
| Tasks | `pages/tasks.html` | autenticado |
| Usuários | `pages/users.html` | ADMIN |

`js/api.js` é o wrapper central de fetch: injeta o JWT em todas as chamadas, redireciona para login em 401.

### Modelo de Dados

```
users: id, name, email, password (BCrypt), role (ADMIN|USER), active, created_at
tasks: id, title, description, status (TODO|DOING|DONE), priority (LOW|MEDIUM|HIGH),
       due_date, topic, tags, notes, assigned_to (FK users), created_by (FK users),
       created_at, updated_at
```

### API REST

```
POST   /api/auth/login           público
POST   /api/auth/register        público

GET    /api/users                ADMIN
GET    /api/users/me             autenticado
PUT    /api/users/{id}           ADMIN ou próprio
DELETE /api/users/{id}           ADMIN

GET    /api/tasks                autenticado (ADMIN=todas, USER=próprias)
POST   /api/tasks                autenticado
GET    /api/tasks/{id}           autenticado
PUT    /api/tasks/{id}           autenticado
DELETE /api/tasks/{id}           autenticado
PATCH  /api/tasks/{id}/status    autenticado

GET    /api/dashboard/summary    autenticado
```

---

## Padrões Obrigatórios

- **Nunca expor entidades JPA diretamente** — sempre converter para DTO antes de retornar
- **Toda resposta da API** usa `ApiResponse<T>` como envelope
- **Erros** tratados globalmente em `GlobalExceptionHandler` — nunca try/catch nos controllers
- **Segurança por método**: `@PreAuthorize` nos services quando necessário além da config global
- **Variáveis de ambiente** para segredos (JWT secret, senhas do banco) — nunca hardcoded em código de produção

---

## Variáveis de Ambiente (docker-compose / .env)

```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
JWT_SECRET (mín. 256 bits)
JWT_EXPIRATION (ms, padrão 86400000 = 24h)
```
