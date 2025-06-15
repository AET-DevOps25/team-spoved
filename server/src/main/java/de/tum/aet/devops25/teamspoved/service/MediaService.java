package de.tum.aet.devops25.teamspoved.service;

import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Arrays;

import de.tum.aet.devops25.teamspoved.model.MediaEntity;
import de.tum.aet.devops25.teamspoved.repository.MediaRepository;
import de.tum.aet.devops25.teamspoved.model.MediaTypeEnum;

@Service
public class MediaService {
    private final MediaRepository mediaRepository;

    public MediaService(MediaRepository mediaRepository) {
        this.mediaRepository = mediaRepository;
    }

    @Transactional
    public MediaEntity createMedia(MultipartFile file, MediaTypeEnum mediaType, String blobType) {
        try {
            MediaEntity media = new MediaEntity();

            media.setMediaType(mediaType);
            media.setContent(file.getBytes());
            media.setBlobType(blobType);
            return mediaRepository.save(media);
        } catch (IOException e) {
            throw new RuntimeException("Failed to process file", e);
        }
    }

    public MediaEntity getMediaById(Integer mediaId) {
        return mediaRepository.findById(mediaId).orElseThrow(() -> new IllegalArgumentException("Media not found"));
    }

    public List<MediaEntity> getAllMedia() {
        return mediaRepository.findAll();
    }
}