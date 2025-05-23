package de.tum.aet.devops25.teamspoved;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.aet.devops25.teamspoved.dto.CreateTicketRequest;
import de.tum.aet.devops25.teamspoved.model.*;
import de.tum.aet.devops25.teamspoved.service.TicketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.containers.PostgreSQLContainer;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
public class TicketControllerTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("spoved")
            .withUsername("spOveD")
            .withPassword("yourpassword");
            
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TicketService ticketService;

    private UserEntity testUser;
    private UserEntity testAssignee;
    private TicketEntity testTicket;

    @BeforeEach
    public void setup() {
        testUser = new UserEntity();
        testUser.setUserId(1);
        testUser.setName("John Smith");
        testUser.setSupervisor(Role.WORKER);
        testAssignee = new UserEntity();
        testAssignee.setUserId(2);
        testAssignee.setName("Jane Doe");
        testAssignee.setSupervisor(Role.SUPERVISOR);
        testTicket = new TicketEntity();
        testTicket.setTicketId(100);
        testTicket.setCreatedBy(testUser);
        testTicket.setAssignedTo(testAssignee);
        testTicket.setTitle("Broken light fixture");
        testTicket.setDescription("Light is broken in hallway");
        testTicket.setStatus(Status.IN_PROGRESS);
        testTicket.setDueDate(LocalDate.now().plusDays(2));
        testTicket.setLocation("Hallway 1");
        testTicket.setMediaType(MediaTypeEnum.AUDIO);
    }

    @Test
    public void testGetAllTickets() throws Exception {
        when(ticketService.getAllTickets()).thenReturn(List.of(testTicket));
        mockMvc.perform(get("/api/v1/tickets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].ticketId", is(testTicket.getTicketId())))
                .andExpect(jsonPath("$[0].description", is(testTicket.getDescription())));
    }

    @Test
    public void testGetTicketById() throws Exception {
        when(ticketService.getTicketById(testTicket.getTicketId())).thenReturn(Optional.of(testTicket));
        mockMvc.perform(get("/api/v1/tickets/{ticketId}", testTicket.getTicketId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketId", is(testTicket.getTicketId())))
                .andExpect(jsonPath("$.description", is(testTicket.getDescription())));
    }

    @Test
    public void testGetTicketById_NotFound() throws Exception {
        when(ticketService.getTicketById(99999)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/v1/tickets/{ticketId}", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testCreateTicket() throws Exception {
        CreateTicketRequest request = new CreateTicketRequest(
                testUser.getUserId(),
                testAssignee.getUserId(),
                "New ticket title",
                "New ticket description",
                LocalDate.now().plusDays(1),
                "Lobby",
                MediaTypeEnum.AUDIO
        );
        when(ticketService.createTicket(any(CreateTicketRequest.class))).thenReturn(testTicket);
        mockMvc.perform(post("/api/v1/tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketId", is(testTicket.getTicketId())));
    }

    @Test
    public void testUpdateTicketStatus() throws Exception {
        TicketEntity updatedTicket = new TicketEntity();
        updatedTicket.setTicketId(testTicket.getTicketId());
        updatedTicket.setCreatedBy(testUser);
        updatedTicket.setAssignedTo(testAssignee);
        updatedTicket.setTitle(testTicket.getTitle());
        updatedTicket.setDescription(testTicket.getDescription());
        updatedTicket.setStatus(Status.FINISHED);
        updatedTicket.setDueDate(testTicket.getDueDate());
        updatedTicket.setLocation(testTicket.getLocation());
        updatedTicket.setMediaType(testTicket.getMediaType());
        when(ticketService.updateTicketStatus(testTicket.getTicketId(), Status.FINISHED)).thenReturn(Optional.of(updatedTicket));
        mockMvc.perform(put("/api/v1/tickets/{ticketId}/status", testTicket.getTicketId())
                .param("status", Status.FINISHED.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is(Status.FINISHED.toString())));
    }

    @Test
    public void testGetAllUsers() throws Exception {
        when(ticketService.getAllUsers()).thenReturn(List.of(testUser));
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].userId", is(testUser.getUserId())))
                .andExpect(jsonPath("$[0].name", is(testUser.getName())));
    }

    @Test
    public void testGetUserById() throws Exception {
        when(ticketService.getUserById(testUser.getUserId())).thenReturn(Optional.of(testUser));
        mockMvc.perform(get("/api/v1/users/{userId}", testUser.getUserId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId", is(testUser.getUserId())))
                .andExpect(jsonPath("$.name", is(testUser.getName())));
    }

    @Test
    public void testGetUserById_NotFound() throws Exception {
        when(ticketService.getUserById(99999)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/v1/users/{userId}", 99999))
                .andExpect(status().isNotFound());
    }
}
