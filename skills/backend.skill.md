# Backend Skill

## Stack
- Java 17, Spring Boot 3.3, Maven
- Spring Security 6 (SecurityFilterChain, stateless JWT)
- Spring Data JPA + Hibernate + SQL Server
- jjwt 0.12.x para tokens JWT

## Padrões

### Controller
- Usar `@RestController`, `@RequestMapping("/api/resource")`
- Receber DTOs de request, retornar `ApiResponse<T>` com DTO de response
- Nunca retornar entidades JPA diretamente
- Não tratar exceções — delegar ao `GlobalExceptionHandler`

### Service
- Toda regra de negócio fica aqui
- Injetar via construtor (não `@Autowired` em campo)
- Lançar `ResourceNotFoundException` ou `BusinessException` conforme o caso
- Autorização contextual com `SecurityContextHolder.getContext().getAuthentication()`

### Repository
- Interfaces `JpaRepository<Entity, Long>`
- Queries customizadas com `@Query` JPQL quando necessário

### JWT (jjwt 0.12.x)
```java
// Gerar
Jwts.builder().subject(email).issuedAt(new Date())
    .expiration(new Date(now + expiration))
    .signWith(getSignKey()).compact();

// Validar
Jwts.parser().verifyWith(getSignKey()).build()
    .parseSignedClaims(token).getPayload();
```

### Security Config (Spring Security 6)
```java
http.csrf(csrf -> csrf.disable())
    .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/**").permitAll()
        .anyRequest().authenticated())
    .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
    .build();
```

## Convenções
- Package base: `com.paineltask`
- Enums em `model/enums/`: `Role`, `TaskStatus`, `Priority`
- Todas as respostas usam `ApiResponse<T>` como envelope
- Logs com SLF4J + `@Slf4j` (Lombok)
