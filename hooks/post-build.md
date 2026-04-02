# Hook: post-build

Executado após o build do backend ser concluído.

## Ações

```bash
#!/bin/bash
set -e

echo "[post-build] Executando testes..."

# 1. Rodar testes do backend
cd backend
mvn test --no-transfer-progress
if [ $? -ne 0 ]; then
    echo "ERRO: Testes falharam. Build cancelado."
    exit 1
fi

# 2. Verificar se o JAR foi gerado
JAR=$(ls target/paineltask-backend-*.jar 2>/dev/null | head -1)
if [ -z "$JAR" ]; then
    echo "ERRO: JAR não encontrado em backend/target/"
    exit 1
fi

echo "[post-build] JAR gerado: $JAR"
echo "[post-build] Build e testes concluídos com sucesso."
```
