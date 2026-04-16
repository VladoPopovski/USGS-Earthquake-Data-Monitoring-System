package com.example.earthquake_app.service;


import com.example.earthquake_app.model.Earthquake;
import com.example.earthquake_app.repository.EarthquakeRepository;
import lombok.RequiredArgsConstructor;
//import lombok.Value;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

//


@Service                       // notify spring that this is a service class so it can automatically manage it
@RequiredArgsConstructor       // Lombok automatically generates constructors for the final fields
@Slf4j                         // Lombok provides a log.info() / log.error() logger


public class EarthquakeService {
    private final EarthquakeRepository repository;
    private final RestTemplate restTemplate;            //used for HTTP calls
    private final ObjectMapper objectMapper;            //used to parse JSON

    @Value("${app.usgs.url}")           // reads value from application.properties
    private String usgsURL;

    @Value("${app.filter.min-magnitude}")
    private double minMagnitude;

    public List<Earthquake> fetchAndStore() {

        try {
            // Call the USGS API and get the JSON response as a String
            String json = restTemplate.getForObject(usgsURL, String.class);

            // Parse the JSON
            JsonNode root = objectMapper.readTree(json);
            JsonNode features = root.path("features"); // list of earthquake events

            List<Earthquake> earthquakes = new ArrayList<>();

            for (JsonNode feature : features) {
                JsonNode props = feature.path("properties");
                JsonNode coords = feature.path("geometry").path("coordinates");

                // Skip if magnitude is missing
                if (props.path("mag").isNull() || props.path("mag").isMissingNode()) {
                    continue;
                }

                double mag = props.path("mag").asDouble();

                // Filter earthquakes above min mag
                if (minMagnitude <= mag) continue;

                Earthquake eq = Earthquake.builder()
                        .magnitude(mag)
                        .magType(props.path("magType").asText(null))
                        .place(props.path("place").asText(null))
                        .title(props.path("title").asText(null))
                        .time(Instant.ofEpochMilli(props.path("time").asLong()))
                        .longitude(coords.get(0).asDouble())
                        .latitude(coords.get(1).asDouble())
                        .depth(coords.get(2).asDouble())
                        .build();

                earthquakes.add(eq);
            }

            // Delete old and save new data
            repository.deleteAll();
            List<Earthquake> saved = repository.saveAll(earthquakes);
            log.info("Saved {} earthquakes", saved.size());
            return saved;

        } catch (Exception e) {
            log.error("Error feetching earthquake data: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch earthquake data: " + e.getMessage());
        }
    }

    public List<Earthquake> getAll() {
        return repository.findAll();
    }

    public List<Earthquake> getAfterTime(Instant time) {
        return repository.findByTimeAfter(time);
    }

    public void deleteById(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Earthquake with id " + id + " does not exist");
        }
        repository.deleteById(id);
    }
}


