package de.tum.aet.devops25.teamspoved.repository;

import de.tum.aet.devops25.teamspoved.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
}
