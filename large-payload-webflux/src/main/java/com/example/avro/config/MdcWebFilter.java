package com.example.avro.config;

import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

/**
 * WebFlux filter that injects request-scoped IDs into MDC and Reactor Context
 * so all logs are traceable across reactive chains.
 *
 * <p>Each incoming request is enriched with:
 * <ul>
 *   <li><strong>transactionId</strong> – from {@code X-Transaction-Id} header or generated UUID.</li>
 *   <li><strong>traceId</strong> – from {@code X-Trace-Id} header or generated UUID.</li>
 *   <li><strong>correlationId</strong> – from {@code X-Correlation-Id} header or defaults to traceId.</li>
 *   <li><strong>requestId</strong> – always a fresh UUID for this individual request.</li>
 * </ul>
 *
 * <p>All resolved IDs are echoed as response headers and propagated via
 * Reactor {@link Context} so downstream operators can access them.
 * MDC is populated on each signal to support thread-hopping in WebFlux.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MdcWebFilter implements WebFilter {

    public static final String HEADER_TRANSACTION_ID = "X-Transaction-Id";
    public static final String HEADER_TRACE_ID = "X-Trace-Id";
    public static final String HEADER_CORRELATION_ID = "X-Correlation-Id";
    public static final String HEADER_REQUEST_ID = "X-Request-Id";

    public static final String MDC_TRANSACTION_ID = "transactionId";
    public static final String MDC_TRACE_ID = "traceId";
    public static final String MDC_CORRELATION_ID = "correlationId";
    public static final String MDC_REQUEST_ID = "requestId";

    @Override
    @NonNull
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        String transactionId = headerOrDefault(request, HEADER_TRANSACTION_ID, UUID.randomUUID().toString());
        String traceId = headerOrDefault(request, HEADER_TRACE_ID, UUID.randomUUID().toString());
        String correlationId = headerOrDefault(request, HEADER_CORRELATION_ID, traceId);
        String requestId = headerOrDefault(request, HEADER_REQUEST_ID, UUID.randomUUID().toString());

        ServerHttpResponse response = exchange.getResponse();
        response.getHeaders().set(HEADER_TRANSACTION_ID, transactionId);
        response.getHeaders().set(HEADER_TRACE_ID, traceId);
        response.getHeaders().set(HEADER_CORRELATION_ID, correlationId);
        response.getHeaders().set(HEADER_REQUEST_ID, requestId);

        return chain.filter(exchange)
                .contextWrite(Context.of(
                        MDC_TRANSACTION_ID, transactionId,
                        MDC_TRACE_ID, traceId,
                        MDC_CORRELATION_ID, correlationId,
                        MDC_REQUEST_ID, requestId
                ))
                .doFirst(() -> populateMdc(transactionId, traceId, correlationId, requestId))
                .doFinally(signal -> MDC.clear());
    }

    private void populateMdc(String transactionId, String traceId, String correlationId, String requestId) {
        MDC.put(MDC_TRANSACTION_ID, transactionId);
        MDC.put(MDC_TRACE_ID, traceId);
        MDC.put(MDC_CORRELATION_ID, correlationId);
        MDC.put(MDC_REQUEST_ID, requestId);
    }

    private String headerOrDefault(ServerHttpRequest request, String headerName, String defaultValue) {
        String headerValue = request.getHeaders().getFirst(headerName);
        if (headerValue == null || headerValue.isBlank()) {
            return defaultValue;
        }
        return headerValue;
    }
}

