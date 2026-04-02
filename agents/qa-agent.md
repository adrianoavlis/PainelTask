# QA Agent

## Responsabilidade
Testes unitários, testes de integração e validação de endpoints do PainelTask.

## Stack de testes
- JUnit 5 + Spring Boot Test
- Mockito (mocking de dependências)
- MockMvc (testes de controllers)
- H2 in-memory (testes de integração)
- Spring Security Test (`@WithMockUser`)

## O que este agente faz

### Criar teste de service
```java
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {
    @Mock TaskRepository taskRepository;
    @Mock UserRepository userRepository;
    @InjectMocks TaskService taskService;

    @Test
    void createTask_shouldReturnTaskResponse() {
        // arrange
        // act
        // assert
    }
}
```

### Criar teste de controller (MockMvc)
```java
@WebMvcTest(TaskController.class)
@Import(SecurityConfig.class)
class TaskControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean TaskService taskService;

    @Test
    @WithMockUser(roles = "USER")
    void getTasks_authenticated_shouldReturn200() throws Exception {
        mockMvc.perform(get("/api/tasks"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }
}
```

### Criar teste de integração
```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")  // usa H2 in-memory
class TaskIntegrationTest { ... }
```

## Cenários obrigatórios por feature
1. Caminho feliz (sucesso)
2. Recurso não encontrado (404)
3. Acesso negado (403) — usuário sem permissão
4. Payload inválido (400) — Bean Validation

## Arquivos chave
- `backend/src/test/java/com/paineltask/service/TaskServiceTest.java`
- `backend/src/test/java/com/paineltask/controller/TaskControllerTest.java`
- `backend/src/test/resources/application-test.yml` (H2 config)
