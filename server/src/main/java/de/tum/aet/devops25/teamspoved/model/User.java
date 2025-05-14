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
public record User(
    String id,
    String name,
    Role role,
    LocalDateTime createdAt,
    LocalDateTime lastModified
) {
    public enum Role {
        TECHNICIAN,
        SUPERVISOR,
        ADMIN
    }
}
