package com.example.avro.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.*;

class MdcWebFilterTest {

    private final MdcWebFilter filter = new MdcWebFilter();

    @Test
    void shouldEchoProvidedHeadersOnResponse() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header(MdcWebFilter.HEADER_TRANSACTION_ID, "txn-abc")
                .header(MdcWebFilter.HEADER_TRACE_ID, "trace-123")
                .header(MdcWebFilter.HEADER_CORRELATION_ID, "corr-456")
                .header(MdcWebFilter.HEADER_REQUEST_ID, "req-789")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        WebFilterChain chain = ex -> Mono.empty();

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        HttpHeaders responseHeaders = exchange.getResponse().getHeaders();
        assertEquals("txn-abc", responseHeaders.getFirst(MdcWebFilter.HEADER_TRANSACTION_ID));
        assertEquals("trace-123", responseHeaders.getFirst(MdcWebFilter.HEADER_TRACE_ID));
        assertEquals("corr-456", responseHeaders.getFirst(MdcWebFilter.HEADER_CORRELATION_ID));
        assertEquals("req-789", responseHeaders.getFirst(MdcWebFilter.HEADER_REQUEST_ID));
    }

    @Test
    void shouldGenerateUuidsWhenHeadersAreMissing() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        WebFilterChain chain = ex -> Mono.empty();

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        HttpHeaders responseHeaders = exchange.getResponse().getHeaders();
        assertNotNull(responseHeaders.getFirst(MdcWebFilter.HEADER_TRANSACTION_ID));
        assertNotNull(responseHeaders.getFirst(MdcWebFilter.HEADER_TRACE_ID));
        assertNotNull(responseHeaders.getFirst(MdcWebFilter.HEADER_CORRELATION_ID));
        assertNotNull(responseHeaders.getFirst(MdcWebFilter.HEADER_REQUEST_ID));
    }

    @Test
    void shouldDefaultCorrelationIdToTraceIdWhenMissing() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header(MdcWebFilter.HEADER_TRACE_ID, "trace-only")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        WebFilterChain chain = ex -> Mono.empty();

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        HttpHeaders responseHeaders = exchange.getResponse().getHeaders();
        assertEquals("trace-only", responseHeaders.getFirst(MdcWebFilter.HEADER_TRACE_ID));
        assertEquals("trace-only", responseHeaders.getFirst(MdcWebFilter.HEADER_CORRELATION_ID),
                "correlationId should default to traceId when not provided");
    }

    @Test
    void shouldWriteIdsIntoReactorContext() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header(MdcWebFilter.HEADER_TRANSACTION_ID, "txn-ctx")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        WebFilterChain chain = ex -> Mono.deferContextual(ctx -> {
            assertEquals("txn-ctx", ctx.get(MdcWebFilter.MDC_TRANSACTION_ID));
            assertNotNull(ctx.get(MdcWebFilter.MDC_TRACE_ID));
            assertNotNull(ctx.get(MdcWebFilter.MDC_CORRELATION_ID));
            assertNotNull(ctx.get(MdcWebFilter.MDC_REQUEST_ID));
            return Mono.empty();
        });

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
    }

    @Test
    void shouldIgnoreBlankHeaders() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header(MdcWebFilter.HEADER_TRANSACTION_ID, "   ")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        WebFilterChain chain = ex -> Mono.empty();

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        String transactionId = exchange.getResponse().getHeaders().getFirst(MdcWebFilter.HEADER_TRANSACTION_ID);
        assertNotNull(transactionId);
        assertNotEquals("   ", transactionId, "Blank header should be replaced with generated UUID");
    }
}

