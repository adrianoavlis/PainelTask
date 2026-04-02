#!/bin/bash
cd "$(dirname "$0")/.."
echo "=== PainelTask — Stop ==="
docker-compose down
echo "Containers parados."
