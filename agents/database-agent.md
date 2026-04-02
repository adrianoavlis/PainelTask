# Database Agent

## Responsabilidade
Modelagem, scripts SQL e otimização do banco SQL Server do PainelTask.

## Schema atual
- `users`: autenticação e autorização
- `tasks`: entidade principal do sistema

## O que este agente faz

### Adicionar nova tabela
1. Criar script em `docker/migrations/VX__descricao.sql` (nomeação versionada)
2. Incluir: CREATE TABLE + índices + FK constraints + CHECK constraints
3. Atualizar `docker/init.sql` se for tabela inicial do sistema
4. Criar entidade JPA correspondente em `backend/src/main/java/com/paineltask/model/`
5. Criar repository interface
6. Atualizar `application.yml` se necessário (ddl-auto)

### Criar índice de performance
```sql
-- Sempre criar índices em colunas usadas em WHERE, JOIN e ORDER BY
CREATE INDEX idx_tasks_topic ON tasks(topic);
CREATE INDEX idx_tasks_status_priority ON tasks(status, priority);
```

### Verificar integridade
```sql
-- Verificar FKs órfãs
SELECT t.id FROM tasks t
LEFT JOIN users u ON t.created_by = u.id
WHERE u.id IS NULL;
```

### Constraints importantes
- `role` em users: CHECK IN ('ADMIN', 'USER')
- `status` em tasks: CHECK IN ('TODO', 'DOING', 'DONE')
- `priority` em tasks: CHECK IN ('LOW', 'MEDIUM', 'HIGH')
- `updated_at` em tasks: atualizado automaticamente via trigger

## Arquivos chave
- `docker/init.sql` — script de inicialização do banco
- `backend/src/main/resources/application.yml` — config de conexão e ddl-auto
- `backend/src/main/resources/application-docker.yml` — config do container
