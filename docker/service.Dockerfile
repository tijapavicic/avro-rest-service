FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace
COPY . .

ARG MODULE_PATH

# Build selected module with required upstream modules.
RUN mvn -B -pl ${MODULE_PATH} -am clean package -DskipTests

# Spring Boot repackage usually generates *.jar and *.jar.original; keep the runnable jar.
RUN set -eux; \
    JAR_PATH="$(find "${MODULE_PATH}/target" -maxdepth 1 -type f -name '*.jar' ! -name '*.jar.original' | head -n 1)"; \
    test -n "${JAR_PATH}"; \
    cp "${JAR_PATH}" /tmp/app.jar

FROM eclipse-temurin:17-jre-jammy

RUN useradd --system --create-home --uid 10001 appuser

WORKDIR /app
COPY --from=build /tmp/app.jar /app/app.jar

USER 10001

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

