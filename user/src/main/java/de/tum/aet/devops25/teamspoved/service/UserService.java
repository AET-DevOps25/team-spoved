package de.tum.aet.devops25.teamspoved.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import de.tum.aet.devops25.teamspoved.model.UserEntity;
import de.tum.aet.devops25.teamspoved.repository.UserRepository;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

@Service
public class UserService {
    private final UserRepository userRepository;

    // Metrics
    private final Counter userRequestCounter;
    private final Counter userFoundCounter;
    private final Counter userErrorCounter;
    private final Timer userRequestTimer;

    public UserService(UserRepository userRepository, MeterRegistry registry) {
        this.userRepository = userRepository;
        this.userRequestCounter = Counter.builder("user_service.users.requests.total")
                .description("Total number of user requests")
                .register(registry);
        this.userFoundCounter = Counter.builder("user_service.users.found")
                .description("Total number of users found")
                .register(registry);
        this.userErrorCounter = Counter.builder("user_service.users.errors.total")
                .description("Number of errors when fetching users")
                .register(registry);
        this.userRequestTimer = Timer.builder("user_service.users.requests.duration")
                .description("Time taken to fetch users")
                .register(registry);
    }

    public Optional<UserEntity> getUserById(Integer userId) {
        return userRequestTimer.record(() -> {
            try {
                userRequestCounter.increment();
                Optional<UserEntity> user = userRepository.findById(userId);
                user.ifPresent(u -> userFoundCounter.increment());
                return user;
            } catch (Exception e) {
                userErrorCounter.increment();
                throw e;
            }
        });
    }

    public List<UserEntity> getFilteredUsers(Integer id, String role, String name) {
        return userRequestTimer.record(() -> {
            try {
                userRequestCounter.increment();
                List<UserEntity> users = userRepository.findFilteredUsers(id, role, name);
                userFoundCounter.increment(users.size());
                return users;
            } catch (Exception e) {
                userErrorCounter.increment();
                throw e;
            }
        });
    }

}
