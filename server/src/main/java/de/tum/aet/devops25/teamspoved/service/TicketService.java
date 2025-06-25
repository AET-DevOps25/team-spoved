package de.tum.aet.devops25.teamspoved.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.tum.aet.devops25.teamspoved.dto.CreateTicketRequest;
import de.tum.aet.devops25.teamspoved.model.Role;
import de.tum.aet.devops25.teamspoved.model.Status;
import de.tum.aet.devops25.teamspoved.model.TicketEntity;
import de.tum.aet.devops25.teamspoved.model.UserEntity;
import de.tum.aet.devops25.teamspoved.repository.TicketRepository;
import de.tum.aet.devops25.teamspoved.repository.UserRepository;

@Service
public class TicketService {
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TicketEntity createTicket(CreateTicketRequest request) {
        UserEntity createdBy = userRepository.findById(request.createdBy()).orElseThrow(() -> new IllegalArgumentException("User not found"));
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
        ticket.setMediaId(request.mediaId());
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
        if (ticketOpt.isPresent()) {
            UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User with ID " + userId + " not found"));
            ticketOpt.get().setAssignedTo(user);
            ticketRepository.save(ticketOpt.get());
        }
        return ticketOpt;
    }

    public List<TicketEntity> getFilteredTickets(Integer assignedToId, Integer createdById, Status status, java.time.LocalDate dueDate, String location, String mediaType) {
        return ticketRepository.findFilteredTickets(assignedToId, createdById, status, dueDate, location, mediaType);
    }

    public Optional<TicketEntity> getTicketById(Integer ticketId) {
        return ticketRepository.findById(ticketId);
    }
}
