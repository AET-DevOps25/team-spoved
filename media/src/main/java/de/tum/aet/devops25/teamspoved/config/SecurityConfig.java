package de.tum.aet.devops25.teamspoved.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import de.tum.aet.devops25.teamspoved.util.JwtFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // FIXME Right now, everyone has the same level of authorization, change this to have 
        // RBAC for the API points 
        // FIXME No CSRF is unsafe
        http
            .csrf(csrf -> csrf.disable())  
            .cors(cors -> cors.configure(http))
            .authorizeHttpRequests(auth -> auth
                // Allow internal service access for GenAI automation
                .requestMatchers("/api/v1/tickets/**").permitAll()
                .requestMatchers("/api/v1/users/**").permitAll()
                .requestMatchers("/api/v1/media/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                // Require authentication for everything else
                .anyRequest().authenticated() 
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}