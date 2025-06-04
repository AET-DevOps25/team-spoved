package de.tum.aet.devops25.teamspoved.repository;

import de.tum.aet.devops25.teamspoved.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import de.tum.aet.devops25.teamspoved.model.Role;
import java.util.List;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    @Query(value = "SELECT * FROM db.users u " +
        "WHERE (:supervisor IS NULL OR u.supervisor = :supervisor::db.role) " +
        "AND (:name IS NULL OR LOWER(u.name) LIKE LOWER(:name || '%'))", 
        nativeQuery = true)
    List<UserEntity> findFilteredUsers(
        @Param("supervisor") String supervisor,
        @Param("name") String name
    );
}
