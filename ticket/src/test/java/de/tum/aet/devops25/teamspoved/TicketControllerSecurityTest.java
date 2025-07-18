package de.tum.aet.devops25.teamspoved;

import de.tum.aet.devops25.teamspoved.controller.TicketController;
import de.tum.aet.devops25.teamspoved.model.*;
import de.tum.aet.devops25.teamspoved.service.TicketService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {TicketController.class})
@AutoConfigureMockMvc
public class TicketControllerSecurityTest {
    @Autowired
    private MockMvc mockMvc;

    private Integer testUserId;
    private Integer testAssigneeId;
    private TicketEntity testTicket;

    @MockBean
    private TicketService ticketService;

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
    void whenNoAuthHeader_thenUnauthorized() throws Exception {
        mockMvc.perform(get("/tickets"))
                .andExpect(status().isUnauthorized());
    }
}
