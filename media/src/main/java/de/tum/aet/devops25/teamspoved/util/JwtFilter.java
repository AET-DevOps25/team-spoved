package de.tum.aet.devops25.teamspoved.util;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

 
@Component
public class JwtFilter extends OncePerRequestFilter {
    // FIXME This shouldn't be here, obviously
    private final String SECRET = "supersecret123";

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
        throws ServletException, IOException {

        String requestPath = req.getRequestURI();
        
        // Skip JWT processing for endpoints that are configured as permitAll
        if (requestPath.startsWith("/api/v1/") || requestPath.startsWith("/actuator/health")) {
            // For permitAll endpoints, only process JWT if present and valid, but don't fail if missing/invalid
            String header = req.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                try {
                    String token = header.substring(7);
                    DecodedJWT jwt = JWT.require(Algorithm.HMAC256(SECRET))
                        .build()
                        .verify(token);

                    String username = jwt.getSubject();
                    String role = jwt.getClaim("role").asString();
                    Long userId = jwt.getClaim("userId").asLong();

                    List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

                    Authentication auth = new UsernamePasswordAuthenticationToken(
                        username, null, authorities
                    );

                    SecurityContextHolder.getContext().setAuthentication(auth);
                } catch (JWTVerificationException ex) {
                    // For permitAll endpoints, don't fail on invalid JWT - just continue without authentication
                    // This allows both authenticated and unauthenticated access
                }
            }
            
            chain.doFilter(req, res);
            return;
        }

        // For other endpoints, require valid JWT
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                String token = header.substring(7);
                DecodedJWT jwt = JWT.require(Algorithm.HMAC256(SECRET))
                    .build()
                    .verify(token);

                String username = jwt.getSubject();
                String role = jwt.getClaim("role").asString();
                Long userId = jwt.getClaim("userId").asLong();

                List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

                Authentication auth = new UsernamePasswordAuthenticationToken(
                    username, null, authorities
                );

                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (JWTVerificationException ex) {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        }

        chain.doFilter(req, res);
    }

    public record AuthenticatedUser(Long userId, String username) {}
}