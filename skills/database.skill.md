# Database Skill

## Stack
- SQL Server 2022 (Express via Docker)
- Driver: `mssql-jdbc 12.6.1.jre11`
- ORM: Hibernate / Spring Data JPA

## Schema

```sql
-- users: autenticação e autorização
id BIGINT IDENTITY PK | name | email (UNIQUE) | password (BCrypt)
role NVARCHAR(10): 'ADMIN' | 'USER'
active BIT | created_at DATETIME2

-- tasks: entidade principal
id BIGINT IDENTITY PK | title | description | status ('TODO'|'DOING'|'DONE')
priority ('LOW'|'MEDIUM'|'HIGH') | due_date DATE | topic | tags (CSV) | notes
assigned_to FK(users.id) | created_by FK(users.id)
created_at DATETIME2 | updated_at DATETIME2 (auto via trigger)
```

## Índices
```sql
idx_users_email, idx_users_active
idx_tasks_status, idx_tasks_created_by, idx_tasks_assigned_to, idx_tasks_due_date
```

## Mapeamento JPA

```java
// Entidade com coluna snake_case
@Column(name = "created_by")
private User createdBy;

// Enum como String
@Enumerated(EnumType.STRING)
private TaskStatus status;

// Spring Data Query customizada
@Query("SELECT t FROM Task t WHERE t.createdBy = :user OR t.assignedTo = :user")
List<Task> findByUser(@Param("user") User user);
```

## Inicialização
O arquivo `docker/init.sql` é executado no primeiro start do container SQL Server e:
1. Cria o banco `PainelTaskDB`
2. Cria as tabelas `users` e `tasks`
3. Cria os índices
4. Insere o admin padrão (`admin@paineltask.com` / `admin123`)
5. Cria trigger de `updated_at`

O Hibernate (`ddl-auto: validate` em produção) apenas valida o schema — não cria/altera tabelas.
