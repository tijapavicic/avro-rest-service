package com.example.avro.service;

import com.example.avro.model.UserEvent;
import org.springframework.stereotype.Service;

@Service
public class CalculationService {

    public Class<UserEvent> inputType() {
        return UserEvent.class;
    }
}

