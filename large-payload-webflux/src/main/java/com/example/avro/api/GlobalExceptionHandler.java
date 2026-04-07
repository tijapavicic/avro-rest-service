package com.example.avro.api;

import com.example.avro.service.PayloadTooLargeException;
import com.example.avro.service.PayloadValidationException;
import com.example.avro.service.UnsupportedPayloadEncodingException;
import java.time.Instant;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ServerWebExchange;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(PayloadValidationException.class)
    public ResponseEntity<ApiErrorResponse> handlePayloadValidation(
            PayloadValidationException ex,
            ServerWebExchange exchange
    ) {
        log.warn("Payload validation error: path={}, message={}", exchange.getRequest().getPath(), ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, "PAYLOAD_VALIDATION_ERROR", ex.getMessage(), exchange, Map.of());
    }

    @ExceptionHandler(PayloadTooLargeException.class)
    public ResponseEntity<ApiErrorResponse> handlePayloadTooLarge(
            PayloadTooLargeException ex,
            ServerWebExchange exchange
    ) {
        log.warn("Payload too large: path={}, message={}", exchange.getRequest().getPath(), ex.getMessage());
        return build(HttpStatus.PAYLOAD_TOO_LARGE, "PAYLOAD_TOO_LARGE", ex.getMessage(), exchange, Map.of());
    }

    @ExceptionHandler(UnsupportedPayloadEncodingException.class)
    public ResponseEntity<ApiErrorResponse> handleUnsupportedEncoding(
            UnsupportedPayloadEncodingException ex,
            ServerWebExchange exchange
    ) {
        log.warn("Unsupported content encoding: path={}, message={}", exchange.getRequest().getPath(), ex.getMessage());
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_CONTENT_ENCODING", ex.getMessage(), exchange, Map.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(
            Exception ex,
            ServerWebExchange exchange
    ) {
        log.error("Unhandled exception: path={}", exchange.getRequest().getPath(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Unexpected server error", exchange, Map.of());
    }

    private ResponseEntity<ApiErrorResponse> build(
            HttpStatus status,
            String code,
            String message,
            ServerWebExchange exchange,
            Map<String, String> details
    ) {
        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                code,
                message,
                exchange.getRequest().getPath().value(),
                details
        );
        return ResponseEntity.status(status).body(body);
    }
}

