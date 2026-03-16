package com.example.avro.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final TrafficLoggingInterceptor trafficLoggingInterceptor;

    public WebConfig(TrafficLoggingInterceptor trafficLoggingInterceptor) {
        this.trafficLoggingInterceptor = trafficLoggingInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(trafficLoggingInterceptor).addPathPatterns("/api/**");
    }
}

