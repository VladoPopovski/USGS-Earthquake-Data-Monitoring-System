package com.example.earthquake_app.controller;

import com.example.earthquake_app.model.Earthquake;
import com.example.earthquake_app.service.EarthquakeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController // handles HTTP requests
@RequestMapping("/api/earthquakes") // all APIs start with /api/earthquakes
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // allows React (port 3000) to call this

public class EarthquakeController {

    private final EarthquakeService service;

    // POST /api/earthquakes/fetch -> triggers fetching from USGS
    @PostMapping("/fetch")
    public ResponseEntity<List<Earthquake>> fetchAndStore() {
        return ResponseEntity.ok(service.fetchAndStore());
    }

    // GET /api/earthquakes -> returns all stored earthquakes
    @GetMapping
    public ResponseEntity<List<Earthquake>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // GET /api/earthquakes/after?time=2024-01-01T00:00:00Z
    @GetMapping("/after")
    public ResponseEntity<List<Earthquake>> getAfterTime(@RequestParam String time) {
        return ResponseEntity.ok(service.getAfterTime(Instant.parse(time)));
    }

    // DELETE /api/earthquakes/5 → deletes earthquake with id=5
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
