/*
 * 1. See https://dev.to/psideris89/java-14-records-in-spring-boot-rest-api-n29
 * for the 'record' type
 * 2. See https://stackoverflow.com/questions/4486787/jackson-with-json-unrecognized-field-not-marked-as-ignorable
 * for an explanation of why JsonIgnoreProperties is good
 */

package de.tum.aet.devops25.teamspoved.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public record Ticket(
    String ticketId,
    String createdBy,
    LocalDateTime createdAt,
    LocalDateTime solvedAt,
    String solvedBy,
    String supervisor,
    Room room,
    String description,
    Priority priority,
    Status status
) {
    public enum Status {
        OPEN,
        IN_PROGRESS,
        SOLVED,
        CLOSED
    }
    
    public enum Priority {
        LOW,
        MEDIUM,
        HIGH,
        URGENT
    }
}
