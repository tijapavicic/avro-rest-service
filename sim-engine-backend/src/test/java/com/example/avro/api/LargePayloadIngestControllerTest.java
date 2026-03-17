package com.example.avro.api;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPOutputStream;
import com.example.avro.service.LargePayloadIngestService;
import com.example.avro.service.TrafficLogPublisher;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = LargePayloadIngestController.class)
@Import({GlobalExceptionHandler.class, LargePayloadIngestService.class})
@TestPropertySource(properties = "app.payload.ingest.max-decompressed-bytes=300")
class LargePayloadIngestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TrafficLogPublisher trafficLogPublisher;

    @Test
    void shouldAcceptValidGzipPayload() throws Exception {
        String payload = """
                {
                  "scenarionID": "550e8400-e29b-41d4-a716-446655440000",
                  "systemId": "SIM-ENGINE-01",
                  "date": "2026-03-17",
                  "items": [
                    {"item1": 1, "item2": "alpha"},
                    {"item1": 2, "item2": "beta"}
                  ]
                }
                """;

        mockMvc.perform(post("/api/payloads/ingest-gzip")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Content-Encoding", "gzip")
                        .content(gzip(payload)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.scenarionID").value("550e8400-e29b-41d4-a716-446655440000"))
                .andExpect(jsonPath("$.systemId").value("SIM-ENGINE-01"))
                .andExpect(jsonPath("$.itemsProcessed").value(2));
    }

    @Test
    void shouldRejectWhenEncodingIsMissing() throws Exception {
        String payload = """
                {
                  "scenarionID": "550e8400-e29b-41d4-a716-446655440000",
                  "systemId": "SIM-ENGINE-01",
                  "date": "2026-03-17",
                  "items": [{"item1": 1, "item2": "alpha"}]
                }
                """;

        mockMvc.perform(post("/api/payloads/ingest-gzip")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.code").value("UNSUPPORTED_CONTENT_ENCODING"));
    }

    @Test
    void shouldRejectWhenDecompressedPayloadTooLarge() throws Exception {
        String oversizedValue = "x".repeat(500);
        String payload = """
                {
                  "scenarionID": "550e8400-e29b-41d4-a716-446655440000",
                  "systemId": "SIM-ENGINE-01",
                  "date": "2026-03-17",
                  "items": [{"item1": 1, "item2": "%s"}]
                }
                """.formatted(oversizedValue);

        mockMvc.perform(post("/api/payloads/ingest-gzip")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Content-Encoding", "gzip")
                        .content(gzip(payload)))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.code").value("PAYLOAD_TOO_LARGE"))
                .andExpect(jsonPath("$.message", containsString("exceeds limit")));
    }

    private byte[] gzip(String value) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (GZIPOutputStream gzip = new GZIPOutputStream(outputStream)) {
            gzip.write(value.getBytes(StandardCharsets.UTF_8));
        }
        return outputStream.toByteArray();
    }
}

