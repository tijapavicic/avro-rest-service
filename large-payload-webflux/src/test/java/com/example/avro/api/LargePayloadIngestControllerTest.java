package com.example.avro.api;

import com.example.avro.service.LargePayloadIngestService;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPOutputStream;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

@WebFluxTest(controllers = LargePayloadIngestController.class)
@Import({GlobalExceptionHandler.class, LargePayloadIngestService.class})
@TestPropertySource(properties = "app.payload.ingest.max-decompressed-bytes=300")
class LargePayloadIngestControllerTest {

    @Autowired
    private WebTestClient webTestClient;

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

        webTestClient.post()
                .uri("/api/payloads/ingest-gzip")
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_ENCODING, "gzip")
                .bodyValue(gzip(payload))
                .exchange()
                .expectStatus().isAccepted()
                .expectBody()
                .jsonPath("$.scenarionID").isEqualTo("550e8400-e29b-41d4-a716-446655440000")
                .jsonPath("$.itemsProcessed").isEqualTo(2);
    }

    @Test
    void shouldRejectMalformedGzipPayload() {
        webTestClient.post()
                .uri("/api/payloads/ingest-gzip")
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_ENCODING, "gzip")
                .bodyValue("not-a-gzip-stream".getBytes(StandardCharsets.UTF_8))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.code").isEqualTo("PAYLOAD_VALIDATION_ERROR");
    }

    @Test
    void shouldAcceptValidNdjsonPayload() {
        String payload = """
                {"scenarionID":"550e8400-e29b-41d4-a716-446655440000","systemId":"SIM-ENGINE-01","date":"2026-03-17"}
                {"item1":1,"item2":"alpha"}
                {"item1":2,"item2":"beta"}
                """;

        webTestClient.post()
                .uri("/api/payloads/ingest-ndjson")
                .contentType(MediaType.valueOf("application/x-ndjson"))
                .bodyValue(payload)
                .exchange()
                .expectStatus().isAccepted()
                .expectBody()
                .jsonPath("$.scenarionID").isEqualTo("550e8400-e29b-41d4-a716-446655440000")
                .jsonPath("$.itemsProcessed").isEqualTo(2);
    }

    @Test
    void shouldAcceptValidNdjsonPayloadWhenGzipEncoded() throws Exception {
        String payload = """
                {"scenarionID":"550e8400-e29b-41d4-a716-446655440000","systemId":"SIM-ENGINE-01","date":"2026-03-17"}
                {"item1":1,"item2":"alpha"}
                {"item1":2,"item2":"beta"}
                """;

        webTestClient.post()
                .uri("/api/payloads/ingest-ndjson")
                .contentType(MediaType.valueOf("application/x-ndjson"))
                .header(HttpHeaders.CONTENT_ENCODING, "gzip")
                .bodyValue(gzip(payload))
                .exchange()
                .expectStatus().isAccepted()
                .expectBody()
                .jsonPath("$.itemsProcessed").isEqualTo(2);
    }

    @Test
    void shouldRejectWhenPayloadTooLarge() throws Exception {
        String oversizedValue = "x".repeat(500);
        String payload = """
                {
                  "scenarionID": "550e8400-e29b-41d4-a716-446655440000",
                  "systemId": "SIM-ENGINE-01",
                  "date": "2026-03-17",
                  "items": [{"item1": 1, "item2": "%s"}]
                }
                """.formatted(oversizedValue);

        webTestClient.post()
                .uri("/api/payloads/ingest-gzip")
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_ENCODING, "gzip")
                .bodyValue(gzip(payload))
                .exchange()
                .expectStatus().isEqualTo(413)
                .expectBody()
                .jsonPath("$.code").isEqualTo("PAYLOAD_TOO_LARGE");
    }

    private byte[] gzip(String value) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (GZIPOutputStream gzip = new GZIPOutputStream(outputStream)) {
            gzip.write(value.getBytes(StandardCharsets.UTF_8));
        }
        return outputStream.toByteArray();
    }
}

