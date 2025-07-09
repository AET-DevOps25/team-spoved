package de.tum.aet.devops25.teamspoved.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "tickets", schema = "db")
public class TicketEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Integer ticketId;

    @Column(name = "assigned_to", nullable = true)
    private Integer assignedTo;

    @Column(name = "created_by", nullable = false)
    private Integer createdBy;

    @Column(nullable = false, length = 999)
    private String title = "New Ticket";

    @Column(nullable = false, length = 999)
    private String description = "Description of the ticket";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "db.status")
    private Status status = Status.OPEN;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false, length = 999)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, columnDefinition = "db.media_type")
    private MediaTypeEnum mediaType;

    @Column(name="media_id", nullable = true)
    private Integer mediaId;

    // Getters and setters
    public Integer getTicketId() { return ticketId; }
    public void setTicketId(Integer ticketId) { this.ticketId = ticketId; }
    public Integer getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Integer assignedTo) { this.assignedTo = assignedTo; }
    public Integer getCreatedBy() { return createdBy; }
    public void setCreatedBy(Integer createdBy) { this.createdBy = createdBy; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public MediaTypeEnum getMediaType() { return mediaType; }
    public void setMediaType(MediaTypeEnum mediaType) { this.mediaType = mediaType; }
    public Integer getMediaId() { return mediaId; }
    public void setMediaId(Integer mediaId) { this.mediaId = mediaId; }

    @Override
    public String toString() {
        return "TicketEntity{" +
                "ticketId=" + ticketId +
                ", assignedTo=" + assignedTo +
                ", createdBy=" + createdBy +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", status=" + status +
                ", dueDate=" + dueDate +
                ", location='" + location + '\'' +
                ", mediaType=" + mediaType +
                '}';
    }
}