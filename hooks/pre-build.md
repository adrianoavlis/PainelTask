# Hook: pre-build

Executado antes de iniciar qualquer build (mvn ou docker build).

## Ações

```bash
#!/bin/bash
set -e

echo "[pre-build] Validando estrutura do projeto..."

# 1. Verificar Java 17+
JAVA_VERSION=$(java -version 2>&1 | head -1 | awk -F '"' '{print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "ERRO: Java 17+ requerido. Versão atual: $JAVA_VERSION"
    exit 1
fi

# 2. Verificar Maven
if ! command -v mvn &> /dev/null; then
    echo "ERRO: Maven não encontrado no PATH"
    exit 1
fi

# 3. Verificar Docker e Docker Compose
if ! command -v docker &> /dev/null; then
    echo "ERRO: Docker não encontrado"
    exit 1
fi

# 4. Verificar arquivo .env
if [ ! -f ".env" ]; then
    echo "AVISO: .env não encontrado. Copiando de .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "AVISO: Revise as variáveis em .env antes de continuar."
    fi
fi

# 5. Verificar pom.xml do backend
if [ ! -f "backend/pom.xml" ]; then
    echo "ERRO: backend/pom.xml não encontrado"
    exit 1
fi

echo "[pre-build] Validação concluída."
```
