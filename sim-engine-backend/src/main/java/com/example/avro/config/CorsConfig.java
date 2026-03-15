package com.example.avro.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS configuration allowing the local frontend origin to call backend APIs.
 * Restrict allowed origins further in non-local environments.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:3000",
                        "http://localhost:8081",
                        "http://127.0.0.1:3000",
                        "http://127.0.0.1:8081"
                )
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("Content-Type", "Accept", "X-Correlation-Id", "Idempotency-Key")
                .maxAge(3600);
    }
}

