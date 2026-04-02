#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "=== PainelTask — Start ==="

# Build backend
echo "[1/3] Compilando backend..."
cd backend && mvn package -DskipTests -q --no-transfer-progress && cd ..

# Docker Compose up
echo "[2/3] Subindo containers..."
docker-compose up --build -d

# Aguardar backend
echo "[3/3] Aguardando backend..."
MAX=60; WAITED=0
until curl -sf http://localhost:8080/api/auth/login -o /dev/null 2>&1 || [ "$WAITED" -ge "$MAX" ]; do
    sleep 5; WAITED=$((WAITED+5)); echo "  aguardando... ${WAITED}s"
done

echo ""
echo "PainelTask está no ar!"
echo "  Frontend: http://localhost"
echo "  API:      http://localhost:8080/api"
echo "  Login:    admin@paineltask.com / admin123"
