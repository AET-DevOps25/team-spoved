package de.tum.aet.devops25.teamspoved.service;

import de.tum.aet.devops25.teamspoved.dto.CreateTicketRequest;
import de.tum.aet.devops25.teamspoved.model.Room;
import de.tum.aet.devops25.teamspoved.model.Ticket;
import de.tum.aet.devops25.teamspoved.model.User;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private final Clock clock;
    private final Map<String, Ticket> tickets = new ConcurrentHashMap<>();
    private final Map<String, User> users = new ConcurrentHashMap<>();
    private final Map<String, Room> rooms = new ConcurrentHashMap<>();

    public TicketService(Clock clock) {
        this.clock = clock;
        // Initialize with some sample data
        initSampleData();
    }

    private void initSampleData() {
        // Create sample rooms
        Room room1 = new Room("R001", "Terminal A", "Gate A1", "1");
        Room room2 = new Room("R002", "Terminal B", "Security Checkpoint", "G");
        Room room3 = new Room("R003", "Terminal C", "Restroom", "2");
        
        rooms.put(room1.id(), room1);
        rooms.put(room2.id(), room2);
        rooms.put(room3.id(), room3);
        
        // Create sample users
        LocalDateTime now = LocalDateTime.now(clock);
        User user1 = new User("U001", "John Smith", User.Role.TECHNICIAN, now, now);
        User user2 = new User("U002", "Jane Doe", User.Role.SUPERVISOR, now, now);
        User user3 = new User("U003", "Admin User", User.Role.ADMIN, now, now);
        
        users.put(user1.id(), user1);
        users.put(user2.id(), user2);
        users.put(user3.id(), user3);
        
        // Create sample tickets
        Ticket ticket1 = new Ticket(
                "T001",
                user1.id(),
                now.minusDays(2),
                null,
                null,
                user2.id(),
                room1,
                "Broken light fixture",
                Ticket.Priority.MEDIUM,
                Ticket.Status.OPEN
        );
        
        Ticket ticket2 = new Ticket(
                "T002",
                user1.id(),
                now.minusDays(5),
                now.minusDays(4),
                user1.id(),
                user2.id(),
                room2,
                "Malfunctioning security scanner",
                Ticket.Priority.HIGH,
                Ticket.Status.SOLVED
        );
        
        tickets.put(ticket1.ticketId(), ticket1);
        tickets.put(ticket2.ticketId(), ticket2);
    }

    public List<Ticket> getAllTickets() {
        return new ArrayList<>(tickets.values());
    }

    public Optional<Ticket> getTicketById(String ticketId) {
        return Optional.ofNullable(tickets.get(ticketId));
    }

    public List<Ticket> getTicketsByStatus(Ticket.Status status) {
        return tickets.values().stream()
                .filter(ticket -> ticket.status() == status)
                .collect(Collectors.toList());
    }

    public List<Ticket> getTicketsByUser(String userId) {
        return tickets.values().stream()
                .filter(ticket -> ticket.createdBy().equals(userId) || 
                                 (ticket.solvedBy() != null && ticket.solvedBy().equals(userId)) || 
                                 ticket.supervisor().equals(userId))
                .collect(Collectors.toList());
    }

    public Ticket createTicket(CreateTicketRequest request) {
        // Validate if user exists
        if (!users.containsKey(request.createdBy())) {
            throw new IllegalArgumentException("User not found");
        }
        
        // Validate if room exists
        Room room = rooms.get(request.roomId());
        if (room == null) {
            throw new IllegalArgumentException("Room not found");
        }
        
        // Generate ticket ID
        String ticketId = "T" + String.format("%03d", tickets.size() + 1);
        LocalDateTime now = LocalDateTime.now(clock);
        
        // Find a supervisor (simple assignment - in real system would be more complex)
        String supervisorId = users.values().stream()
                .filter(user -> user.role() == User.Role.SUPERVISOR)
                .findFirst()
                .map(User::id)
                .orElse(null);
        
        Ticket newTicket = new Ticket(
                ticketId,
                request.createdBy(),
                now,
                null,
                null,
                supervisorId,
                room,
                request.description(),
                request.priority(),
                Ticket.Status.OPEN
        );
        
        tickets.put(ticketId, newTicket);
        return newTicket;
    }

    public Optional<Ticket> updateTicketStatus(String ticketId, Ticket.Status newStatus, String userId) {
        Ticket existingTicket = tickets.get(ticketId);
        if (existingTicket == null) {
            return Optional.empty();
        }
        
        LocalDateTime now = LocalDateTime.now(clock);
        Ticket updatedTicket;
        
        if (newStatus == Ticket.Status.SOLVED) {
            updatedTicket = new Ticket(
                    existingTicket.ticketId(),
                    existingTicket.createdBy(),
                    existingTicket.createdAt(),
                    now,
                    userId,
                    existingTicket.supervisor(),
                    existingTicket.room(),
                    existingTicket.description(),
                    existingTicket.priority(),
                    newStatus
            );
        } else {
            updatedTicket = new Ticket(
                    existingTicket.ticketId(),
                    existingTicket.createdBy(),
                    existingTicket.createdAt(),
                    existingTicket.solvedAt(),
                    existingTicket.solvedBy(),
                    existingTicket.supervisor(),
                    existingTicket.room(),
                    existingTicket.description(),
                    existingTicket.priority(),
                    newStatus
            );
        }
        
        tickets.put(ticketId, updatedTicket);
        return Optional.of(updatedTicket);
    }

    public List<Room> getAllRooms() {
        return new ArrayList<>(rooms.values());
    }

    public Optional<Room> getRoomById(String roomId) {
        return Optional.ofNullable(rooms.get(roomId));
    }

    public List<User> getAllUsers() {
        return new ArrayList<>(users.values());
    }

    public Optional<User> getUserById(String userId) {
        return Optional.ofNullable(users.get(userId));
    }
}
