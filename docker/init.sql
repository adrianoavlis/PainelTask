-- =============================================================
-- PainelTask - Database Initialization Script
-- SQL Server 2022
-- =============================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'PainelTaskDB')
BEGIN
    CREATE DATABASE PainelTaskDB;
END
GO

USE PainelTaskDB;
GO

-- =============================================================
-- USERS
-- =============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id          BIGINT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
        name        NVARCHAR(100)   NOT NULL,
        email       NVARCHAR(255)   NOT NULL,
        password    NVARCHAR(255)   NOT NULL,
        role        NVARCHAR(10)    NOT NULL DEFAULT 'USER',
        active      BIT             NOT NULL DEFAULT 1,
        created_at  DATETIME2       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT uq_users_email UNIQUE (email),
        CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'USER'))
    );

    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_active ON users(active);
END
GO

-- =============================================================
-- TASKS
-- =============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tasks')
BEGIN
    CREATE TABLE tasks (
        id              BIGINT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
        title           NVARCHAR(255)   NOT NULL,
        description     NVARCHAR(MAX)   NULL,
        status          NVARCHAR(10)    NOT NULL DEFAULT 'TODO',
        priority        NVARCHAR(10)    NOT NULL DEFAULT 'MEDIUM',
        due_date        DATE            NULL,
        topic           NVARCHAR(100)   NULL,
        tags            NVARCHAR(500)   NULL,
        notes           NVARCHAR(MAX)   NULL,
        assigned_to     BIGINT          NULL,
        created_by      BIGINT          NOT NULL,
        created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id),
        CONSTRAINT fk_tasks_created_by  FOREIGN KEY (created_by)  REFERENCES users(id),
        CONSTRAINT chk_tasks_status   CHECK (status   IN ('TODO', 'DOING', 'DONE')),
        CONSTRAINT chk_tasks_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH'))
    );

    CREATE INDEX idx_tasks_status      ON tasks(status);
    CREATE INDEX idx_tasks_created_by  ON tasks(created_by);
    CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
    CREATE INDEX idx_tasks_due_date    ON tasks(due_date);
END
GO

-- =============================================================
-- SEED: Admin user
-- Password: admin123 (BCrypt $2a$10$...)
-- =============================================================
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@paineltask.com')
BEGIN
    INSERT INTO users (name, email, password, role, active)
    VALUES (
        'Administrador',
        'admin@paineltask.com',
        '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBpwTTyVMmvzHW',
        'ADMIN',
        1
    );
END
GO

-- =============================================================
-- TRIGGER: auto-update updated_at on tasks
-- =============================================================
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_tasks_updated_at')
BEGIN
    EXEC('
    CREATE TRIGGER trg_tasks_updated_at
    ON tasks
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE tasks
        SET updated_at = GETDATE()
        FROM tasks t
        INNER JOIN inserted i ON t.id = i.id;
    END
    ');
END
GO
