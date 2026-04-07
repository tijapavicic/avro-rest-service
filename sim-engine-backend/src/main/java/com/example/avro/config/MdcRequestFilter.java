package com.example.avro.config;

import java.io.IOException;
import java.util.UUID;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Injects request-scoped IDs into MDC so all logs are traceable across layers.
 *
 * <p>Each incoming request is enriched with:
 * <ul>
 *   <li><strong>transactionId</strong> – from {@code X-Transaction-Id} header or generated UUID.</li>
 *   <li><strong>traceId</strong> – from {@code X-Trace-Id} header or generated UUID.</li>
 *   <li><strong>correlationId</strong> – from {@code X-Correlation-Id} header or defaults to traceId.</li>
 *   <li><strong>requestId</strong> – always a fresh UUID for this individual request.</li>
 * </ul>
 *
 * <p>All resolved IDs are echoed as response headers for downstream correlation.
 * MDC is cleared in {@code finally} to prevent leaking across pooled threads.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MdcRequestFilter extends OncePerRequestFilter {

    public static final String HEADER_TRANSACTION_ID = "X-Transaction-Id";
    public static final String HEADER_TRACE_ID = "X-Trace-Id";
    public static final String HEADER_CORRELATION_ID = "X-Correlation-Id";
    public static final String HEADER_REQUEST_ID = "X-Request-Id";

    public static final String MDC_TRANSACTION_ID = "transactionId";
    public static final String MDC_TRACE_ID = "traceId";
    public static final String MDC_CORRELATION_ID = "correlationId";
    public static final String MDC_REQUEST_ID = "requestId";
    public static final String MDC_HTTP_METHOD = "httpMethod";
    public static final String MDC_PATH = "path";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String transactionId = headerOrDefault(request, HEADER_TRANSACTION_ID, UUID.randomUUID().toString());
        String traceId = headerOrDefault(request, HEADER_TRACE_ID, UUID.randomUUID().toString());
        String correlationId = headerOrDefault(request, HEADER_CORRELATION_ID, traceId);
        String requestId = headerOrDefault(request, HEADER_REQUEST_ID, UUID.randomUUID().toString());

        request.setAttribute(MDC_TRANSACTION_ID, transactionId);
        request.setAttribute(MDC_TRACE_ID, traceId);
        request.setAttribute(MDC_CORRELATION_ID, correlationId);
        request.setAttribute(MDC_REQUEST_ID, requestId);

        response.setHeader(HEADER_TRANSACTION_ID, transactionId);
        response.setHeader(HEADER_TRACE_ID, traceId);
        response.setHeader(HEADER_CORRELATION_ID, correlationId);
        response.setHeader(HEADER_REQUEST_ID, requestId);

        MDC.put(MDC_TRANSACTION_ID, transactionId);
        MDC.put(MDC_TRACE_ID, traceId);
        MDC.put(MDC_CORRELATION_ID, correlationId);
        MDC.put(MDC_REQUEST_ID, requestId);
        MDC.put(MDC_HTTP_METHOD, request.getMethod());
        MDC.put(MDC_PATH, request.getRequestURI());

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }

    private String headerOrDefault(HttpServletRequest request, String headerName, String defaultValue) {
        String headerValue = request.getHeader(headerName);
        if (headerValue == null || headerValue.isBlank()) {
            return defaultValue;
        }
        return headerValue;
    }
}

