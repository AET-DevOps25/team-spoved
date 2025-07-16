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

    private Integer testUserId;
    private Integer testAssigneeId;
    private TicketEntity testTicket;

    @BeforeEach
    public void setup() {
        testUserId = 1;
        testAssigneeId = 2;
        
        testTicket = new TicketEntity();
        testTicket.setTicketId(100);
        testTicket.setCreatedBy(testUserId);
        testTicket.setAssignedTo(testAssigneeId);
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
        mockMvc.perform(get("/tickets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].ticketId", is(testTicket.getTicketId())))
                .andExpect(jsonPath("$[0].description", is(testTicket.getDescription())))
                .andExpect(jsonPath("$[0].createdBy", is(testUserId)))
                .andExpect(jsonPath("$[0].assignedTo", is(testAssigneeId)));
    }

    @Test
    public void testGetTicketById() throws Exception {
        when(ticketService.getTicketById(testTicket.getTicketId())).thenReturn(Optional.of(testTicket));
        mockMvc.perform(get("/tickets/{ticketId}", testTicket.getTicketId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketId", is(testTicket.getTicketId())))
                .andExpect(jsonPath("$.description", is(testTicket.getDescription())))
                .andExpect(jsonPath("$.createdBy", is(testUserId)))
                .andExpect(jsonPath("$.assignedTo", is(testAssigneeId)));
    }

    @Test
    public void testGetTicketById_NotFound() throws Exception {
        when(ticketService.getTicketById(99999)).thenReturn(Optional.empty());
        mockMvc.perform(get("/tickets/{ticketId}", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testCreateTicket() throws Exception {
        CreateTicketRequest request = new CreateTicketRequest(
                testUserId,
                testAssigneeId,
                "New ticket title",
                "New ticket description",
                LocalDate.now().plusDays(1),
                "Lobby",
                MediaTypeEnum.AUDIO,
                null
        );
        when(ticketService.createTicket(any(CreateTicketRequest.class))).thenReturn(testTicket);
        mockMvc.perform(post("/tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketId", is(testTicket.getTicketId())))
                .andExpect(jsonPath("$.mediaId", is(nullValue())))
                .andExpect(jsonPath("$.createdBy", is(testUserId)))
                .andExpect(jsonPath("$.assignedTo", is(testAssigneeId)));
    }

    @Test
    public void testUpdateTicketStatus() throws Exception {
        TicketEntity updatedTicket = new TicketEntity();
        updatedTicket.setTicketId(testTicket.getTicketId());
        updatedTicket.setCreatedBy(testUserId);
        updatedTicket.setAssignedTo(testAssigneeId);
        updatedTicket.setTitle(testTicket.getTitle());
        updatedTicket.setDescription(testTicket.getDescription());
        updatedTicket.setStatus(Status.FINISHED);
        updatedTicket.setDueDate(testTicket.getDueDate());
        updatedTicket.setLocation(testTicket.getLocation());
        updatedTicket.setMediaType(testTicket.getMediaType());
        when(ticketService.updateTicketStatus(testTicket.getTicketId(), Status.FINISHED)).thenReturn(Optional.of(updatedTicket));
        mockMvc.perform(put("/tickets/{ticketId}/status", testTicket.getTicketId())
                .param("status", Status.FINISHED.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is(Status.FINISHED.toString())))
                .andExpect(jsonPath("$.createdBy", is(testUserId)))
                .andExpect(jsonPath("$.assignedTo", is(testAssigneeId)));
    }

    @Test
    public void testGetAllTickets_withFilters() throws Exception {
        when(ticketService.getFilteredTickets(any(), any(), any(), any(), any(), any())).thenReturn(List.of(testTicket));
        mockMvc.perform(get("/tickets")
                .param("assignedTo", String.valueOf(testAssigneeId))
                .param("createdBy", String.valueOf(testUserId))
                .param("status", Status.IN_PROGRESS.toString())
                .param("dueDate", LocalDate.now().plusDays(2).toString())
                .param("location", "Hallway 1")
                .param("mediaType", MediaTypeEnum.AUDIO.toString())
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].ticketId", is(testTicket.getTicketId())))
                .andExpect(jsonPath("$[0].description", is(testTicket.getDescription())))
                .andExpect(jsonPath("$[0].createdBy", is(testUserId)))
                .andExpect(jsonPath("$[0].assignedTo", is(testAssigneeId)));
    }
}
