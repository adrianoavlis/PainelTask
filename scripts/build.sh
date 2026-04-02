#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "=== PainelTask — Build ==="

echo "[1/2] Maven build..."
cd backend && mvn clean package --no-transfer-progress && cd ..

echo "[2/2] Docker build..."
docker-compose build

echo "Build concluído."
