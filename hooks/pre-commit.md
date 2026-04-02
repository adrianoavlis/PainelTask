# Hook: pre-commit

Executado antes de cada commit git.

## Ações

```bash
#!/bin/bash
set -e

echo "[pre-commit] Verificando padrão de código..."

# 1. Impedir commit de arquivos sensíveis
SENSITIVE_FILES=$(git diff --cached --name-only | grep -E '\.env$|\.env\.local$|secrets\.|credentials\.' || true)
if [ -n "$SENSITIVE_FILES" ]; then
    echo "ERRO: Tentativa de commitar arquivo sensível:"
    echo "$SENSITIVE_FILES"
    exit 1
fi

# 2. Verificar que não há System.out.println no código Java
PRINTLN=$(git diff --cached --name-only --diff-filter=ACM | grep '\.java$' | \
    xargs grep -l 'System\.out\.println' 2>/dev/null || true)
if [ -n "$PRINTLN" ]; then
    echo "AVISO: System.out.println detectado (use @Slf4j + log.info):"
    echo "$PRINTLN"
    # Aviso apenas, não bloqueia
fi

# 3. Verificar compilação do backend (rápido)
if git diff --cached --name-only | grep -q '^backend/'; then
    echo "[pre-commit] Arquivos Java modificados — verificando compilação..."
    cd backend && mvn compile -q --no-transfer-progress
    echo "[pre-commit] Compilação OK."
fi

echo "[pre-commit] Verificações concluídas."
```

## Instalar como git hook
```bash
cp hooks/pre-commit.md .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```
