package com.example.avro.config;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.example.avro.model.TrafficLogEvent;
import com.example.avro.service.TrafficLogPublisher;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class TrafficLoggingInterceptor implements HandlerInterceptor {

    public static final String START_TIME_ATTRIBUTE = "traffic.log.startTimeNanos";
    public static final String SYSTEM_ID_ATTRIBUTE = "traffic.log.systemId";

    private final TrafficLogPublisher trafficLogPublisher;
    private final String serviceName;

    public TrafficLoggingInterceptor(
            TrafficLogPublisher trafficLogPublisher,
            @Value("${spring.application.name:sim-engine-backend}") String serviceName
    ) {
        this.trafficLogPublisher = trafficLogPublisher;
        this.serviceName = serviceName;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) {
        request.setAttribute(START_TIME_ATTRIBUTE, System.nanoTime());
        return true;
    }

    @Override
    public void afterCompletion(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Object handler,
            Exception ex
    ) {
        long durationMs = calculateDurationMs(request.getAttribute(START_TIME_ATTRIBUTE));

        TrafficLogEvent.Builder eventBuilder = TrafficLogEvent.newBuilder()
                .setEventId(UUID.randomUUID().toString())
                .setEventTime(Instant.now())
                .setServiceName(serviceName)
                .setHttpMethod(request.getMethod())
                .setPath(request.getRequestURI())
                .setStatusCode(response.getStatus())
                .setDurationMs(durationMs)
                .setCorrelationId(resolveContextValue(request, MdcRequestFilter.HEADER_CORRELATION_ID, MdcRequestFilter.MDC_CORRELATION_ID))
                .setRequestId(resolveContextValue(request, MdcRequestFilter.HEADER_REQUEST_ID, MdcRequestFilter.MDC_REQUEST_ID))
                .setClientIp(resolveClientIp(request))
                .setUserAgent(headerOrNull(request, "User-Agent"))
                .setSystemId(stringAttributeOrNull(request.getAttribute(SYSTEM_ID_ATTRIBUTE)))
                .setMetadata(buildMetadata(request, ex));

        trafficLogPublisher.publish(eventBuilder.build());
    }

    private long calculateDurationMs(Object startTimeAttribute) {
        if (!(startTimeAttribute instanceof Long startNanos)) {
            return 0L;
        }
        return Math.max(0L, (System.nanoTime() - startNanos) / 1_000_000L);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = headerOrNull(request, "X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String headerOrNull(HttpServletRequest request, String headerName) {
        String headerValue = request.getHeader(headerName);
        if (headerValue == null || headerValue.isBlank()) {
            return null;
        }
        return headerValue;
    }

    private String stringAttributeOrNull(Object value) {
        if (value == null) {
            return null;
        }
        String stringValue = value.toString();
        return stringValue.isBlank() ? null : stringValue;
    }

    private Map<String, String> buildMetadata(HttpServletRequest request, Exception ex) {
        Map<String, String> metadata = new HashMap<>();
        metadata.put("queryString", defaultString(request.getQueryString()));
        metadata.put("contentType", defaultString(request.getContentType()));
        metadata.put("error", ex == null ? "" : ex.getClass().getSimpleName());
        metadata.put("traceId", defaultString(resolveContextValue(request, MdcRequestFilter.HEADER_TRACE_ID, MdcRequestFilter.MDC_TRACE_ID)));
        return metadata;
    }

    private String resolveContextValue(HttpServletRequest request, String headerName, String mdcKey) {
        String headerValue = headerOrNull(request, headerName);
        if (headerValue != null) {
            return headerValue;
        }
        Object requestAttribute = request.getAttribute(mdcKey);
        if (requestAttribute != null) {
            String value = requestAttribute.toString();
            if (!value.isBlank()) {
                return value;
            }
        }
        String mdcValue = MDC.get(mdcKey);
        return (mdcValue == null || mdcValue.isBlank()) ? null : mdcValue;
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
    }
}


