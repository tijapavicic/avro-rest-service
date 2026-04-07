package com.example.avro.config;

import io.micrometer.context.ThreadLocalAccessor;
import org.slf4j.MDC;

import java.util.Map;

/**
 * Bridges SLF4J MDC with Reactor's context-propagation library.
 *
 * <p>When {@code spring.reactor.context-propagation=auto} is enabled,
 * Reactor automatically captures and restores ThreadLocal state on every
 * scheduler boundary. This accessor tells the framework <em>how</em> to
 * snapshot and restore the MDC map, ensuring that keys like
 * {@code transactionId}, {@code traceId}, and {@code correlationId}
 * survive thread hops in reactive chains.</p>
 */
public class MdcThreadLocalAccessor implements ThreadLocalAccessor<Map<String, String>> {

    /**
     * Unique key used to store the MDC snapshot inside Reactor Context.
     */
    public static final String KEY = "slf4j.mdc";

    @Override
    public Object key() {
        return KEY;
    }

    @Override
    public Map<String, String> getValue() {
        return MDC.getCopyOfContextMap();
    }

    @Override
    public void setValue(Map<String, String> contextMap) {
        if (contextMap != null) {
            MDC.setContextMap(contextMap);
        }
    }

    @Override
    public void setValue() {
        MDC.clear();
    }
}

