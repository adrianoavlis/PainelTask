# Setup — PainelTask

## Pré-requisitos

| Ferramenta | Versão mínima |
|-----------|--------------|
| Docker Desktop | 24.x |
| Docker Compose | 2.x |
| Java (dev local) | 17 |
| Maven (dev local) | 3.9 |

---

## Início Rápido (Docker)

```bash
# 1. Clonar o repositório
git clone https://github.com/adrianoavlis/PainelTask.git
cd PainelTask

# 2. Criar arquivo de variáveis (opcional — tem valores padrão)
cp .env.example .env
# editar .env se necessário

# 3. Subir tudo
docker-compose up --build

# 4. Aguardar os serviços subirem (~60s na primeira vez)
# SQL Server demora mais no primeiro boot

# 5. Acessar
# Frontend: http://localhost
# API:      http://localhost:8080/api
# Login:    admin@paineltask.com / admin123
```

---

## Desenvolvimento Local (sem Docker)

### 1. Banco de Dados
Subir apenas o SQL Server via Docker:
```bash
docker-compose up sqlserver
```

### 2. Backend
```bash
cd backend
mvn spring-boot:run
# Ou com IDE: rodar PainelTaskApplication.java
```
O profile `default` conecta em `localhost:1433`.

### 3. Frontend
Abrir qualquer servidor HTTP simples na pasta `frontend/`:
```bash
# Python
python -m http.server 3000 --directory frontend

# Node.js
npx serve frontend
```
Ou abrir `frontend/pages/login.html` diretamente no browser.

---

## Variáveis de Ambiente

Criar arquivo `.env` na raiz (nunca commitar):

```env
DB_PASS=PainelTask@2024
DB_NAME=PainelTaskDB
DB_USER=sa
JWT_SECRET=paineltask-super-secret-key-min-256-bits-for-hs256-algorithm
JWT_EXPIRATION=86400000
```

---

## Usuário Padrão

| Campo | Valor |
|-------|-------|
| Email | admin@paineltask.com |
| Senha | admin123 |
| Role  | ADMIN |

---

## Rodar Testes

```bash
cd backend
mvn test                              # todos os testes
mvn test -Dtest=TaskServiceTest       # teste específico
mvn test -Dtest=TaskControllerTest    # controller test
```

Os testes usam H2 in-memory (profile `test`) — não precisam de SQL Server.

---

## Parar o Ambiente

```bash
docker-compose down           # para containers (mantém dados)
docker-compose down -v        # para containers E remove o banco
```

---

## Troubleshooting

**SQL Server demora para iniciar:**
O health check aguarda até 100 segundos. Se falhar, verifique:
```bash
docker-compose logs sqlserver
```

**Backend não conecta ao banco:**
Verificar se `DB_PASS` no `.env` corresponde ao `SA_PASSWORD` do SQL Server.

**401 em todas as requisições:**
Token expirado. Fazer login novamente ou aumentar `JWT_EXPIRATION`.
