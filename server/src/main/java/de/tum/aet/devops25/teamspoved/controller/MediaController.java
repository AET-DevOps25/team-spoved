package de.tum.aet.devops25.teamspoved.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import de.tum.aet.devops25.teamspoved.model.MediaEntity;
import de.tum.aet.devops25.teamspoved.model.MediaTypeEnum;
import de.tum.aet.devops25.teamspoved.service.TicketService;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RestController
@RequestMapping("/api/v1/media")
public class MediaController {
    private final TicketService ticketService;

    public MediaController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping("/media")
    public ResponseEntity<List<MediaEntity>> getMedias() {
        List<MediaEntity> medias = ticketService.getAllMedia();
        return ResponseEntity.ok(medias);
    }

    @GetMapping("/media/{mediaId}")
    public ResponseEntity<MediaEntity> getMediaById(@PathVariable Integer mediaId) {
        return ticketService.getMediaById(mediaId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/media")
    public ResponseEntity<MediaEntity> createMedia(@RequestBody MultipartFile media, @RequestBody MediaTypeEnum type) {
        MediaEntity mediaEntity = ticketService.createMedia(media, type);
        return ResponseEntity.ok(mediaEntity);
    }

    @PutMapping("/media/{mediaId}/analyzed")
    public ResponseEntity<MediaEntity> updateAnalyzed(@PathVariable Integer mediaId, @RequestBody Boolean analyzed) {
        MediaEntity mediaEntity = ticketService.updateAnalyzed(mediaId, analyzed);

        if (mediaEntity == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(mediaEntity);
    }

    @PutMapping("/media/{mediaId}/result")
    public ResponseEntity<MediaEntity> updateResult(@PathVariable Integer mediaId, @RequestBody String result) {
        MediaEntity mediaEntity = ticketService.updateResult(mediaId, result);

        if (mediaEntity == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(mediaEntity);
    }

    @PutMapping("/media/{mediaId}/reason")
    public ResponseEntity<MediaEntity> updateReason(@PathVariable Integer mediaId, @RequestBody String reason) {
        MediaEntity mediaEntity = ticketService.updateReason(mediaId, reason);

        if (mediaEntity == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(mediaEntity);
    }
}
