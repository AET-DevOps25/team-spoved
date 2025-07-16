package de.tum.aet.devops25.teamspoved;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.aet.devops25.teamspoved.controller.UserController;
import de.tum.aet.devops25.teamspoved.model.*;
import de.tum.aet.devops25.teamspoved.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {UserController.class})
@AutoConfigureMockMvc(addFilters = false)
public class UserControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    private UserEntity testUser;
    private UserEntity testAssignee;

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
    }

    @Test
    public void testGetUsers() throws Exception {
        when(userService.getFilteredUsers(any(), any(), any())).thenReturn(List.of(testUser));
        mockMvc.perform(get("/users"))
                .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].userId", is(testUser.getUserId())))
                    .andExpect(jsonPath("$[0].name", is(testUser.getName())))
                    .andExpect(jsonPath("$[0].role", is(testUser.getRole().name())));
    }

    @Test
    public void testGetUserById() throws Exception {
        when(userService.getUserById(testUser.getUserId())).thenReturn(Optional.of(testUser));
        mockMvc.perform(get("/users/{userId}", testUser.getUserId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId", is(testUser.getUserId())))
                .andExpect(jsonPath("$.name", is(testUser.getName())))
                .andExpect(jsonPath("$.role", is(testUser.getRole().name())));
    }

    @Test
    public void testGetUserById_NotFound() throws Exception {
        when(userService.getUserById(99999)).thenReturn(Optional.empty());
        mockMvc.perform(get("/users/{userId}", 99999))
                .andExpect(status().isNotFound());
    }
}
