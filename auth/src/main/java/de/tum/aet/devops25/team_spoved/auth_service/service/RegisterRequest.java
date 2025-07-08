package de.tum.aet.devops25.team_spoved.auth_service;

public record RegisterRequest (
    String name,
    String password,
    Role role
) {}