SHELL := /bin/zsh

RUN_DIR := .run

# .PHONY: build test run-frontend run-backend run-calculation run-simulation run-all stop-all status clean-run

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

