package com.example.avro.service;

public class PayloadValidationException extends RuntimeException {

    public PayloadValidationException(String message) {
        super(message);
    }
}

