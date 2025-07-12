package de.tum.aet.devops25.team_spoved.auth_service;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


@RestController
@RequestMapping("/auth")
public class AuthController {
    private final UserRepository repo;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder encoder;

    private final Counter userLoginCounter;
    private final Counter userLoginErrorCounter;
    private final Timer userLoginTimer;

    private final Counter userRegisterCounter;
    private final Counter useRegisterErrorCounter;
    private final Timer userRegisterTimer;


    public AuthController(UserRepository repo, JwtUtil jwtUtil, PasswordEncoder encoder, MeterRegistry registry) {
        this.repo = repo;
        this.jwtUtil = jwtUtil;
        this.encoder = encoder;

        /* Login */

        this.userLoginCounter = Counter.builder("auth_service.login.requests.total")
                .description("Total number of user login requests")
                .register(registry);

        this.userLoginErrorCounter = Counter.builder("auth_service.login.errors.total")
                .description("Total number of user login errors")
                .register(registry);

        this.userLoginTimer = Timer.builder("auth_service.login.requests.duration")
                .description("Time taken to login user")
                .register(registry);

        /* Registration */

        this.userRegisterCounter = Counter.builder("auth_service.registration.requests.total")
                .description("Total number of user registration requests")
                .register(registry);

        this.useRegisterErrorCounter = Counter.builder("auth_service.registration.errors.total")
                .description("Total number of user registration errors")
                .register(registry);

        this.userRegisterTimer = Timer.builder("auth_service.login.registration.duration")
                .description("Time taken to registration user")
                .register(registry);


    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        return userRegisterTimer.record(() -> {
            try {
                if (!repo.findByName(request.name()).isEmpty()) {
                    return ResponseEntity.badRequest().body("User already exists");    
                }
                UserEntity user = new UserEntity();
                user.setName(request.name());
                user.setPasswordHash(encoder.encode(request.password()));
                user.setRole(request.role());
                repo.save(user);
                userRegisterCounter.increment();
                return ResponseEntity.ok("User registered");
            } catch (Exception e) {
                useRegisterErrorCounter.increment();
                throw e;
            }
        });
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return userLoginTimer.record(() -> {
            try {
                UserEntity user = repo.findByName(request.name())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
                if (!encoder.matches(request.password(), user.getPasswordHash())) {
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
                }
                String token = jwtUtil.generateToken(user.getUserId(), user.getName(), user.getRole().name());
                userLoginCounter.increment();
                return ResponseEntity.ok(Map.of("token", token));
            } catch (Exception e) {
                userLoginErrorCounter.increment();
                throw e;
            }
        });
    }

}
