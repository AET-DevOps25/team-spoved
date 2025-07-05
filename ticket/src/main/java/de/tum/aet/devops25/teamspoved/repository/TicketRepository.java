package de.tum.aet.devops25.teamspoved.repository;

import de.tum.aet.devops25.teamspoved.model.Status;
import de.tum.aet.devops25.teamspoved.model.TicketEntity;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketRepository extends JpaRepository<TicketEntity, Integer> {
    @Query("SELECT t FROM TicketEntity t WHERE " +
            "(:assignedTo IS NULL OR t.assignedTo = :assignedTo) AND " +
            "(:createdBy IS NULL OR t.createdBy = :createdBy) AND " +
            "(:status IS NULL OR t.status = :status) AND " +
            "(:dueDate IS NULL OR t.dueDate = :dueDate) AND " +
            "(:location IS NULL OR t.location = :location) AND " +
            "(:mediaType IS NULL OR t.mediaType = :mediaType)")
    List<TicketEntity> findFilteredTickets(
            @Param("assignedTo") Integer assignedTo,
            @Param("createdBy") Integer createdBy,
            @Param("status") Status status,
            @Param("dueDate") LocalDate dueDate,
            @Param("location") String location,
            @Param("mediaType") String mediaType
    );
}
