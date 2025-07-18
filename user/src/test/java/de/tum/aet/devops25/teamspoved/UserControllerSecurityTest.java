package de.tum.aet.devops25.teamspoved;

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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {UserController.class})
@AutoConfigureMockMvc
public class UserControllerSecurityTest {
    @Autowired
    private MockMvc mockMvc;

    private UserEntity testUser;
    private UserEntity testAssignee;

    @MockBean
    private UserService userService;

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
    void whenNoAuthHeader_thenUnauthorized() throws Exception {
        mockMvc.perform(get("/users"))
                .andExpect(status().isUnauthorized());
    }

}
