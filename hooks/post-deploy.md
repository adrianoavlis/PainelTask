# Hook: post-deploy

Executado após subir o ambiente com docker-compose.

## Ações

```bash
#!/bin/bash
set -e

echo "[post-deploy] Validando ambiente..."

# 1. Aguardar backend estar disponível (até 60s)
MAX_WAIT=60
WAITED=0
until curl -sf http://localhost:8080/api/auth/login -o /dev/null 2>&1; do
    if [ "$WAITED" -ge "$MAX_WAIT" ]; then
        echo "ERRO: Backend não respondeu em ${MAX_WAIT}s"
        docker-compose logs --tail=50 backend
        exit 1
    fi
    echo "Aguardando backend... (${WAITED}s)"
    sleep 5
    WAITED=$((WAITED + 5))
done

echo "[post-deploy] Backend online."

# 2. Verificar autenticação com usuário admin
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@paineltask.com","password":"admin123"}')

if [ "$HTTP_STATUS" != "200" ]; then
    echo "ERRO: Login admin retornou HTTP $HTTP_STATUS"
    exit 1
fi

echo "[post-deploy] Login admin OK."

# 3. Verificar frontend
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [ "$HTTP_STATUS" != "200" ]; then
    echo "ERRO: Frontend retornou HTTP $HTTP_STATUS"
    exit 1
fi

echo "[post-deploy] Frontend online."
echo ""
echo "PainelTask disponível em:"
echo "  Frontend: http://localhost"
echo "  API:      http://localhost:8080/api"
echo "  Login:    admin@paineltask.com / admin123"
```
