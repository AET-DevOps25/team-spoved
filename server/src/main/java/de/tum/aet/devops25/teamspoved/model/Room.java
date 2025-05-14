package de.tum.aet.devops25.teamspoved.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record Room(
    String id,
    String section,
    String name,
    String floor
) {
}
