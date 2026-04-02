# DevOps Agent

## Responsabilidade
Docker, build automatizado e ambiente local do PainelTask.

## Arquivos gerenciados
- `docker-compose.yml` — orquestração dos 3 serviços
- `backend/Dockerfile` — build da imagem Java
- `frontend/Dockerfile` — build da imagem Nginx
- `frontend/nginx.conf` — configuração do proxy reverso
- `docker/init.sql` — inicialização do banco
- `scripts/` — utilitários de build/start/stop

## O que este agente faz

### Build e start completo
```bash
bash scripts/build.sh  # compila backend + build das imagens
bash scripts/start.sh  # sobe ambiente completo
```

### Verificar saúde dos serviços
```bash
docker-compose ps
docker-compose logs -f backend
curl http://localhost:8080/api/actuator/health  # se actuator habilitado
```

### Adicionar nova variável de ambiente
1. Declarar em `docker-compose.yml` no serviço correspondente
2. Documentar em `.env.example` (nunca commitar `.env`)
3. Adicionar em `application-docker.yml` com `${NOME_VAR:valor_padrao}`

### Rebuild seletivo (sem parar outros serviços)
```bash
docker-compose up --build --no-deps backend
```

### Reset completo (dados incluídos)
```bash
docker-compose down -v          # remove containers e volumes
docker-compose up --build       # sobe do zero
```

## Configuração do Nginx (proxy)
```nginx
location /api/ {
    proxy_pass http://backend:8080;  # nome do serviço Docker
}
location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
}
```

## Ports
| Serviço | Port |
|---------|------|
| Frontend (Nginx) | 80 |
| Backend (Spring Boot) | 8080 |
| SQL Server | 1433 |
