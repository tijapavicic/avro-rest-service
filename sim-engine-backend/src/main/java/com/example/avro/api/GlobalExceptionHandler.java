package com.example.avro.api;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import com.example.avro.config.MdcRequestFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.MessageSourceResolvable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        Map<String, String> details = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            details.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request validation failed", request, details);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleMalformedJson(
            HttpMessageNotReadableException ex,
            HttpServletRequest request
    ) {
        return build(
                HttpStatus.BAD_REQUEST,
                "MALFORMED_REQUEST",
                "Malformed or invalid JSON request body",
                request,
                Map.of()
        );
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
            HandlerMethodValidationException ex,
            HttpServletRequest request
    ) {
        Map<String, String> details = new LinkedHashMap<>();
        ex.getAllValidationResults().forEach(result -> {
            String key = resolveValidationKey(result);
            for (MessageSourceResolvable error : result.getResolvableErrors()) {
                String message = error.getDefaultMessage();
                if (message != null && !message.isBlank()) {
                    details.putIfAbsent(key, message);
                }
            }
        });
        return build(HttpStatus.BAD_REQUEST, "CONSTRAINT_VIOLATION", "Constraint violation", request, details);
    }

    private String resolveValidationKey(ParameterValidationResult result) {
        String parameterName = result.getMethodParameter().getParameterName();
        return (parameterName == null || parameterName.isBlank()) ? "request" : parameterName;
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodNotAllowed(
            HttpRequestMethodNotSupportedException ex,
            HttpServletRequest request
    ) {
        Map<String, String> details = new LinkedHashMap<>();
        details.put("method", request.getMethod());
        details.put("allowedMethods", ex.getSupportedHttpMethods() == null
                ? ""
                : ex.getSupportedHttpMethods().toString());
        return build(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "HTTP method is not supported", request, details);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(NoResourceFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "NOT_FOUND", "Requested resource was not found", request, Map.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        String errorId = UUID.randomUUID().toString();
        log.error("Unhandled exception. errorId={} path={}", errorId, request.getRequestURI(), ex);
        return build(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "Unexpected server error",
                request,
                Map.of("errorId", errorId)
        );
    }

    private ResponseEntity<ApiErrorResponse> build(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request,
            Map<String, String> details
    ) {
        String correlationId = firstNonBlank(
                request.getHeader(MdcRequestFilter.HEADER_CORRELATION_ID),
                stringAttribute(request.getAttribute(MdcRequestFilter.MDC_CORRELATION_ID)),
                MDC.get(MdcRequestFilter.MDC_CORRELATION_ID)
        );
        String requestId = firstNonBlank(
                request.getHeader(MdcRequestFilter.HEADER_REQUEST_ID),
                stringAttribute(request.getAttribute(MdcRequestFilter.MDC_REQUEST_ID)),
                MDC.get(MdcRequestFilter.MDC_REQUEST_ID)
        );
        String traceId = resolveTraceId(request);
        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                code,
                message,
                request.getRequestURI(),
                details,
                traceId,
                requestId,
                correlationId
        );
        return ResponseEntity.status(status).body(body);
    }

    private String resolveTraceId(HttpServletRequest request) {
        String traceId = firstNonBlank(
                request.getHeader(MdcRequestFilter.HEADER_TRACE_ID),
                request.getHeader("traceparent"),
                stringAttribute(request.getAttribute(MdcRequestFilter.MDC_TRACE_ID)),
                MDC.get(MdcRequestFilter.MDC_TRACE_ID)
        );
        return traceId == null ? UUID.randomUUID().toString() : traceId;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String stringAttribute(Object value) {
        return value == null ? null : value.toString();
    }
}

