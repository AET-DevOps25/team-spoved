package de.tum.aet.devops25.teamspoved.service;

import java.util.List;
import java.util.Optional;
import java.io.IOException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import de.tum.aet.devops25.teamspoved.dto.CreateTicketRequest;
import de.tum.aet.devops25.teamspoved.model.MediaEntity;
import de.tum.aet.devops25.teamspoved.model.MediaTypeEnum;
import de.tum.aet.devops25.teamspoved.model.Role;
import de.tum.aet.devops25.teamspoved.model.Status;
import de.tum.aet.devops25.teamspoved.model.TicketEntity;
import de.tum.aet.devops25.teamspoved.model.UserEntity;
import de.tum.aet.devops25.teamspoved.repository.MediaRepository;
import de.tum.aet.devops25.teamspoved.repository.TicketRepository;
import de.tum.aet.devops25.teamspoved.repository.UserRepository;

@Service
public class TicketService {
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final MediaRepository mediaRepository;

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository,
            MediaRepository mediaRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.mediaRepository = mediaRepository;
    }

    @Transactional
    public TicketEntity createTicket(CreateTicketRequest request) {
        UserEntity createdBy = userRepository.findById(request.createdBy())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        UserEntity assignedTo = null;
        if (request.assignedTo() != null) {
            assignedTo = userRepository.findById(request.assignedTo()).orElse(null);
        }
        TicketEntity ticket = new TicketEntity();
        ticket.setCreatedBy(createdBy);
        ticket.setAssignedTo(assignedTo);
        ticket.setTitle(request.title());
        ticket.setDescription(request.description());
        ticket.setStatus(Status.OPEN);
        ticket.setDueDate(request.dueDate());
        ticket.setLocation(request.location());
        ticket.setMediaType(request.mediaType());
        return ticketRepository.save(ticket);
    }

    @Transactional
    public Optional<TicketEntity> updateTicketStatus(Integer ticketId, Status newStatus) {
        Optional<TicketEntity> ticketOpt = ticketRepository.findById(ticketId);
        ticketOpt.ifPresent(ticket -> {
            ticket.setStatus(newStatus);
            ticketRepository.save(ticket);
        });
        return ticketOpt;
    }

    @Transactional
    public Optional<TicketEntity> assignTicket(Integer ticketId, Integer userId) {
        Optional<TicketEntity> ticketOpt = ticketRepository.findById(ticketId);
        ticketOpt.ifPresent(ticket -> {
            ticket.setAssignedTo(userRepository.findById(userId).orElse(null));
        });
        return ticketOpt;
    }

    public Optional<UserEntity> getUserById(Integer userId) {
        return userRepository.findById(userId);
    }

    public List<UserEntity> getFilteredUsers(Integer id, String role, String name) {
        return userRepository.findFilteredUsers(id, role, name);
    }

    public List<TicketEntity> getFilteredTickets(Integer assignedToId, Integer createdById, Status status,
            java.time.LocalDate dueDate, String location, String mediaType) {
        return ticketRepository.findFilteredTickets(assignedToId, createdById, status, dueDate, location, mediaType);
    }

    public Optional<TicketEntity> getTicketById(Integer ticketId) {
        return ticketRepository.findById(ticketId);
    }

    // Methods to interact with Media inside of the DB

    public Optional<MediaEntity> getMediaById(Integer mediaId) {
        return mediaRepository.findById(mediaId);
    }

    public List<MediaEntity> getAllMedia() {
        return mediaRepository.findAll();
    }

    public MediaEntity createMedia(MultipartFile media, MediaTypeEnum type) {
        MediaEntity mediaEntity = new MediaEntity();
        try {
            mediaEntity.setContent(media.getBytes());
            mediaEntity.setMediaType(type);
            return mediaRepository.save(mediaEntity);
        } catch (IOException e) {
            throw new RuntimeException("Failed to process media file", e);
        }
    }

    public MediaEntity updateAnalyzed(Integer mediaId, boolean analyzed) {
        Optional<MediaEntity> media = mediaRepository.findById(mediaId);

        if (!media.isPresent()) {
            return null;
        }

        MediaEntity extracted = media.get();
        extracted.setAnalyzed(analyzed);
        mediaRepository.save(extracted);

        return extracted;
    }

    public MediaEntity updateResult(Integer mediaId, String result) {
        Optional<MediaEntity> media = mediaRepository.findById(mediaId);

        if (!media.isPresent()) {
            return null;
        }

        MediaEntity extracted = media.get();
        extracted.setResult(result);
        mediaRepository.save(extracted);

        return extracted;
    }

    public MediaEntity updateReason(Integer mediaId, String reason) {
        Optional<MediaEntity> media = mediaRepository.findById(mediaId);

        if (!media.isPresent()) {
            return null;
        }

        MediaEntity extracted = media.get();
        extracted.setReason(reason);
        mediaRepository.save(extracted);

        return extracted;
    }
}
