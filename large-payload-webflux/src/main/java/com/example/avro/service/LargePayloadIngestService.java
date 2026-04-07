package com.example.avro.service;

import com.example.avro.api.LargePayloadIngestResponse;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LargePayloadIngestService {

    private static final Logger log = LoggerFactory.getLogger(LargePayloadIngestService.class);

    private static final int MAX_NDJSON_LINE_CHARS = 1_000_000;

    private final JsonFactory jsonFactory = new JsonFactory();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public LargePayloadIngestResponse ingest(InputStream payloadStream) throws IOException {
        log.info("JSON payload parsing started");
        String scenarioId = null;
        String systemId = null;
        String date = null;
        long itemsProcessed = 0L;
        boolean itemsSeen = false;

        try (JsonParser parser = jsonFactory.createParser(payloadStream)) {
            if (parser.nextToken() != JsonToken.START_OBJECT) {
                throw new PayloadValidationException("Payload must be a JSON object");
            }

            while (parser.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = parser.getCurrentName();
                JsonToken valueToken = parser.nextToken();

                if ("scenarionID".equals(fieldName)) {
                    scenarioId = parseScenarioId(parser, valueToken);
                } else if ("systemId".equals(fieldName)) {
                    systemId = parseSystemId(parser, valueToken);
                } else if ("date".equals(fieldName)) {
                    date = parseDate(parser, valueToken);
                } else if ("items".equals(fieldName)) {
                    if (valueToken != JsonToken.START_ARRAY) {
                        throw new PayloadValidationException("Field 'items' must be an array");
                    }
                    itemsSeen = true;
                    itemsProcessed = parseItems(parser);
                } else {
                    parser.skipChildren();
                }
            }
        }

        if (scenarioId == null) {
            throw new PayloadValidationException("Missing required field: scenarionID");
        }
        if (systemId == null) {
            throw new PayloadValidationException("Missing required field: systemId");
        }
        if (date == null) {
            throw new PayloadValidationException("Missing required field: date");
        }
        if (!itemsSeen) {
            throw new PayloadValidationException("Missing required field: items");
        }

        log.info("JSON payload parsing complete: scenarioId={}, systemId={}, items={}", scenarioId, systemId, itemsProcessed);
        return new LargePayloadIngestResponse(scenarioId, systemId, date, itemsProcessed);
    }

    public LargePayloadIngestResponse ingestNdjson(InputStream payloadStream) throws IOException {
        log.info("NDJSON payload parsing started");
        NdjsonMetadata metadata = null;
        long itemsProcessed = 0L;
        int lineNumber = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(payloadStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = readLineWithLimit(reader)) != null) {
                lineNumber++;
                if (line.isBlank()) {
                    continue;
                }

                JsonNode node = readNdjsonNode(line, lineNumber);
                if (metadata == null) {
                    metadata = parseNdjsonMetadata(node);
                } else {
                    validateNdjsonItem(node, lineNumber);
                    itemsProcessed++;
                }
            }
        }

        if (metadata == null) {
            throw new PayloadValidationException("NDJSON payload must start with a metadata line");
        }

        log.info("NDJSON payload parsing complete: scenarioId={}, systemId={}, items={}", metadata.scenarioId(), metadata.systemId(), itemsProcessed);
        return new LargePayloadIngestResponse(metadata.scenarioId(), metadata.systemId(), metadata.date(), itemsProcessed);
    }

    private String readLineWithLimit(BufferedReader reader) throws IOException {
        StringBuilder line = new StringBuilder(Math.min(256, MAX_NDJSON_LINE_CHARS));
        int ch;
        boolean sawAnyCharacter = false;

        while ((ch = reader.read()) != -1) {
            sawAnyCharacter = true;

            if (ch == '\n') {
                break;
            }
            if (ch == '\r') {
                reader.mark(1);
                int next = reader.read();
                if (next != '\n' && next != -1) {
                    reader.reset();
                }
                break;
            }

            if (line.length() >= MAX_NDJSON_LINE_CHARS) {
                throw new PayloadValidationException("NDJSON line exceeds maximum length of " + MAX_NDJSON_LINE_CHARS + " characters");
            }
            line.append((char) ch);
        }

        if (!sawAnyCharacter && line.isEmpty()) {
            return null;
        }

        return line.toString();
    }

    private String parseScenarioId(JsonParser parser, JsonToken token) throws IOException {
        String value = parseStringField(parser, token, "scenarionID");
        try {
            UUID.fromString(value);
            return value;
        } catch (IllegalArgumentException ex) {
            throw new PayloadValidationException("Field 'scenarionID' must be a valid UUID");
        }
    }

    private String parseSystemId(JsonParser parser, JsonToken token) throws IOException {
        String value = parseStringField(parser, token, "systemId");
        if (value.isBlank()) {
            throw new PayloadValidationException("Field 'systemId' must not be blank");
        }
        if (value.length() > 100) {
            throw new PayloadValidationException("Field 'systemId' must be at most 100 characters");
        }
        return value;
    }

    private String parseDate(JsonParser parser, JsonToken token) throws IOException {
        String value = parseStringField(parser, token, "date");
        try {
            LocalDate.parse(value);
            return value;
        } catch (DateTimeParseException ex) {
            throw new PayloadValidationException("Field 'date' must use YYYY-MM-DD format");
        }
    }

    private long parseItems(JsonParser parser) throws IOException {
        long count = 0L;

        while (parser.nextToken() != JsonToken.END_ARRAY) {
            if (parser.currentToken() != JsonToken.START_OBJECT) {
                throw new PayloadValidationException("Each item in 'items' must be an object");
            }

            Integer item1 = null;
            String item2 = null;

            while (parser.nextToken() != JsonToken.END_OBJECT) {
                String itemField = parser.getCurrentName();
                JsonToken itemValueToken = parser.nextToken();

                if ("item1".equals(itemField)) {
                    if (!itemValueToken.isNumeric()) {
                        throw new PayloadValidationException("Field 'item1' must be an integer");
                    }
                    item1 = parser.getIntValue();
                } else if ("item2".equals(itemField)) {
                    if (itemValueToken != JsonToken.VALUE_STRING) {
                        throw new PayloadValidationException("Field 'item2' must be a string");
                    }
                    item2 = parser.getValueAsString();
                } else {
                    parser.skipChildren();
                }
            }

            if (item1 == null) {
                throw new PayloadValidationException("Missing required item field: item1");
            }
            if (item2 == null || item2.isBlank()) {
                throw new PayloadValidationException("Missing required item field: item2");
            }

            count++;
        }

        return count;
    }

    private String parseStringField(JsonParser parser, JsonToken token, String fieldName) throws IOException {
        if (token != JsonToken.VALUE_STRING) {
            throw new PayloadValidationException("Field '" + fieldName + "' must be a string");
        }
        String value = parser.getValueAsString();
        if (value == null) {
            throw new PayloadValidationException("Field '" + fieldName + "' is required");
        }
        return value;
    }

    private JsonNode readNdjsonNode(String line, int lineNumber) {
        try {
            JsonNode node = objectMapper.readTree(line);
            if (node == null || !node.isObject()) {
                throw new PayloadValidationException("NDJSON line " + lineNumber + " must be a JSON object");
            }
            return node;
        } catch (IOException ex) {
            throw new PayloadValidationException("Malformed NDJSON content at line " + lineNumber);
        }
    }

    private NdjsonMetadata parseNdjsonMetadata(JsonNode node) {
        return new NdjsonMetadata(
                parseScenarioId(node.path("scenarionID").asText(null)),
                parseSystemId(node.path("systemId").asText(null)),
                parseDate(node.path("date").asText(null))
        );
    }

    private void validateNdjsonItem(JsonNode node, int lineNumber) {
        JsonNode item1Node = node.get("item1");
        JsonNode item2Node = node.get("item2");

        if (item1Node == null || !item1Node.isInt()) {
            throw new PayloadValidationException("NDJSON item line " + lineNumber + " must contain integer field 'item1'");
        }
        if (item2Node == null || !item2Node.isTextual() || item2Node.asText().isBlank()) {
            throw new PayloadValidationException("NDJSON item line " + lineNumber + " must contain non-blank string field 'item2'");
        }
    }

    private String parseScenarioId(String value) {
        if (value == null) {
            throw new PayloadValidationException("Missing required field: scenarionID");
        }
        try {
            UUID.fromString(value);
            return value;
        } catch (IllegalArgumentException ex) {
            throw new PayloadValidationException("Field 'scenarionID' must be a valid UUID");
        }
    }

    private String parseSystemId(String value) {
        if (value == null) {
            throw new PayloadValidationException("Missing required field: systemId");
        }
        if (value.isBlank()) {
            throw new PayloadValidationException("Field 'systemId' must not be blank");
        }
        if (value.length() > 100) {
            throw new PayloadValidationException("Field 'systemId' must be at most 100 characters");
        }
        return value;
    }

    private String parseDate(String value) {
        if (value == null) {
            throw new PayloadValidationException("Missing required field: date");
        }
        try {
            LocalDate.parse(value);
            return value;
        } catch (DateTimeParseException ex) {
            throw new PayloadValidationException("Field 'date' must use YYYY-MM-DD format");
        }
    }

    private record NdjsonMetadata(String scenarioId, String systemId, String date) {
    }
}

