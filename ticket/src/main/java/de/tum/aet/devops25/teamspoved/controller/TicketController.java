/*
 * 
 */

package de.tum.aet.devops25.teamspoved.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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
import de.tum.aet.devops25.teamspoved.dto.UpdateTicketRequest;
import de.tum.aet.devops25.teamspoved.model.Status;
import de.tum.aet.devops25.teamspoved.model.TicketEntity;
import de.tum.aet.devops25.teamspoved.service.TicketService;
import jakarta.validation.Valid;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:8000", "http://localhost:8082", "http://localhost:8083", "http://localhost:8081"})
@RestController
public class TicketController {
    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    // Ticket endpoints
    @GetMapping("/tickets")
    public ResponseEntity<List<TicketEntity>> getTickets(
            @RequestParam(required = false) Integer assignedTo,
            @RequestParam(required = false) Integer createdBy,
            @RequestParam(required = false) Status status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate dueDate,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String mediaType
    ) {
        List<TicketEntity> tickets = ticketService.getFilteredTickets(assignedTo, createdBy, status, dueDate, location, mediaType);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<TicketEntity> getTicketById(@PathVariable Integer ticketId) {
        return ticketService.getTicketById(ticketId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
        try {
            return ticketService.assignTicket(ticketId, userId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/tickets/{ticketId}/update")
    public ResponseEntity<TicketEntity> updateTicket(
            @PathVariable Integer ticketId,
            @Valid @RequestBody UpdateTicketRequest request) {
        return ticketService.updateTicket(ticketId, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
