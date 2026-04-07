package com.example.avro.service;

import com.example.avro.model.TrafficLogEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Publishes traffic log events via structured SLF4J logging.
 *
 * <p>Previously backed by Kafka; now logs to the application log stream
 * where the observability stack (Prometheus, Grafana, ELK) can pick it up.
 * MDC already carries transactionId, traceId, and correlationId.</p>
 */
@Service
public class TrafficLogPublisher {

    private static final Logger log = LoggerFactory.getLogger(TrafficLogPublisher.class);

    public void publish(TrafficLogEvent event) {
        log.info("traffic_log eventId={} service={} method={} path={} status={} durationMs={} correlationId={} systemId={}",
                event.getEventId(),
                event.getServiceName(),
                event.getHttpMethod(),
                event.getPath(),
                event.getStatusCode(),
                event.getDurationMs(),
                event.getCorrelationId(),
                event.getSystemId());
    }
}
