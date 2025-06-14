package de.tum.aet.devops25.teamspoved;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.aet.devops25.teamspoved.controller.UserController;
import de.tum.aet.devops25.teamspoved.model.Role;
import de.tum.aet.devops25.teamspoved.model.UserEntity;
import de.tum.aet.devops25.teamspoved.service.TicketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = UserController.class)
@AutoConfigureMockMvc(addFilters = false)
public class UserControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TicketService ticketService;

    private UserEntity testUser;

    @BeforeEach
    public void setup() {
        testUser = new UserEntity();
        testUser.setUserId(1);
        testUser.setName("John Smith");
        testUser.setRole(Role.WORKER);
    }

    @Test
    public void testGetAllUsers() throws Exception {
        when(ticketService.getFilteredUsers(null,null,null)).thenReturn(List.of(testUser));
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

    @Test
    public void testGetAllUsers_withFilters() throws Exception {
        when(ticketService.getFilteredUsers(any(), any(), any())).thenReturn(List.of(testUser));
        mockMvc.perform(get("/api/v1/users")
                .param("id", String.valueOf(testUser.getUserId()))
                .param("role", testUser.getRole().toString())
                .param("name", testUser.getName())
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].userId", is(testUser.getUserId())))
                .andExpect(jsonPath("$[0].name", is(testUser.getName())));
    }
}
