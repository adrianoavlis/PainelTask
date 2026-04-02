# DevOps Skill

## Stack
- Docker + Docker Compose
- Nginx 1.25-alpine (frontend)
- SQL Server 2022 Express

## Docker Compose

3 serviços em rede `paineltask-net`:
- `sqlserver` — porta 1433, volume persistente `sqlserver_data`, health check com sqlcmd
- `backend` — porta 8080, depende do sqlserver saudável, profile `docker`
- `frontend` — porta 80, depende do backend

### Variáveis de Ambiente
Definir em `.env` na raiz (nunca commitar):
```
DB_PASS=SuaSenhaForte@2024
DB_NAME=PainelTaskDB
DB_USER=sa
JWT_SECRET=sua-chave-secreta-com-pelo-menos-256-bits
JWT_EXPIRATION=86400000
```

## Dockerfiles

### Backend
```dockerfile
FROM eclipse-temurin:17-jre-alpine
COPY target/paineltask-backend-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

### Frontend
```dockerfile
FROM nginx:1.25-alpine
COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```
Nginx proxia `/api/` para o backend (`http://backend:8080`), serve o resto como estático.

## Comandos Úteis

```bash
# Rebuild só o backend
docker-compose up --build backend

# Ver logs
docker-compose logs -f backend

# Acesso direto ao SQL Server
docker exec -it paineltask-db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P 'PainelTask@2024'

# Remover volumes (reset total do banco)
docker-compose down -v
```

## Profiles Spring Boot

| Profile | Banco | DDL |
|---------|-------|-----|
| default (local) | SQL Server local | `update` |
| docker | SQL Server container (`sqlserver:1433`) | `validate` |
| test | H2 in-memory | `create-drop` |
