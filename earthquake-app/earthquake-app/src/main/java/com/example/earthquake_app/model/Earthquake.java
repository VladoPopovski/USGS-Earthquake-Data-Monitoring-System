package com.example.earthquake_app.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity // mark as db table
@Table(name = "earthquakes")
@Data // lombok auto generates getters/setters
@NoArgsConstructor // lombok auto generates empty constructor
@AllArgsConstructor // lombok auto generates full constructor
@Builder // lombok enables ex. Earthquake.builder().magnitude(3.5).build()

public class Earthquake {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // auto increment id
    private Long id;
    private Double magnitude;
    private String magType;
    private String place;
    private String title;
    private Instant time;
    private Double longitude;
    private Double latitude;
    private Double depth;

}
