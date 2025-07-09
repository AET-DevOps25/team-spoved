package de.tum.aet.devops25.teamspoved.repository;

import de.tum.aet.devops25.teamspoved.model.UserEntity;
import de.tum.aet.devops25.teamspoved.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    @Query(value = "SELECT * FROM db.users u WHERE " +
        "(:id IS NULL OR u.user_id = :id) AND " +
        "(:role IS NULL OR u.role = CAST(:role AS db.role)) AND " +
        "(:name IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT(:name, '%')))" ,
        nativeQuery = true
    )
    List<UserEntity> findFilteredUsers(
        @Param("id") Integer id,
        @Param("role") String role,
        @Param("name") String name
    );
}
