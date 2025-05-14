package de.tum.aet.devops25.teamspoved;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.aet.devops25.teamspoved.dto.CreateTicketRequest;
import de.tum.aet.devops25.teamspoved.model.Room;
import de.tum.aet.devops25.teamspoved.model.Ticket;
import de.tum.aet.devops25.teamspoved.model.User;
import de.tum.aet.devops25.teamspoved.service.TicketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class TicketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TicketService ticketService;

    @MockitoBean
    private Clock clock;

    private Room testRoom;
    private User testUser;
    private Ticket testTicket;

    @BeforeEach
    public void setup() {
        // Fixed timestamp for predictable tests
        Instant fixedInstant = Instant.parse("2025-05-14T10:15:30Z");
        when(clock.instant()).thenReturn(fixedInstant);
        when(clock.getZone()).thenReturn(ZoneOffset.UTC);
        
        LocalDateTime fixedDateTime = LocalDateTime.ofInstant(fixedInstant, ZoneOffset.UTC);
        
        // Create test data
        testRoom = new Room("R001", "Terminal A", "Gate A1", "1");
        testUser = new User("U001", "John Smith", User.Role.TECHNICIAN, fixedDateTime, fixedDateTime);
        testTicket = new Ticket(
            "T001",
            testUser.id(),
            fixedDateTime.minusDays(1),
            null,
            null,
            "U002",
            testRoom,
            "Broken light fixture",
            Ticket.Priority.MEDIUM,
            Ticket.Status.OPEN
        );
    }

    @Test
    public void testGetAllTickets() throws Exception {
        when(ticketService.getAllTickets()).thenReturn(List.of(testTicket));

        mockMvc.perform(get("/api/v1/tickets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].ticketId", is(testTicket.ticketId())))
                .andExpect(jsonPath("$[0].description", is(testTicket.description())));
    }

    @Test
    public void testGetTicketById() throws Exception {
        when(ticketService.getTicketById(testTicket.ticketId())).thenReturn(Optional.of(testTicket));

        mockMvc.perform(get("/api/v1/tickets/{ticketId}", testTicket.ticketId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketId", is(testTicket.ticketId())))
                .andExpect(jsonPath("$.description", is(testTicket.description())));
    }

    @Test
    public void testGetTicketById_NotFound() throws Exception {
        when(ticketService.getTicketById("nonexistent")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/tickets/{ticketId}", "nonexistent"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testCreateTicket() throws Exception {
        CreateTicketRequest request = new CreateTicketRequest(
                testUser.id(),
                testRoom.id(),
                "New ticket description",
                Ticket.Priority.HIGH
        );

        when(ticketService.createTicket(any(CreateTicketRequest.class))).thenReturn(testTicket);

        mockMvc.perform(post("/api/v1/tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketId", is(testTicket.ticketId())));
    }

    @Test
    public void testUpdateTicketStatus() throws Exception {
        Ticket updatedTicket = new Ticket(
                testTicket.ticketId(),
                testTicket.createdBy(),
                testTicket.createdAt(),
                LocalDateTime.now(clock),
                testUser.id(),
                testTicket.supervisor(),
                testTicket.room(),
                testTicket.description(),
                testTicket.priority(),
                Ticket.Status.SOLVED
        );

        when(ticketService.updateTicketStatus(
                testTicket.ticketId(),
                Ticket.Status.SOLVED,
                testUser.id()
        )).thenReturn(Optional.of(updatedTicket));

        mockMvc.perform(put("/api/v1/tickets/{ticketId}/status", testTicket.ticketId())
                .param("status", Ticket.Status.SOLVED.toString())
                .param("userId", testUser.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is(Ticket.Status.SOLVED.toString())));
    }

    @Test
    public void testGetAllRooms() throws Exception {
        when(ticketService.getAllRooms()).thenReturn(List.of(testRoom));

        mockMvc.perform(get("/api/v1/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(testRoom.id())))
                .andExpect(jsonPath("$[0].section", is(testRoom.section())));
    }

    @Test
    public void testGetAllUsers() throws Exception {
        when(ticketService.getAllUsers()).thenReturn(List.of(testUser));

        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(testUser.id())))
                .andExpect(jsonPath("$[0].name", is(testUser.name())));
    }

    // --- EDGE CASE TESTS ---

    @Test
    public void testCreateTicket_MissingFields_ShouldReturnBadRequest() throws Exception {
        // Missing description and priority
        String invalidJson = "{" +
                "\"createdBy\":\"" + testUser.id() + "\"," +
                "\"roomId\":\"" + testRoom.id() + "\"}";

        mockMvc.perform(post("/api/v1/tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.description").exists())
                .andExpect(jsonPath("$.priority").exists());
    }

    @Test
    public void testCreateTicket_DescriptionTooShort_ShouldReturnBadRequest() throws Exception {
        CreateTicketRequest request = new CreateTicketRequest(
                testUser.id(),
                testRoom.id(),
                "short",
                Ticket.Priority.HIGH
        );
        mockMvc.perform(post("/api/v1/tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.description").exists());
    }

    @Test
    public void testCreateTicket_NonExistentUser_ShouldReturnBadRequest() throws Exception {
        CreateTicketRequest request = new CreateTicketRequest(
                "nonexistent-user",
                testRoom.id(),
                "Valid description for a ticket.",
                Ticket.Priority.HIGH
        );
        when(ticketService.createTicket(any(CreateTicketRequest.class))).thenThrow(new IllegalArgumentException("User not found"));
        mockMvc.perform(post("/api/v1/tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testCreateTicket_NonExistentRoom_ShouldReturnBadRequest() throws Exception {
        CreateTicketRequest request = new CreateTicketRequest(
                testUser.id(),
                "nonexistent-room",
                "Valid description for a ticket.",
                Ticket.Priority.HIGH
        );
        when(ticketService.createTicket(any(CreateTicketRequest.class))).thenThrow(new IllegalArgumentException("Room not found"));
        mockMvc.perform(post("/api/v1/tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testUpdateTicketStatus_InvalidStatus_ShouldReturnBadRequest() throws Exception {
        // Simulate service throwing IllegalArgumentException for invalid status
        when(ticketService.updateTicketStatus(any(), any(), any())).thenThrow(new IllegalArgumentException("Invalid status"));
        mockMvc.perform(put("/api/v1/tickets/{ticketId}/status", testTicket.ticketId())
                .param("status", "INVALID_STATUS")
                .param("userId", testUser.id()))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testUpdateTicketStatus_NonExistentUser_ShouldReturnNotFound() throws Exception {
        when(ticketService.updateTicketStatus(any(), any(), any())).thenReturn(Optional.empty());
        mockMvc.perform(put("/api/v1/tickets/{ticketId}/status", testTicket.ticketId())
                .param("status", Ticket.Status.SOLVED.toString())
                .param("userId", "nonexistent-user"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testGetTicketsByUser_NoTickets_ShouldReturnEmptyList() throws Exception {
        when(ticketService.getTicketsByUser("user-with-no-tickets")).thenReturn(List.of());
        mockMvc.perform(get("/api/v1/tickets/user/{userId}", "user-with-no-tickets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    public void testGetTicketsByStatus_InvalidStatus_ShouldReturnBadRequest() throws Exception {
        // This will fail at the controller argument resolution, not the service
        mockMvc.perform(get("/api/v1/tickets/status/{status}", "NOT_A_STATUS"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testGetTicketById_NonStringId_ShouldReturnNotFound() throws Exception {
        // Simulate a numeric ID (if only string IDs are valid)
        when(ticketService.getTicketById("12345")).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/v1/tickets/{ticketId}", 12345))
                .andExpect(status().isNotFound());
    }
}
