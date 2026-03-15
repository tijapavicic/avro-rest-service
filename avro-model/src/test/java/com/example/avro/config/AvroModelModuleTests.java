package com.example.avro.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class AvroModelModuleTests {

    @Test
    void converterCanBeConstructed() {
        assertNotNull(new AvroHttpMessageConverter());
    }
}

