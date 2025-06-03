/*
 * 
 */

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import de.tum.aet.devops25.teamspoved.dto.CreateTicketRequest;
import de.tum.aet.devops25.teamspoved.model.Status;
import de.tum.aet.devops25.teamspoved.model.TicketEntity;
import de.tum.aet.devops25.teamspoved.model.UserEntity;
import de.tum.aet.devops25.teamspoved.service.TicketService;
import jakarta.validation.Valid;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1")
public class TicketController {
    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    // Ticket endpoints
    @GetMapping("/tickets")
    public ResponseEntity<List<TicketEntity>> getAllTickets() {
        List<TicketEntity> tickets = ticketService.getAllTickets();
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<TicketEntity> getTicketById(@PathVariable Integer ticketId) {
        return ticketService.getTicketById(ticketId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tickets/status/{status}")
    public ResponseEntity<List<TicketEntity>> getTicketsByStatus(@PathVariable Status status) {
        List<TicketEntity> tickets = ticketService.getTicketsByStatus(status);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/tickets/user/{userId}")
    public ResponseEntity<List<TicketEntity>> getTicketsByUser(@PathVariable Integer userId) {
        List<TicketEntity> tickets = ticketService.getTicketsByUser(userId);
        return ResponseEntity.ok(tickets);
    }

    @PostMapping("/tickets")
    public ResponseEntity<TicketEntity> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        try {
            TicketEntity newTicket = ticketService.createTicket(request);
            return ResponseEntity.ok(newTicket);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/tickets/{ticketId}/status")
    public ResponseEntity<TicketEntity> updateTicketStatus(
            @PathVariable Integer ticketId,
            @RequestParam Status status) {
        return ticketService.updateTicketStatus(ticketId, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // User endpoints
    @GetMapping("/users")
    public ResponseEntity<List<UserEntity>> getAllUsers() {
        List<UserEntity> users = ticketService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserEntity> getUserById(@PathVariable Integer userId) {
        return ticketService.getUserById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
