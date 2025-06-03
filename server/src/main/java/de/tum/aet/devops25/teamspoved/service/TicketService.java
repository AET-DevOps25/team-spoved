package de.tum.aet.devops25.teamspoved.service;

import de.tum.aet.devops25.teamspoved.dto.CreateTicketRequest;
import de.tum.aet.devops25.teamspoved.model.*;
import de.tum.aet.devops25.teamspoved.repository.TicketRepository;
import de.tum.aet.devops25.teamspoved.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TicketService {
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    public List<TicketEntity> getAllTickets() {
        return ticketRepository.findAll();
    }

    public Optional<TicketEntity> getTicketById(Integer ticketId) {
        return ticketRepository.findById(ticketId);
    }

    public List<TicketEntity> getTicketsByStatus(Status status) {
        return ticketRepository.findAll().stream()
                .filter(ticket -> ticket.getStatus() == status)
                .toList();
    }

    public List<TicketEntity> getTicketsByUser(Integer userId) {
        return ticketRepository.findAll().stream()
                .filter(ticket -> ticket.getCreatedBy().getUserId().equals(userId) ||
                        ticket.getAssignedTo().getUserId().equals(userId))
                .toList();
    }

    @Transactional
    public TicketEntity createTicket(CreateTicketRequest request) {
        UserEntity createdBy = userRepository.findById(request.createdBy()).orElseThrow(() -> new IllegalArgumentException("User not found"));
        UserEntity assignedTo = userRepository.findById(request.assignedTo()).orElseThrow(() -> new IllegalArgumentException("Assigned user not found"));
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

    public List<UserEntity> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<UserEntity> getUserById(Integer userId) {
        return userRepository.findById(userId);
    }
}
