package de.tum.aet.devops25.teamspoved.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import de.tum.aet.devops25.teamspoved.dto.CreateTicketRequest;
import de.tum.aet.devops25.teamspoved.model.Status;
import de.tum.aet.devops25.teamspoved.model.TicketEntity;
import de.tum.aet.devops25.teamspoved.model.UserEntity;
import de.tum.aet.devops25.teamspoved.repository.TicketRepository;
import de.tum.aet.devops25.teamspoved.repository.UserRepository;

@Service
public class TicketService {
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    // Metrics
    // Read
    private final Counter ticketRequestCounter;
    private final Counter ticketFoundCounter;
    private final Counter ticketErrorCounter;
    private final Timer ticketRequestTimer;

    // Update
    private final Counter ticketAssignedCounter;
    private final Counter ticketAssignmentErrorCounter;
    private final Timer ticketAssignmentTimer;

    // Create
    private final Counter ticketsCreatedCounter;
    private final Counter ticketsCreatedError;
    private final Timer ticketsCreatedTimer;

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository, MeterRegistry registry) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;

        /* Ticket Reading */

    
        this.ticketRequestCounter = Counter.builder("ticket_service.tickets.requests.total")
                .description("Total number of ticket requests")
                .register(registry);

        this.ticketFoundCounter = Counter.builder("ticket_service.tickets.found")
                .description("Total number of ticket founds")
                .register(registry);

        this.ticketErrorCounter = Counter.builder("ticket_service.tickets.errors.total")
                .description("Number of errors when fetching tickets")
                .register(registry);

        this.ticketRequestTimer = Timer.builder("ticket_service.tickets.requests.duration")
                .description("Time taken to fetch tickets")
                .register(registry);

        /* Ticket Assignment */

        this.ticketAssignedCounter = Counter.builder("ticket_service.assignment.requests.total")
                .description("Total number of ticket assignment requests")
                .register(registry);

        this.ticketAssignmentErrorCounter = Counter.builder("ticket_service.assignment.errors.total")
                .description("Total number of ticket assignment errors")
                .register(registry);

        this.ticketAssignmentTimer = Timer.builder("ticket_service.assignment.requests.duration")
                .description("Time taken to assign tickets")
                .register(registry);

        /* Ticket Creation */

        this.ticketsCreatedCounter = Counter.builder("ticket_service.creation.requests.total")
                .description("Total number of ticket creation requests")
                .register(registry);

        this.ticketsCreatedError = Counter.builder("ticket_service.creation.errors.total")
                .description("Total number of ticket creation errors")
                .register(registry);

        this.ticketsCreatedTimer = Timer.builder("ticket_service.creation.requests.duration")
                .description("Time taken to create tickets")
                .register(registry);
                       
    }

    @Transactional
    public TicketEntity createTicket(CreateTicketRequest request) {
        return ticketsCreatedTimer.record(() -> {
            try {
                UserEntity createdBy = userRepository.findById(request.createdBy()).orElseThrow(() -> new IllegalArgumentException("User not found"));
                UserEntity assignedTo = null;
                if (request.assignedTo() != null) {
                    assignedTo = userRepository.findById(request.assignedTo()).orElse(null);
                }
                TicketEntity ticket = new TicketEntity();
                ticket.setCreatedBy(createdBy);
                ticket.setAssignedTo(assignedTo);
                ticket.setTitle(request.title());
                ticket.setDescription(request.description());
                ticket.setStatus(Status.OPEN);
                ticket.setDueDate(request.dueDate());
                ticket.setLocation(request.location());
                ticket.setMediaType(request.mediaType());
                TicketEntity saved = ticketRepository.save(ticket);
                ticketsCreatedCounter.increment();
                return saved;
            } catch (Exception e) {
                ticketsCreatedError.increment();
                throw e;
            }
        });
    }

    @Transactional
    public Optional<TicketEntity> updateTicketStatus(Integer ticketId, Status newStatus) {
        return ticketAssignmentTimer.record(() -> {
            Optional<TicketEntity> ticketOpt = ticketRepository.findById(ticketId);
            try {
                ticketOpt.ifPresent(ticket -> {
                    ticket.setStatus(newStatus);
                    ticketRepository.save(ticket);
                });
                if (ticketOpt.isPresent()) {
                    ticketAssignedCounter.increment();
                }
                return ticketOpt;
            } catch (Exception e) {
                ticketAssignmentErrorCounter.increment();
                throw e;
            }
        });
    }

    @Transactional
    public Optional<TicketEntity> assignTicket(Integer ticketId, Integer userId) {
        return ticketAssignmentTimer.record(() -> {
            Optional<TicketEntity> ticketOpt = ticketRepository.findById(ticketId);
            try {
                if (ticketOpt.isPresent()) {
                    UserEntity user = userRepository.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("User with ID " + userId + " not found"));
                    ticketOpt.get().setAssignedTo(user);
                    ticketRepository.save(ticketOpt.get());
                    ticketAssignedCounter.increment();
                }
                return ticketOpt;
            } catch (Exception e) {
                ticketAssignmentErrorCounter.increment();
                throw e;
            }
        });
    }

    public List<TicketEntity> getFilteredTickets(Integer assignedToId, Integer createdById, Status status, java.time.LocalDate dueDate, String location, String mediaType) {
        return ticketRequestTimer.record(() -> {
            try {
                ticketRequestCounter.increment();
                List<TicketEntity> tickets = ticketRepository.findFilteredTickets(assignedToId, createdById, status, dueDate, location, mediaType);
                ticketFoundCounter.increment(tickets.size());
                return tickets;
            } catch (Exception e) {
                ticketErrorCounter.increment();
                throw e;
            }
        });
    }

    public Optional<TicketEntity> getTicketById(Integer ticketId) {
        return ticketRequestTimer.record(() -> {
            try {
                ticketRequestCounter.increment();
                Optional<TicketEntity> ticket = ticketRepository.findById(ticketId);
                ticket.ifPresent(t -> ticketFoundCounter.increment());
                return ticket;
            } catch (Exception e) {
                ticketErrorCounter.increment();
                throw e;
            }
        });
    }
}
