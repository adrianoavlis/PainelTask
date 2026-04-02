# Arquitetura do Sistema — PainelTask

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────────┐
│  Usuário (Browser)                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP :80
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend — Nginx :80                                                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────┐  │
│  │ login.html  │  │dashboard.html│  │ kanban.html│  │tasks.html│  │
│  └─────────────┘  └──────────────┘  └────────────┘  └──────────┘  │
│  js/api.js (fetch wrapper + JWT)                                     │
│  js/auth.js  js/dashboard.js  js/kanban.js  js/tasks.js             │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP /api/* → proxy :8080
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Backend — Spring Boot :8080                                         │
│                                                                      │
│  JwtAuthenticationFilter → SecurityConfig → Controller              │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  AuthController  │  │TaskController│  │  DashboardController  │  │
│  └────────┬─────────┘  └──────┬───────┘  └──────────┬───────────┘  │
│           │                   │                       │              │
│  ┌────────▼─────────┐  ┌──────▼───────┐  ┌──────────▼───────────┐  │
│  │   AuthService    │  │  TaskService │  │   DashboardService   │  │
│  └────────┬─────────┘  └──────┬───────┘  └──────────┬───────────┘  │
│           │                   │                       │              │
│  ┌────────▼─────────┐  ┌──────▼───────────────────────▼───────────┐ │
│  │  UserRepository  │  │         TaskRepository                    │ │
│  └────────┬─────────┘  └────────────────────────────┬─────────────┘ │
└───────────┼─────────────────────────────────────────┼───────────────┘
            │ JPA/Hibernate                            │
            ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SQL Server 2022 :1433 — PainelTaskDB                               │
│  tables: users, tasks                                                │
└─────────────────────────────────────────────────────────────────────┘
```

## Fluxo de Autenticação

```
1. POST /api/auth/login { email, password }
2. AuthService valida credenciais (BCrypt)
3. JwtTokenProvider gera token HS256
4. Response: { token, user: { id, name, email, role } }
5. Frontend armazena token em localStorage
6. Próximas requests: header Authorization: Bearer <token>
7. JwtAuthenticationFilter valida token → popula SecurityContext
```

## Autorização

```
ADMIN → acesso total a todos os endpoints
USER  → acesso apenas às próprias tasks
        (criadas por ele ou atribuídas a ele)

Endpoints públicos: POST /api/auth/login, POST /api/auth/register
```

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5 + Bootstrap 5.3 + Vanilla JS |
| Servidor frontend | Nginx 1.25-alpine |
| Backend | Java 17 + Spring Boot 3.3 |
| Segurança | Spring Security 6 + JWT (jjwt 0.12.x) |
| Persistência | Spring Data JPA + Hibernate |
| Banco de dados | SQL Server 2022 Express |
| Containerização | Docker + Docker Compose |

## Padrões de Projeto

- **Repository Pattern** — abstração do acesso a dados
- **Service Layer** — orquestração de regras de negócio
- **DTO Pattern** — desacoplamento entre API e entidades JPA
- **Global Exception Handler** — tratamento centralizado de erros
- **Stateless Auth** — JWT sem sessão no servidor
