package com.example.avro.service;

public class UnsupportedPayloadEncodingException extends RuntimeException {

    public UnsupportedPayloadEncodingException(String message) {
        super(message);
    }
}

