package com.example.avro.service;

import com.example.avro.model.UserEvent;
import org.springframework.stereotype.Service;

@Service
public class SimulationService {

    public Class<UserEvent> supportedInput() {
        return UserEvent.class;
    }
}

