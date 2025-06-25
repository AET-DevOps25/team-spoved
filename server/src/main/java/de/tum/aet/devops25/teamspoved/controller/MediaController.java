package de.tum.aet.devops25.teamspoved.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import de.tum.aet.devops25.teamspoved.service.MediaService;
import de.tum.aet.devops25.teamspoved.model.MediaEntity;
import de.tum.aet.devops25.teamspoved.model.MediaTypeEnum;

import java.util.List;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:8000"})
@RestController
@RequestMapping("/api/v1/media")
public class MediaController {
    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaEntity> createMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam("mediaType") MediaTypeEnum mediaType,
            @RequestParam("blobType") String blobType) {
        try {
            MediaEntity media = mediaService.createMedia(file, mediaType, blobType);
            return ResponseEntity.ok(media);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to create media: " + e.getMessage());
        }
    }

    /*@GetMapping("/{mediaId}/wrong")
    public ResponseEntity<byte[]> getMediaById(@PathVariable Integer mediaId) {
        try {
            MediaEntity media = mediaService.getMediaById(mediaId);
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(media.getBlobType()))
                .body(media.getContent());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Media not found");
        }
    }*/

    @GetMapping("/{mediaId}")
    public ResponseEntity<MediaEntity> getMediaById(@PathVariable Integer mediaId) {
        try {
            MediaEntity media = mediaService.getMediaById(mediaId);
            return ResponseEntity.ok(media);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Media not found");
        }
    }


    @GetMapping
    public ResponseEntity<List<MediaEntity>> getAllMedia() {
        try {
            List<MediaEntity> media = mediaService.getAllMedia();
            return ResponseEntity.ok(media);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch media");
        }
    }

    @PutMapping("/{mediaId}/analyzed")
    public ResponseEntity<MediaEntity> updateAnalyzed(@PathVariable Integer mediaId, @RequestBody Boolean analyzed) {
        MediaEntity mediaEntity = mediaService.updateAnalyzed(mediaId, analyzed);

        if (mediaEntity == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(mediaEntity);
    }

    @PutMapping("/{mediaId}/result")
    public ResponseEntity<MediaEntity> updateResult(@PathVariable Integer mediaId, @RequestBody String result) {
        MediaEntity mediaEntity = mediaService.updateResult(mediaId, result);

        if (mediaEntity == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(mediaEntity);
    }

    @PutMapping("/{mediaId}/reason")
    public ResponseEntity<MediaEntity> updateReason(@PathVariable Integer mediaId, @RequestBody String reason) {
        MediaEntity mediaEntity = mediaService.updateReason(mediaId, reason);

        if (mediaEntity == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(mediaEntity);
    }
}