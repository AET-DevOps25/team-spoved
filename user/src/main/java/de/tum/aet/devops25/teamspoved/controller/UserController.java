package de.tum.aet.devops25.teamspoved.controller;

import de.tum.aet.devops25.teamspoved.model.Role;
import de.tum.aet.devops25.teamspoved.model.UserEntity;
import de.tum.aet.devops25.teamspoved.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000", "http://localhost:8090", "http://localhost:8082", "http://localhost:8083", "http://localhost:8081"})
@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService ticketService) {
        this.userService = ticketService;
    }

    @GetMapping
    public ResponseEntity<List<UserEntity>> getUsers(
            @RequestParam(required = false) Integer id,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String name) {
        List<UserEntity> users = userService.getFilteredUsers(id, role != null ? role.name() : null, name);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserEntity> getUserById(@PathVariable Integer userId) {
        return userService.getUserById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}