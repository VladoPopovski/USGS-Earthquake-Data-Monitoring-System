package com.example.earthquake_app.repository;

import com.example.earthquake_app.model.Earthquake;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

// JpaRepository is a Spring Data interface that gives you ready-made database operations.
public interface EarthquakeRepository extends JpaRepository<Earthquake, Long> {
    List<Earthquake> findByMagnitudeGreaterThan(Double magnitude);
    List<Earthquake> findByTimeAfter(Instant time);
}
