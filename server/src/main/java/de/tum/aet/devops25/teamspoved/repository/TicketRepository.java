package de.tum.aet.devops25.teamspoved.repository;

import de.tum.aet.devops25.teamspoved.model.TicketEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<TicketEntity, Integer> {
}
