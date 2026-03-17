package com.example.avro.service;

import com.example.avro.api.LargePayloadIngestResponse;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class LargePayloadIngestService {

    private final JsonFactory jsonFactory = new JsonFactory();

    public LargePayloadIngestResponse ingest(InputStream payloadStream) throws IOException {
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

        return new LargePayloadIngestResponse(scenarioId, systemId, date, itemsProcessed);
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
}

