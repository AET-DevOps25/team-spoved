package de.tum.aet.devops25.teamspoved.service;

import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

import de.tum.aet.devops25.teamspoved.model.MediaEntity;
import de.tum.aet.devops25.teamspoved.repository.MediaRepository;
import de.tum.aet.devops25.teamspoved.model.MediaTypeEnum;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Counter;

@Service
public class MediaService {
    private final MediaRepository mediaRepository;
    private final Counter createMediaCounter;
    private final Counter getMediaByIdCounter;
    private final Counter getAllMediaCounter;
    private final Counter updateAnalyzedCounter;
    private final Counter updateResultCounter;
    private final Counter updateReasonCounter;
    private final Counter requestErrorCounter;

    public MediaService(MediaRepository mediaRepository, MeterRegistry meterRegistry) {
        this.mediaRepository = mediaRepository;
        this.createMediaCounter = meterRegistry.counter("media_create_requests_total");
        this.getMediaByIdCounter = meterRegistry.counter("media_get_by_id_requests_total");
        this.getAllMediaCounter = meterRegistry.counter("media_get_all_requests_total");
        this.updateAnalyzedCounter = meterRegistry.counter("media_update_analyzed_requests_total");
        this.updateResultCounter = meterRegistry.counter("media_update_result_requests_total");
        this.updateReasonCounter = meterRegistry.counter("media_update_reason_requests_total");
        this.requestErrorCounter = meterRegistry.counter("media_request_errors_total");
    }

    @Transactional
    public MediaEntity createMedia(MultipartFile file, MediaTypeEnum mediaType, String blobType) {
        createMediaCounter.increment();
        try {
            MediaEntity media = new MediaEntity();
            media.setMediaType(mediaType);
            media.setContent(file.getBytes());
            media.setBlobType(blobType);
            return mediaRepository.save(media);
        } catch (IOException e) {
            requestErrorCounter.increment();
            throw new RuntimeException("Failed to process file", e);
        }
    }

    public MediaEntity getMediaById(Integer mediaId) {
        getMediaByIdCounter.increment();
        return mediaRepository.findById(mediaId).orElseThrow(() -> {
            requestErrorCounter.increment();
            return new IllegalArgumentException("Media not found");
        });
    }

    public List<MediaEntity> getAllMedia() {
        getAllMediaCounter.increment();
        return mediaRepository.findAll();
    }

    public MediaEntity updateAnalyzed(Integer mediaId, boolean analyzed) {
        updateAnalyzedCounter.increment();
        MediaEntity media = mediaRepository.findById(mediaId).orElseThrow(() -> {
            requestErrorCounter.increment();
            return new IllegalArgumentException("Media not found");
        });
        media.setAnalyzed(analyzed);
        return mediaRepository.save(media);
    }

    public MediaEntity updateResult(Integer mediaId, String result) {
        updateResultCounter.increment();
        MediaEntity media = mediaRepository.findById(mediaId).orElseThrow(() -> {
            requestErrorCounter.increment();
            return new IllegalArgumentException("Media not found");
        });
        media.setResult(result);
        return mediaRepository.save(media);
    }

    public MediaEntity updateReason(Integer mediaId, String reason) {
        updateReasonCounter.increment();
        MediaEntity media = mediaRepository.findById(mediaId).orElseThrow(() -> {
            requestErrorCounter.increment();
            return new IllegalArgumentException("Media not found");
        });
        media.setReason(reason);
        return mediaRepository.save(media);
    }
    
    

}