package de.tum.aet.devops25.teamspoved;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.aet.devops25.teamspoved.controller.MediaController;
import de.tum.aet.devops25.teamspoved.model.*;
import de.tum.aet.devops25.teamspoved.service.MediaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.doThrow;

@WebMvcTest(controllers = {MediaController.class})
@AutoConfigureMockMvc(addFilters = false)
public class MediaControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    public void testCreateMedia() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.wav", MediaType.APPLICATION_OCTET_STREAM_VALUE, "test".getBytes());

        when(mediaService.createMedia(any(MultipartFile.class), any(MediaTypeEnum.class), any(String.class))).thenReturn(testMedia);
        
        mockMvc.perform(multipart("/media")
                .file(file)
                .param("mediaType", MediaTypeEnum.AUDIO.toString())
                .param("blobType", "audio/wav"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mediaId", is(testMedia.getMediaId())))
                .andExpect(jsonPath("$.mediaType", is(testMedia.getMediaType().toString())))
                .andExpect(jsonPath("$.blobType", is(testMedia.getBlobType())))
                .andExpect(jsonPath("$.analyzed", is(testMedia.isAnalyzed())))
                .andExpect(jsonPath("$.result", is(testMedia.getResult())))
                .andExpect(jsonPath("$.reason", is(testMedia.getReason())));    
    }

    @Test
    public void testGetMediaById() throws Exception {
        when(mediaService.getMediaById(testMedia.getMediaId())).thenReturn(testMedia);
        mockMvc.perform(get("/media/{mediaId}", testMedia.getMediaId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mediaId", is(testMedia.getMediaId())))
                .andExpect(jsonPath("$.mediaType", is(testMedia.getMediaType().toString())))
                .andExpect(jsonPath("$.blobType", is(testMedia.getBlobType())));
    }

    @Test
    public void testGetMediaById_NotFound() throws Exception {
        when(mediaService.getMediaById(99999)).thenThrow(new IllegalArgumentException("Media not found"));
        
        mockMvc.perform(get("/media/{mediaId}", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testGetAllMedia() throws Exception {
        when(mediaService.getAllMedia()).thenReturn(List.of(testMedia));
        mockMvc.perform(get("/media"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].mediaId", is(testMedia.getMediaId())));
    }

    @Test
    public void testUpdateAnalyzed() throws Exception {
        testMedia.setAnalyzed(true);
        
        when(mediaService.updateAnalyzed(testMedia.getMediaId(), true)).thenReturn(testMedia);
        
        mockMvc.perform(put("/media/{mediaId}/analyzed", testMedia.getMediaId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.analyzed", is(true)));
    }

    @Test
    public void testUpdateResult() throws Exception {
        testMedia.setResult("test result");
        
        when(mediaService.updateResult(testMedia.getMediaId(), "test result")).thenReturn(testMedia);
        
        mockMvc.perform(put("/media/{mediaId}/result", testMedia.getMediaId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("test result"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result", is("test result")));
    }

    @Test
    public void testUpdateReason() throws Exception {
        testMedia.setReason("test reason");
        
        when(mediaService.updateReason(testMedia.getMediaId(), "test reason")).thenReturn(testMedia);
        
        mockMvc.perform(put("/media/{mediaId}/reason", testMedia.getMediaId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("test reason"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reason", is("test reason")));
    }

    @Test
    public void testCreateMedia_WithVideo() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.webm", "video/webm", "test video content".getBytes());
        
        MediaEntity videoMedia = new MediaEntity();
        videoMedia.setMediaId(2);
        videoMedia.setMediaType(MediaTypeEnum.VIDEO);
        videoMedia.setBlobType("video/webm");
        videoMedia.setContent("test video content".getBytes());
        videoMedia.setAnalyzed(false);

        when(mediaService.createMedia(any(MultipartFile.class), any(MediaTypeEnum.class), any(String.class))).thenReturn(videoMedia);
        
        mockMvc.perform(multipart("/media")
                .file(file)
                .param("mediaType", MediaTypeEnum.VIDEO.toString())
                .param("blobType", "video/webm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mediaId", is(videoMedia.getMediaId())))
                .andExpect(jsonPath("$.mediaType", is(MediaTypeEnum.VIDEO.toString())))
                .andExpect(jsonPath("$.blobType", is("video/webm")));
    }

    @Test
    public void testCreateMedia_WithPhoto() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", "test image content".getBytes());
        
        MediaEntity photoMedia = new MediaEntity();
        photoMedia.setMediaId(3);
        photoMedia.setMediaType(MediaTypeEnum.PHOTO);
        photoMedia.setBlobType("image/png");
        photoMedia.setContent("test image content".getBytes());
        photoMedia.setAnalyzed(false);

        when(mediaService.createMedia(any(MultipartFile.class), any(MediaTypeEnum.class), any(String.class))).thenReturn(photoMedia);
        
        mockMvc.perform(multipart("/media")
                .file(file)
                .param("mediaType", MediaTypeEnum.PHOTO.toString())
                .param("blobType", "image/png"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mediaId", is(photoMedia.getMediaId())))
                .andExpect(jsonPath("$.mediaType", is(MediaTypeEnum.PHOTO.toString())))
                .andExpect(jsonPath("$.blobType", is("image/png")));
    }

    @Test
    public void testCreateMedia_ServiceThrowsException() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.mp3", MediaType.APPLICATION_OCTET_STREAM_VALUE, "test".getBytes());

        when(mediaService.createMedia(any(MultipartFile.class), any(MediaTypeEnum.class), any(String.class)))
                .thenThrow(new RuntimeException("Service error"));
        
        mockMvc.perform(multipart("/media")
                .file(file)
                .param("mediaType", MediaTypeEnum.AUDIO.toString())
                .param("blobType", "webm"))
                .andExpect(status().isBadRequest());
    }

}
