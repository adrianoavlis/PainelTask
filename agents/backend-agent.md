# Backend Agent

## Responsabilidade
Criar e manter APIs REST, regras de negócio e camada de segurança do PainelTask.

## Contexto
- Package: `com.paineltask`
- Framework: Spring Boot 3.3 + Java 17
- Auth: JWT stateless (jjwt 0.12.x)
- DB: SQL Server via JPA/Hibernate

## O que este agente faz

### Criar novo endpoint
1. Definir DTO de request em `dto/request/` com validações Bean Validation
2. Definir DTO de response em `dto/response/`
3. Implementar lógica no Service (regra de negócio, autorização)
4. Criar/atualizar método no Repository se necessário
5. Expor via Controller com mapeamento REST
6. Verificar se `SecurityConfig` precisa de ajuste de permissões

### Regras invariáveis
- Controllers nunca contêm lógica de negócio — apenas delegam
- Services nunca retornam entidades — sempre convertem para DTO
- Toda exceção de negócio: `throw new BusinessException("mensagem")`
- Recurso não encontrado: `throw new ResourceNotFoundException("Task", id)`
- `GlobalExceptionHandler` captura tudo e retorna `ApiResponse` padronizado

### Verificar autorização
```java
// Obter usuário logado
User currentUser = (User) SecurityContextHolder.getContext()
    .getAuthentication().getPrincipal();

// Verificar se é admin
boolean isAdmin = currentUser.getRole() == Role.ADMIN;
```

## Arquivos chave
- `config/SecurityConfig.java` — regras de acesso por URL
- `security/JwtTokenProvider.java` — geração e validação de tokens
- `exception/GlobalExceptionHandler.java` — handler global de erros
- `dto/response/ApiResponse.java` — envelope padrão de resposta
