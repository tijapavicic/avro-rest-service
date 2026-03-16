SHELL := /bin/zsh

RUN_DIR := .run
COMPOSE ?= docker compose
KAFKA_SERVICE ?= kafka
KAFKA_BROKER ?= kafka:9092
TOPIC ?= simulation.requests.v1
PARTITIONS ?= 1
REPLICATION_FACTOR ?= 1
E2E_BACKEND_URL ?= http://localhost:8082
E2E_TIMEOUT_SEC ?= 90
E2E_SYSTEM_ID ?= SYS-001
E2E_REQUESTED_AT ?= 2026-03-15T10:00:00Z

.PHONY: build test serve-frontend run-frontend run-backend run-calculation run-simulation run-all stop-all status logs clean-run kafka-up kafka-down kafka-logs topic-create topic-list e2e-smoke

build:
	mvn -B clean verify

test:
	mvn -B test

serve-frontend:
	cd sim-engine-frontend && npx serve . -l 3000

run-frontend: serve-frontend

run-backend:
	mvn -pl sim-engine-backend spring-boot:run

run-calculation:
	mvn -pl calculation-engine spring-boot:run

run-simulation:
	mvn -pl simulation-engine spring-boot:run

run-all:
	@mkdir -p $(RUN_DIR)
	@nohup sh -c 'cd sim-engine-frontend && npx serve . -l 3000' > $(RUN_DIR)/frontend.log 2>&1 & echo $$! > $(RUN_DIR)/frontend.pid
	@nohup mvn -pl sim-engine-backend spring-boot:run > $(RUN_DIR)/backend.log 2>&1 & echo $$! > $(RUN_DIR)/backend.pid
	@nohup mvn -pl calculation-engine spring-boot:run > $(RUN_DIR)/calculation.log 2>&1 & echo $$! > $(RUN_DIR)/calculation.pid
	@nohup mvn -pl simulation-engine spring-boot:run > $(RUN_DIR)/simulation.log 2>&1 & echo $$! > $(RUN_DIR)/simulation.pid
	@echo "Started all services:"
	@echo "  Frontend  → http://localhost:3000"
	@echo "  Backend   → http://localhost:8082"
	@echo "  Logs in $(RUN_DIR)/"

stop-all:
	@for name in frontend backend calculation simulation; do \
		if [ -f $(RUN_DIR)/$$name.pid ]; then \
			pid=$$(cat $(RUN_DIR)/$$name.pid); \
			if kill -0 $$pid >/dev/null 2>&1; then \
				kill $$pid; \
				echo "Stopped $$name ($$pid)"; \
			fi; \
			rm -f $(RUN_DIR)/$$name.pid; \
		fi; \
	done

status:
	@for name in frontend backend calculation simulation; do \
		if [ -f $(RUN_DIR)/$$name.pid ]; then \
			pid=$$(cat $(RUN_DIR)/$$name.pid); \
			if kill -0 $$pid >/dev/null 2>&1; then \
				echo "$$name: running ($$pid)"; \
			else \
				echo "$$name: stale pid file ($$pid)"; \
			fi; \
		else \
			echo "$$name: not running"; \
		fi; \
	done

logs:
	@mkdir -p $(RUN_DIR)
	@touch $(RUN_DIR)/frontend.log $(RUN_DIR)/backend.log $(RUN_DIR)/calculation.log $(RUN_DIR)/simulation.log
	@tail -n 100 -f $(RUN_DIR)/frontend.log $(RUN_DIR)/backend.log $(RUN_DIR)/calculation.log $(RUN_DIR)/simulation.log

clean-run:
	rm -rf $(RUN_DIR)

kafka-up:
	$(COMPOSE) up -d $(KAFKA_SERVICE)

kafka-down:
	$(COMPOSE) stop $(KAFKA_SERVICE)

kafka-logs:
	$(COMPOSE) logs -f $(KAFKA_SERVICE)

topic-create:
	$(COMPOSE) exec -T $(KAFKA_SERVICE) /opt/bitnami/kafka/bin/kafka-topics.sh \
		--bootstrap-server $(KAFKA_BROKER) \
		--create --if-not-exists \
		--topic $(TOPIC) \
		--partitions $(PARTITIONS) \
		--replication-factor $(REPLICATION_FACTOR)

topic-list:
	$(COMPOSE) exec -T $(KAFKA_SERVICE) /opt/bitnami/kafka/bin/kafka-topics.sh \
		--bootstrap-server $(KAFKA_BROKER) \
		--list

e2e-smoke:
	@set -eu; \
	$(COMPOSE) up -d $(KAFKA_SERVICE) sim-engine-backend calculation-engine simulation-engine; \
	$(MAKE) topic-create TOPIC=$(TOPIC); \
	echo "Waiting for backend at $(E2E_BACKEND_URL)/api/simulations ..."; \
	deadline=$$(($$(date +%s) + $(E2E_TIMEOUT_SEC))); \
	ready=0; \
	while [ $$(date +%s) -lt $$deadline ]; do \
		if curl -sS -o /dev/null -w "%{http_code}" "$(E2E_BACKEND_URL)/api/simulations" | grep -Eq "404|405"; then \
			ready=1; break; \
		fi; \
		sleep 2; \
	done; \
	if [ $$ready -ne 1 ]; then \
		echo "Backend did not become ready within $(E2E_TIMEOUT_SEC)s"; \
		$(COMPOSE) ps; \
		exit 1; \
	fi; \
	payload='{"systemId":"$(E2E_SYSTEM_ID)","requestedAt":"$(E2E_REQUESTED_AT)"}'; \
	echo "POST $(E2E_BACKEND_URL)/api/simulations"; \
	http_code=$$(curl -sS -o /tmp/e2e-smoke-response.json -w "%{http_code}" -X POST "$(E2E_BACKEND_URL)/api/simulations" -H "Content-Type: application/json" -H "Accept: application/json" -d "$$payload"); \
	if [ "$$http_code" != "202" ]; then \
		echo "Smoke test failed with HTTP $$http_code"; \
		cat /tmp/e2e-smoke-response.json; \
		exit 1; \
	fi; \
	echo "Smoke test passed (HTTP $$http_code):"; \
	cat /tmp/e2e-smoke-response.json

