package de.tum.aet.devops25.team_spoved.auth_service;

public record LoginRequest (
    String name,
    String password
) {}