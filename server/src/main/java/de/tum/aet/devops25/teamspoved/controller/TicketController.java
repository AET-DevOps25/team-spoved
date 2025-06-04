/*
 * 
 */

package de.tum.aet.devops25.teamspoved.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
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

    @PutMapping("/tickets/{ticketId}/assign")
    public ResponseEntity<TicketEntity> assignTicket(
        @PathVariable Integer ticketId, 
        @RequestParam Integer userId) {
        return ticketService.assignTicket(ticketId, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

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

    @GetMapping("/users/filtered")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers(
            @RequestParam(required = false) String supervisor,
            @RequestParam(required = false) String name) {

        try {
            List<UserEntity> users = ticketService.getAllUsers();

            List<UserEntity> filteredUsers = users.stream()
                .filter(user -> supervisor == null || user.getSupervisor().name().equals(supervisor))
                .filter(user -> name == null || user.getName().toLowerCase().startsWith(name.toLowerCase()))
                .collect(Collectors.toList());

            List<Map<String, Object>> result = filteredUsers.stream()
                .map(user -> Map.of(
                    "userId", (Object)user.getUserId(),
                    "name", (Object)user.getName(),
                    "supervisor", (Object)user.getSupervisor().name()
                ))
                .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
