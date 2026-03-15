package com.example.avro;

import com.example.avro.model.UserEvent;
import com.example.avro.service.BackendService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class SimEngineBackendApplicationTests {

    @Autowired
    private BackendService backendService;

    @Test
    void contextLoads() {
        assertNotNull(backendService);
    }

    @Test
    void backendServiceBeanIsAvailable() {
        assertNotNull(backendService);
    }

    @Test
    void supportedEventTypeReturnsUserEventClass() {
        assertEquals(UserEvent.class, backendService.supportedEventType());
    }
}

