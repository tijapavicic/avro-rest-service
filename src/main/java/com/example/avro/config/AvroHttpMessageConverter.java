package com.example.avro.config;

import java.io.IOException;

import org.apache.avro.Schema;
import org.apache.avro.io.BinaryDecoder;
import org.apache.avro.io.BinaryEncoder;
import org.apache.avro.io.Decoder;
import org.apache.avro.io.DecoderFactory;
import org.apache.avro.io.Encoder;
import org.apache.avro.io.EncoderFactory;
import org.apache.avro.specific.SpecificData;
import org.apache.avro.specific.SpecificDatumReader;
import org.apache.avro.specific.SpecificDatumWriter;
import org.apache.avro.specific.SpecificRecordBase;
import org.springframework.http.MediaType;
import org.springframework.http.converter.AbstractHttpMessageConverter;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.stereotype.Component;
import org.springframework.util.MimeType;
import org.springframework.util.MimeTypeUtils;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;

@Component
public class AvroHttpMessageConverter extends AbstractHttpMessageConverter<SpecificRecordBase> {

    private static final MediaType AVRO_BINARY = new MediaType("application", "avro");
    private static final MediaType AVRO_JSON = new MediaType("application", "avro+json");
    private static final MimeType AVRO_JSON_MIME = new MimeType("application", "avro+json");

    public AvroHttpMessageConverter() {
        super(AVRO_BINARY, AVRO_JSON);
    }

    @Override
    protected boolean supports(Class<?> clazz) {
        return SpecificRecordBase.class.isAssignableFrom(clazz);
    }

    @Override
    protected SpecificRecordBase readInternal(Class<? extends SpecificRecordBase> clazz, HttpInputMessage inputMessage)
            throws IOException, HttpMessageNotReadableException {
        Schema schema = SpecificData.get().getSchema(clazz);
        Decoder decoder;
        if (isJson(inputMessage.getHeaders().getContentType())) {
            decoder = DecoderFactory.get().jsonDecoder(schema, inputMessage.getBody());
        } else {
            BinaryDecoder binaryDecoder = DecoderFactory.get().binaryDecoder(inputMessage.getBody(), null);
            decoder = binaryDecoder;
        }
        SpecificDatumReader<SpecificRecordBase> reader = new SpecificDatumReader<>(schema);
        return reader.read(null, decoder);
    }

    @Override
    protected void writeInternal(SpecificRecordBase record, HttpOutputMessage outputMessage)
            throws IOException, HttpMessageNotWritableException {
        Schema schema = record.getSchema();
        Encoder encoder;
        if (isJson(outputMessage.getHeaders().getContentType())) {
            encoder = EncoderFactory.get().jsonEncoder(schema, outputMessage.getBody());
        } else {
            encoder = EncoderFactory.get().binaryEncoder(outputMessage.getBody(), null);
        }
        SpecificDatumWriter<SpecificRecordBase> writer = new SpecificDatumWriter<>(schema);
        writer.write(record, encoder);
        encoder.flush();
    }

    private boolean isJson(MediaType contentType) {
        if (contentType == null) {
            return false;
        }
        if (contentType.isCompatibleWith(AVRO_JSON)) {
            return true;
        }
        MimeType mimeType = contentType;
        return MimeTypeUtils.APPLICATION_JSON.isCompatibleWith(mimeType) || AVRO_JSON_MIME.isCompatibleWith(mimeType);
    }
}
