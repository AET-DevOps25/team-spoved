package de.tum.aet.devops25.teamspoved.dto;

import de.tum.aet.devops25.teamspoved.model.MediaTypeEnum;
import java.time.LocalDate;

public record UpdateTicketRequest(
    String title,
    String description,
    LocalDate dueDate,
    String location,
    MediaTypeEnum mediaType,
    Integer mediaId
) {}