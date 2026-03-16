package com.example.avro.config;

import java.util.Map;

import com.example.avro.model.TrafficLogEvent;
import com.example.avro.service.TrafficLogPublisher;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class TrafficLoggingInterceptorTest {

    @Test
    void shouldPublishStructuredTrafficLogEvent() {
        TrafficLogPublisher publisher = mock(TrafficLogPublisher.class);
        TrafficLoggingInterceptor interceptor = new TrafficLoggingInterceptor(publisher, "sim-engine-backend");

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/simulations");
        request.addHeader("X-Correlation-Id", "corr-123");
        request.addHeader("X-Request-Id", "req-456");
        request.addHeader("User-Agent", "JUnit");
        request.addHeader("X-Forwarded-For", "10.20.30.40");
        request.setContentType("application/json");
        request.setQueryString("trace=true");
        request.setAttribute(TrafficLoggingInterceptor.START_TIME_ATTRIBUTE, System.nanoTime() - 5_000_000L);
        request.setAttribute(TrafficLoggingInterceptor.SYSTEM_ID_ATTRIBUTE, "SYS-001");

        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setStatus(202);

        interceptor.afterCompletion(request, response, new Object(), null);

        ArgumentCaptor<TrafficLogEvent> eventCaptor = ArgumentCaptor.forClass(TrafficLogEvent.class);
        verify(publisher).publish(eventCaptor.capture());

        TrafficLogEvent event = eventCaptor.getValue();
        assertNotNull(event.getEventId());
        assertEquals("sim-engine-backend", event.getServiceName().toString());
        assertEquals("POST", event.getHttpMethod().toString());
        assertEquals("/api/simulations", event.getPath().toString());
        assertEquals(202, event.getStatusCode());
        assertTrue(event.getDurationMs() >= 0);
        assertEquals("corr-123", event.getCorrelationId().toString());
        assertEquals("req-456", event.getRequestId().toString());
        assertEquals("10.20.30.40", event.getClientIp().toString());
        assertEquals("JUnit", event.getUserAgent().toString());
        assertEquals("SYS-001", event.getSystemId().toString());
        Map<String, String> metadata = event.getMetadata();
        assertEquals("trace=true", metadata.get("queryString").toString());
        assertEquals("application/json", metadata.get("contentType").toString());
        assertEquals("", metadata.get("error").toString());
    }
}

