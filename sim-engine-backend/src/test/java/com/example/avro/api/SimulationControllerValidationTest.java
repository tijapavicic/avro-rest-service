package com.example.avro.api;

import com.example.avro.service.TrafficLogPublisher;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SimulationController.class)
@Import(GlobalExceptionHandler.class)
class SimulationControllerValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TrafficLogPublisher trafficLogPublisher;

    @Test
    void shouldRejectRequestWhenRequiredFieldsMissing() throws Exception {
        mockMvc.perform(post("/api/simulations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .header("X-Trace-Id", "trace-001")
                        .header("X-Correlation-Id", "corr-001")
                        .header("X-Request-Id", "req-001")
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.systemId").exists())
                .andExpect(jsonPath("$.details.requestedAt").exists())
                .andExpect(jsonPath("$.traceId").value("trace-001"))
                .andExpect(jsonPath("$.correlationId").value("corr-001"))
                .andExpect(jsonPath("$.requestId").value("req-001"));
    }

    @Test
    void shouldRejectMalformedJsonBody() throws Exception {
        mockMvc.perform(post("/api/simulations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .content("{\"systemId\":\"SYS-100\""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
                .andExpect(jsonPath("$.traceId").isNotEmpty());
    }

    @Test
    void shouldReturnMethodNotAllowedForGet() throws Exception {
        mockMvc.perform(get("/api/simulations")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
    }

    @Test
    void shouldAcceptValidRequest() throws Exception {
        mockMvc.perform(post("/api/simulations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .content("{\"systemId\":\"SYS-100\",\"requestedAt\":\"2026-03-16T10:00:00Z\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.systemId").value("SYS-100"));
    }
}

