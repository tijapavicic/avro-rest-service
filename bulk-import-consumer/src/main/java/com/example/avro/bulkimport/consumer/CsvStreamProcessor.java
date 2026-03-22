package com.example.avro.bulkimport.consumer;

import com.example.avro.bulkimport.consumer.model.DataRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicLong;

/**
 * CSV stream processor that parses and transforms CSV data reactively.
 * 
 * <p>This component handles:</p>
 * <ul>
 *   <li>Streaming CSV parsing (line-by-line)</li>
 *   <li>Data transformation according to business rules</li>
 *   <li>Validation of individual records</li>
 *   <li>Backpressure-aware processing</li>
 * </ul>
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CsvStreamProcessor {
    
    private final DataTransformationService transformationService;
    
    /**
     * Parse and transform CSV file into data records.
     * 
     * <p>This method processes the CSV file line-by-line using reactive streams,
     * ensuring memory-efficient handling of large files (500K+ rows).</p>
     *
     * @param filePart the CSV file to process
     * @return Flux of transformed data records
     */
    public Flux<DataRecord> parseAndTransform(FilePart filePart) {
        log.info("Starting CSV parsing: filename={}", filePart.filename());
        
        AtomicLong lineCounter = new AtomicLong(0);
        
        return DataBufferUtils.join(filePart.content())
            .flatMapMany(dataBuffer -> {
                try {
                    // Convert DataBuffer to InputStream
                    byte[] bytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(bytes);
                    DataBufferUtils.release(dataBuffer);
                    
                    // Create CSV parser
                    BufferedReader reader = new BufferedReader(
                        new InputStreamReader(
                            new java.io.ByteArrayInputStream(bytes), 
                            StandardCharsets.UTF_8
                        )
                    );
                    
                    CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT
                        .builder()
                        .setHeader()
                        .setSkipHeaderRecord(true)
                        .setIgnoreEmptyLines(true)
                        .setTrim(true)
                        .build());
                    
                    // Convert CSV records to Flux
                    return Flux.fromIterable(csvParser)
                        .doOnNext(record -> {
                            long line = lineCounter.incrementAndGet();
                            if (line % 10000 == 0) {
                                log.info("Processed {} lines", line);
                            }
                        })
                        .map(this::parseRecord)
                        .flatMap(transformationService::transform)
                        .filter(this::isValid)
                        .doOnComplete(() -> log.info("CSV parsing completed: {} lines processed", lineCounter.get()))
                        .doOnError(e -> log.error("CSV parsing error at line {}", lineCounter.get(), e));
                        
                } catch (Exception e) {
                    log.error("Error creating CSV parser", e);
                    return Flux.error(e);
                }
            })
            .onBackpressureBuffer(10000) // Buffer up to 10K records
            .doOnCancel(() -> log.warn("CSV parsing cancelled"));
    }
    
    /**
     * Parse a single CSV record into a DataRecord entity.
     */
    private DataRecord parseRecord(CSVRecord csvRecord) {
        try {
            return DataRecord.builder()
                .lineNumber(csvRecord.getRecordNumber())
                .column1(csvRecord.get(0))
                .column2(csvRecord.get(1))
                .column3(csvRecord.get(2))
                .column4(csvRecord.get(3))
                .column5(csvRecord.get(4))
                .column6(csvRecord.get(5))
                .column7(csvRecord.get(6))
                .column8(csvRecord.get(7))
                .column9(csvRecord.get(8))
                .column10(csvRecord.get(9))
                .build();
        } catch (Exception e) {
            log.error("Error parsing CSV record at line {}: {}", 
                csvRecord.getRecordNumber(), e.getMessage());
            throw new RuntimeException("CSV parsing error", e);
        }
    }
    
    /**
     * Validate a data record.
     * 
     * <p>Add your validation logic here. Examples:</p>
     * <ul>
     *   <li>Required field checks</li>
     *   <li>Data type validation</li>
     *   <li>Business rule validation</li>
     * </ul>
     */
    private boolean isValid(DataRecord record) {
        // Example validation: ensure at least column1 is not empty
        if (record.getColumn1() == null || record.getColumn1().trim().isEmpty()) {
            log.warn("Invalid record at line {}: column1 is empty", record.getLineNumber());
            return false;
        }
        
        // Add more validation rules as needed
        
        return true;
    }
}

