package de.tum.aet.devops25.teamspoved.repository;

import de.tum.aet.devops25.teamspoved.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import de.tum.aet.devops25.teamspoved.model.Role;
import java.util.List;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    @Query("SELECT u FROM User u WHERE " +
        "(:id IS NULL OR u.userId = :id) AND " +
        "(:role IS NULL OR u.role = :role) AND " +
        "(:name IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT(:name, '%')))")
    List<UserEntity> findFilteredUsers(
        @Param("id") Integer id,
        @Param("role") Role role,
        @Param("name") String name
    );
}
