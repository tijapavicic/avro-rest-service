package com.example.avro.bulkimport.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Set;

/**
 * Service for validating uploaded CSV files.
 * 
 * <p>Performs validation checks including:</p>
 * <ul>
 *   <li>File size limits</li>
 *   <li>Content type verification</li>
 *   <li>Filename sanitization</li>
 * </ul>
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@Slf4j
@Service
public class FileValidationService {
    
    @Value("${bulk-import.max-file-size:524288000}") // 500MB default
    private long maxFileSizeBytes;
    
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "text/csv",
        "text/plain",
        "application/csv",
        "application/vnd.ms-excel"
    );
    
    /**
     * Validate the uploaded file.
     *
     * @param filePart the file part to validate
     * @return Mono of the validated file part
     */
    public Mono<FilePart> validate(FilePart filePart) {
        log.debug("Validating file: {}", filePart.filename());
        
        return Mono.just(filePart)
            .flatMap(this::validateFileSize)
            .flatMap(this::validateContentType)
            .flatMap(this::validateFilename)
            .doOnSuccess(file -> log.info("File validation passed: {}", file.filename()))
            .doOnError(e -> log.error("File validation failed: {}", filePart.filename(), e));
    }
    
    /**
     * Validate file size against configured maximum.
     */
    private Mono<FilePart> validateFileSize(FilePart filePart) {
        long fileSize = filePart.headers().getContentLength();
        
        if (fileSize <= 0) {
            return Mono.error(new IllegalArgumentException("File size must be greater than 0"));
        }
        
        if (fileSize > maxFileSizeBytes) {
            String message = String.format(
                "File size exceeds maximum allowed: %d bytes (max: %d bytes)", 
                fileSize, maxFileSizeBytes);
            log.warn(message);
            return Mono.error(new IllegalArgumentException(message));
        }
        
        log.debug("File size validation passed: {} bytes", fileSize);
        return Mono.just(filePart);
    }
    
    /**
     * Validate content type is CSV-compatible.
     */
    private Mono<FilePart> validateContentType(FilePart filePart) {
        String contentType = filePart.headers().getContentType() != null 
            ? filePart.headers().getContentType().toString() 
            : "";
        
        if (!ALLOWED_CONTENT_TYPES.stream().anyMatch(contentType::contains)) {
            String message = String.format(
                "Invalid content type: %s. Allowed types: %s", 
                contentType, ALLOWED_CONTENT_TYPES);
            log.warn(message);
            return Mono.error(new IllegalArgumentException(message));
        }
        
        log.debug("Content type validation passed: {}", contentType);
        return Mono.just(filePart);
    }
    
    /**
     * Validate and sanitize filename.
     */
    private Mono<FilePart> validateFilename(FilePart filePart) {
        String filename = filePart.filename();
        
        if (filename == null || filename.trim().isEmpty()) {
            return Mono.error(new IllegalArgumentException("Filename cannot be empty"));
        }
        
        // Check for path traversal attempts
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            String message = "Filename contains invalid characters: " + filename;
            log.warn(message);
            return Mono.error(new IllegalArgumentException(message));
        }
        
        // Check file extension
        if (!filename.toLowerCase().endsWith(".csv")) {
            log.warn("File does not have .csv extension: {}", filename);
            // Allow non-.csv files if content type is correct
        }
        
        log.debug("Filename validation passed: {}", filename);
        return Mono.just(filePart);
    }
}

