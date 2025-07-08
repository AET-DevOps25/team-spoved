package de.tum.aet.devops25.teamspoved.dto;

import de.tum.aet.devops25.teamspoved.model.MediaTypeEnum;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonProperty;

public record CreateTicketRequest(
    @JsonProperty("createdBy") Integer createdBy,
    @JsonProperty("assignedTo") Integer assignedTo,
    @JsonProperty("title") String title,
    @JsonProperty("description") String description,
    @JsonProperty("dueDate") LocalDate dueDate,
    @JsonProperty("location") String location,
    @JsonProperty("mediaType") MediaTypeEnum mediaType,
    @JsonProperty("mediaId") Integer mediaId 
) {}