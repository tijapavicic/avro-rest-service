# Manual test commands

These commands assume `sim-engine-backend` is running on `http://localhost:8082`.

## Gzip JSON

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
gzip -c spec/payload_sample_iso.json > /tmp/payload_sample_iso.json.gz

curl -i -X POST http://localhost:8082/api/payloads/ingest-gzip \
  -H 'Content-Type: application/json' \
  -H 'Content-Encoding: gzip' \
  -H 'Accept: application/json' \
  --data-binary @/tmp/payload_sample_iso.json.gz
```

## NDJSON

```zsh
cd /Users/copor/CodexProjects/avro-rest-service

curl -i -X POST http://localhost:8082/api/payloads/ingest-ndjson \
  -H 'Content-Type: application/x-ndjson' \
  -H 'Accept: application/json' \
  --data-binary @spec/payload_sample.ndjson
```