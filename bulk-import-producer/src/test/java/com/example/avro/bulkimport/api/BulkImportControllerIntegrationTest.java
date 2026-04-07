package com.example.avro.bulkimport.api;

import com.example.avro.bulkimport.model.ImportJob;
import com.example.avro.bulkimport.model.ImportResponse;
import com.example.avro.bulkimport.model.ImportStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for bulk CSV import functionality.
 * 
 * <p>Tests the complete flow from upload to persistence including:</p>
 * <ul>
 *   <li>Successful CSV upload and job creation</li>
 *   <li>Job status retrieval</li>
 *   <li>File validation errors</li>
 *   <li>Job listing</li>
 * </ul>
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient(timeout = "PT30S")
@ActiveProfiles("test")
@Tag("integration")
@DisplayName("Bulk Import Integration Tests")
class BulkImportControllerIntegrationTest {
    
    @Autowired
    private WebTestClient webTestClient;
    
    @BeforeEach
    void setUp() {
        // Set timeout for long-running tests
        webTestClient = webTestClient.mutate()
            .responseTimeout(Duration.ofSeconds(30))
            .build();
    }
    
    @Test
    @DisplayName("Should accept CSV upload and return 202 Accepted with job ID")
    void shouldAcceptCsvUpload() {
        // Arrange
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        bodyBuilder.part("file", new ClassPathResource("test-data-small.csv"));
        
        // Act & Assert
        webTestClient.post()
            .uri("/api/v1/import/csv")
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
            .exchange()
            .expectStatus().isAccepted()
            .expectBody(ImportResponse.class)
            .value(response -> {
                assertThat(response.getJobId()).isNotNull();
                assertThat(response.getStatus()).isEqualTo(ImportStatus.PENDING);
                assertThat(response.getMessage()).contains("created successfully");
                assertThat(response.getStatusUrl()).contains("/api/v1/import/jobs/");
            });
    }
    
    @Test
    @DisplayName("Should return 400 Bad Request for invalid content type")
    void shouldRejectInvalidContentType() {
        // Arrange
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        bodyBuilder.part("file", "not a csv".getBytes())
            .filename("test.txt")
            .contentType(MediaType.TEXT_PLAIN);
        
        // Act & Assert
        webTestClient.post()
            .uri("/api/v1/import/csv")
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
            .exchange()
            .expectStatus().isBadRequest();
    }
    
    @Test
    @DisplayName("Should retrieve job status with 200 OK")
    void shouldRetrieveJobStatus() {
        // Arrange - First upload a file
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        bodyBuilder.part("file", new ClassPathResource("test-data-small.csv"));
        
        String jobId = webTestClient.post()
            .uri("/api/v1/import/csv")
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
            .exchange()
            .expectStatus().isAccepted()
            .expectBody(ImportResponse.class)
            .returnResult()
            .getResponseBody()
            .getJobId();
        
        // Act & Assert - Get job status
        webTestClient.get()
            .uri("/api/v1/import/jobs/{jobId}", jobId)
            .exchange()
            .expectStatus().isOk()
            .expectBody(ImportJob.class)
            .value(job -> {
                assertThat(job.getId()).isEqualTo(jobId);
                assertThat(job.getStatus()).isIn(
                    ImportStatus.PENDING, 
                    ImportStatus.PROCESSING,
                    ImportStatus.COMPLETED,
                    ImportStatus.COMPLETED_WITH_ERRORS
                );
                assertThat(job.getFilename()).isNotNull();
            });
    }
    
    @Test
    @DisplayName("Should return 404 Not Found for non-existent job")
    void shouldReturn404ForNonExistentJob() {
        // Act & Assert
        webTestClient.get()
            .uri("/api/v1/import/jobs/{jobId}", "non-existent-job-id")
            .exchange()
            .expectStatus().isNotFound();
    }
    
    @Test
    @DisplayName("Should list all jobs with 200 OK")
    void shouldListAllJobs() {
        // Act & Assert
        webTestClient.get()
            .uri("/api/v1/import/jobs")
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(ImportJob.class);
    }
    
    @Test
    @DisplayName("Should reject file with path traversal attempt")
    void shouldRejectPathTraversal() {
        // Arrange
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        bodyBuilder.part("file", "malicious content".getBytes())
            .filename("../../../etc/passwd")
            .contentType(MediaType.TEXT_PLAIN);
        
        // Act & Assert
        webTestClient.post()
            .uri("/api/v1/import/csv")
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
            .exchange()
            .expectStatus().isBadRequest();
    }
}

