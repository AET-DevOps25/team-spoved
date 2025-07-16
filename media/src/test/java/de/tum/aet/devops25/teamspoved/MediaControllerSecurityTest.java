package de.tum.aet.devops25.teamspoved;

import de.tum.aet.devops25.teamspoved.controller.MediaController;
import de.tum.aet.devops25.teamspoved.model.*;
import de.tum.aet.devops25.teamspoved.service.MediaService;

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

@WebMvcTest(controllers = {MediaController.class})
@AutoConfigureMockMvc
public class MediaControllerSecurityTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MediaService mediaService;

    private MediaEntity testMedia;

    @BeforeEach
    public void setup() {
        testMedia = new MediaEntity();
        testMedia.setMediaId(1);
        testMedia.setMediaType(MediaTypeEnum.AUDIO);
        testMedia.setBlobType("audio/wav");
        testMedia.setContent("test".getBytes());
        testMedia.setAnalyzed(false);
        testMedia.setResult("No result available");
        testMedia.setReason("No reasoning available");
        
    }

    @Test
    void whenNoAuthHeader_thenUnauthorized() throws Exception {
        mockMvc.perform(get("/media"))
                .andExpect(status().isUnauthorized());
    }

}
