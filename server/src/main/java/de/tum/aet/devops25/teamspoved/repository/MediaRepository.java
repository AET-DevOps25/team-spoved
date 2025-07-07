package de.tum.aet.devops25.teamspoved.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import de.tum.aet.devops25.teamspoved.model.MediaEntity;

@Repository
public interface MediaRepository extends JpaRepository<MediaEntity, Integer> {
    
}