package de.tum.aet.devops25.teamspoved;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.aet.devops25.teamspoved.controller.TicketController;
import de.tum.aet.devops25.teamspoved.dto.CreateTicketRequest;
import de.tum.aet.devops25.teamspoved.model.*;
import de.tum.aet.devops25.teamspoved.service.TicketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {TicketController.class})
@AutoConfigureMockMvc(addFilters = false)
public class TicketControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TicketService ticketService;

    private UserEntity testUser;
    private UserEntity testAssignee;
    private TicketEntity testTicket;

    @BeforeEach
    public void setup() {
        testUser = new UserEntity();
        testUser.setUserId(1);
        testUser.setName("John Smith");
        testUser.setRole(Role.WORKER);
        testAssignee = new UserEntity();
        testAssignee.setUserId(2);
        testAssignee.setName("Jane Doe");
        testAssignee.setRole(Role.SUPERVISOR);
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
        when(ticketService.getFilteredTickets(any(), any(), any(), any(), any(), any())).thenReturn(List.of(testTicket));
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
    public void testGetAllTickets_withFilters() throws Exception {
        when(ticketService.getFilteredTickets(any(), any(), any(), any(), any(), any())).thenReturn(List.of(testTicket));
        mockMvc.perform(get("/api/v1/tickets")
                .param("assignedToId", String.valueOf(testAssignee.getUserId()))
                .param("createdById", String.valueOf(testUser.getUserId()))
                .param("status", Status.IN_PROGRESS.toString())
                .param("dueDate", LocalDate.now().plusDays(2).toString())
                .param("location", "Hallway 1")
                .param("mediaType", MediaTypeEnum.AUDIO.toString())
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].ticketId", is(testTicket.getTicketId())))
                .andExpect(jsonPath("$[0].description", is(testTicket.getDescription())));
    }
}
