package com.example.avro.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import com.example.avro.model.TrafficLogEvent;
import org.apache.avro.io.BinaryEncoder;
import org.apache.avro.io.EncoderFactory;
import org.apache.avro.specific.SpecificDatumWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class TrafficLogPublisher {

    private static final Logger log = LoggerFactory.getLogger(TrafficLogPublisher.class);

    private final KafkaTemplate<String, byte[]> kafkaTemplate;
    private final String loggingTopic;
    private final boolean enabled;

    public TrafficLogPublisher(
            KafkaTemplate<String, byte[]> kafkaTemplate,
            @Value("${app.kafka.logging-topic:logging-test-topic}") String loggingTopic,
            @Value("${app.kafka.logging-enabled:true}") boolean enabled
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.loggingTopic = loggingTopic;
        this.enabled = enabled;
    }

    public void publish(TrafficLogEvent event) {
        if (!enabled) {
            return;
        }

        try {
            kafkaTemplate.send(loggingTopic, event.getEventId().toString(), toAvroBytes(event));
        } catch (Exception ex) {
            // Logging must never break request handling.
            log.warn("Unable to publish traffic log event to Kafka topic {}", loggingTopic, ex);
        }
    }

    private byte[] toAvroBytes(TrafficLogEvent event) throws IOException {
        SpecificDatumWriter<TrafficLogEvent> writer = new SpecificDatumWriter<>(TrafficLogEvent.class);
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            BinaryEncoder encoder = EncoderFactory.get().binaryEncoder(outputStream, null);
            writer.write(event, encoder);
            encoder.flush();
            return outputStream.toByteArray();
        }
    }
}

