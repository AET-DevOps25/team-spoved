package de.tum.aet.devops25.teamspoved.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

import de.tum.aet.devops25.teamspoved.dto.CreateTicketRequest;
import de.tum.aet.devops25.teamspoved.dto.UpdateTicketRequest;
import de.tum.aet.devops25.teamspoved.model.Status;
import de.tum.aet.devops25.teamspoved.model.TicketEntity;
import de.tum.aet.devops25.teamspoved.repository.TicketRepository;

@Service
public class TicketService {
    private final TicketRepository ticketRepository;
    private final RestTemplate restTemplate;
    
    @Value("${services.user.url}")
    private String userServiceUrl;

    public TicketService(TicketRepository ticketRepository, RestTemplate restTemplate) {
        this.ticketRepository = ticketRepository;
        this.restTemplate = restTemplate;
    }

    @Transactional
    public TicketEntity createTicket(CreateTicketRequest request) {
        // Validate user exists
        if (!userExists(request.createdBy())) {
            System.out.println("User not found");
            throw new IllegalArgumentException("User not found");
        }
        
        
        TicketEntity ticket = new TicketEntity();
        ticket.setCreatedBy(request.createdBy());
        ticket.setAssignedTo(request.assignedTo());
        ticket.setTitle(request.title());
        ticket.setDescription(request.description());
        ticket.setStatus(Status.OPEN);
        ticket.setDueDate(request.dueDate());
        ticket.setLocation(request.location());
        ticket.setMediaType(request.mediaType());
        ticket.setMediaId(request.mediaId());
        return ticketRepository.save(ticket);
    }

    private boolean userExists(Integer userId) {
        try {
            // Just check if user exists without storing the full object
            restTemplate.getForObject(userServiceUrl + "/users/" + userId, Object.class);
            return true;
        } catch (Exception e) {
            return false;
        }
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
    public Optional<TicketEntity> updateTicket(Integer ticketId, UpdateTicketRequest request) {
        Optional<TicketEntity> ticketOpt = ticketRepository.findById(ticketId);
        ticketOpt.ifPresent(ticket -> {
            if (request.title() != null) ticket.setTitle(request.title());
            if (request.description() != null) ticket.setDescription(request.description());
            if (request.dueDate() != null) ticket.setDueDate(request.dueDate());
            if (request.location() != null) ticket.setLocation(request.location());
            if (request.mediaType() != null) ticket.setMediaType(request.mediaType());
            if (request.mediaId() != null) ticket.setMediaId(request.mediaId());
            ticketRepository.save(ticket);
        });
        return ticketOpt;
    }

    @Transactional
    public Optional<TicketEntity> assignTicket(Integer ticketId, Integer userId) {
        Optional<TicketEntity> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isPresent()) {
            if (!userExists(userId)) {
                throw new IllegalArgumentException("User with ID " + userId + " not found");
            }
            ticketOpt.get().setAssignedTo(userId);
            ticketRepository.save(ticketOpt.get());
        }
        return ticketOpt;
    }

    public List<TicketEntity> getFilteredTickets(Integer assignedTo, Integer createdBy, Status status, java.time.LocalDate dueDate, String location, String mediaType) {
        return ticketRepository.findFilteredTickets(assignedTo, createdBy, status, dueDate, location, mediaType);
    }

    public Optional<TicketEntity> getTicketById(Integer ticketId) {
        return ticketRepository.findById(ticketId);
    }
}
