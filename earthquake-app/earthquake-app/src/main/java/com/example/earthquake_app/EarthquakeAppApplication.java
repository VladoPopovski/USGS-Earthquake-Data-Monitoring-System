package com.example.earthquake_app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.ObjectMapper;

@SpringBootApplication
public class EarthquakeAppApplication {

	public static void main(String[] args) {
        SpringApplication.run(EarthquakeAppApplication.class, args);
	}

    // register RestTemplate so spring can inject it into service
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    // register ObjectMapper so spring can inject it into service
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }


}
