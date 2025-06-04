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
                        (ticket.getAssignedTo() != null && ticket.getAssignedTo().getUserId().equals(userId)))
                .toList();
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

    public List<UserEntity> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<UserEntity> getUserById(Integer userId) {
        return userRepository.findById(userId);
    }

    // Filter users by role and name
    public List<UserEntity> getFilteredUsers(String roleStr, String name) {
        Role role = null;
        if (roleStr != null) {
            try {
                role = Role.valueOf(roleStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid role type: " + roleStr);
            }
        }
        
        // Convert name to lowercase for case-insensitive search
        String searchName = name != null ? name.toLowerCase() : null;
        
        // Pass the role string directly to the repository
        return userRepository.findFilteredUsers(roleStr, searchName);
    }
}
