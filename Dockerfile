# Dockerfile
FROM openjdk:17-jdk-slim
RUN apt-get update && apt-get install -y curl && apt-get clean
ARG KEYCLOAK_VERSION=25.0.1
RUN curl -sL https://github.com/keycloak/keycloak/releases/download/$KEYCLOAK_VERSION/keycloak-$KEYCLOAK_VERSION.tar.gz | tar -xz -C /opt \
    && mv /opt/keycloak-$KEYCLOAK_VERSION /opt/keycloak
ENV PATH=/opt/keycloak/bin:$PATH
WORKDIR /opt/keycloak
ENV PATH=/opt/keycloak/bin:$PATH
RUN chmod +x /opt/keycloak/bin/kc.sh