package com.example.avro.config;

import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class MdcRequestFilterTest {

    private final MdcRequestFilter filter = new MdcRequestFilter();

    @Test
    void shouldPropagateIncomingContextIdsToMdcAndResponseHeaders() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/simulations");
        request.addHeader(MdcRequestFilter.HEADER_TRACE_ID, "trace-123");
        request.addHeader(MdcRequestFilter.HEADER_CORRELATION_ID, "corr-123");
        request.addHeader(MdcRequestFilter.HEADER_REQUEST_ID, "req-123");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (req, res) -> {
            assertEquals("trace-123", MDC.get(MdcRequestFilter.MDC_TRACE_ID));
            assertEquals("corr-123", MDC.get(MdcRequestFilter.MDC_CORRELATION_ID));
            assertEquals("req-123", MDC.get(MdcRequestFilter.MDC_REQUEST_ID));
            assertEquals("POST", MDC.get(MdcRequestFilter.MDC_HTTP_METHOD));
            assertEquals("/api/simulations", MDC.get(MdcRequestFilter.MDC_PATH));
        });

        assertEquals("trace-123", response.getHeader(MdcRequestFilter.HEADER_TRACE_ID));
        assertEquals("corr-123", response.getHeader(MdcRequestFilter.HEADER_CORRELATION_ID));
        assertEquals("req-123", response.getHeader(MdcRequestFilter.HEADER_REQUEST_ID));
        assertNull(MDC.get(MdcRequestFilter.MDC_TRACE_ID));
        assertNull(MDC.get(MdcRequestFilter.MDC_CORRELATION_ID));
        assertNull(MDC.get(MdcRequestFilter.MDC_REQUEST_ID));
    }

    @Test
    void shouldGenerateContextIdsWhenHeadersAreMissing() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/simulations");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (req, res) -> {
            assertNotNull(MDC.get(MdcRequestFilter.MDC_TRACE_ID));
            assertNotNull(MDC.get(MdcRequestFilter.MDC_CORRELATION_ID));
            assertNotNull(MDC.get(MdcRequestFilter.MDC_REQUEST_ID));
            assertEquals(MDC.get(MdcRequestFilter.MDC_TRACE_ID), MDC.get(MdcRequestFilter.MDC_CORRELATION_ID));
        });

        assertNotNull(response.getHeader(MdcRequestFilter.HEADER_TRACE_ID));
        assertNotNull(response.getHeader(MdcRequestFilter.HEADER_CORRELATION_ID));
        assertNotNull(response.getHeader(MdcRequestFilter.HEADER_REQUEST_ID));
        assertNull(MDC.get(MdcRequestFilter.MDC_TRACE_ID));
        assertNull(MDC.get(MdcRequestFilter.MDC_CORRELATION_ID));
        assertNull(MDC.get(MdcRequestFilter.MDC_REQUEST_ID));
    }
}

