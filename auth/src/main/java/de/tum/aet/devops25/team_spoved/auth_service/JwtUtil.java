package de.tum.aet.devops25.team_spoved.auth_service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import org.springframework.stereotype.Component;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
 
@Component
public class JwtUtil {
    private final String SECRET = "supersecret123";

    public String generateToken(Integer userId, String name, String role) {
        return JWT.create()
            .withSubject(name)
            .withClaim("userId", userId)
            .withClaim("role", role)
            .withExpiresAt(Date.from(Instant.now().plus(1, ChronoUnit.DAYS)))
            .sign(Algorithm.HMAC256(SECRET));
    }

}
