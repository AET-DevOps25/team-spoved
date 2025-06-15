package de.tum.aet.devops25.teamspoved.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import de.tum.aet.devops25.teamspoved.model.MediaEntity;

public interface MediaRepository extends JpaRepository<MediaEntity, Integer>{
    
}