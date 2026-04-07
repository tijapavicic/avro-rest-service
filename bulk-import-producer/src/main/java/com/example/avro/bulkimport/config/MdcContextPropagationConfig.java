package com.example.avro.bulkimport.config;

import io.micrometer.context.ContextRegistry;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

/**
 * Registers the {@link MdcThreadLocalAccessor} with the Micrometer
 * {@link ContextRegistry} so that SLF4J MDC values automatically
 * propagate across Reactor scheduler boundaries.
 *
 * <p>Requires {@code spring.reactor.context-propagation=auto} in
 * application properties.</p>
 */
@Configuration
public class MdcContextPropagationConfig {

    private static final Logger log = LoggerFactory.getLogger(MdcContextPropagationConfig.class);

    @PostConstruct
    void registerMdcAccessor() {
        ContextRegistry.getInstance().registerThreadLocalAccessor(new MdcThreadLocalAccessor());
        log.info("Registered MdcThreadLocalAccessor for automatic MDC context propagation");
    }
}

