package com.example.avro.service;

import com.example.avro.model.UserEvent;
import org.springframework.stereotype.Service;

@Service
public class BackendService {

    public Class<UserEvent> supportedEventType() {
        return UserEvent.class;
    }
}

