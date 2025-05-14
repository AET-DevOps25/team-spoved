package de.tum.aet.devops25.teamspoved.dto;

import de.tum.aet.devops25.teamspoved.model.Ticket;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTicketRequest(
    @NotBlank(message = "User ID is required")
    String createdBy,
    
    @NotBlank(message = "Room ID is required")
    String roomId,
    
    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 500, message = "Description must be between 10 and 500 characters")
    String description,
    
    @NotNull(message = "Priority is required")
    Ticket.Priority priority
) {
}
