# Keycloak Auth Placement Summary (Web Components + Spring Boot)

## What You Asked
- Whether Keycloak authentication should live in the frontend or backend.
- A concrete setup for a Web Components frontend and Spring Boot backend.
- A single Markdown file that captures everything discussed.

## Latest Keycloak Version (verified)
- Latest stable release: 26.5.7
- Release date: 2026-04-02
- Verified on: 2026-04-07

## Decision
Authentication and authorization should be enforced by the backend.
The frontend should only initiate login and forward access tokens to the API.

## Why Backend Owns Auth
- The browser is an untrusted environment.
- The backend can validate tokens and enforce authorization consistently.
- Only the backend should hold client secrets or call confidential endpoints.

## Responsibilities

Frontend (Web Components, public client)
- Start the OIDC Authorization Code flow with PKCE (S256).
- Receive tokens from Keycloak.
- Send API requests with `Authorization: Bearer <access_token>`.
- Keep access tokens short-lived and in memory when possible.

Backend (Spring Boot, resource server)
- Validate access tokens on every request (issuer, signature, expiry, audience).
- Enforce roles, scopes, and permissions.
- Optionally call token introspection if using a confidential client.

## Recommended Flow
1. Browser redirects to Keycloak authorization endpoint.
2. User logs in at Keycloak.
3. Keycloak returns an authorization code to the frontend.
4. Frontend exchanges the code for tokens using PKCE.
5. Frontend calls the API with the access token.
6. Backend validates the JWT using Keycloak issuer metadata or JWKS.
7. Backend authorizes and returns data.

## Keycloak Client Setup (typical)

`frontend-spa`
- Client type: public
- Flow: Authorization Code + PKCE
- Redirect URIs: SPA URLs

`backend-api`
- Represents your API as a resource server
- Configure audience and roles used by the backend
- Use confidential settings only if you need introspection or authz services

## Spring Boot Resource Server (example)
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak.example.com/realms/my-realm
          # Optional if you want to avoid calling the provider at startup:
          # jwk-set-uri: https://keycloak.example.com/realms/my-realm/protocol/openid-connect/certs
```

## Keycloak OIDC Endpoints (reference)
- Discovery: `/realms/{realm-name}/.well-known/openid-configuration`
- Authorization: `/realms/{realm-name}/protocol/openid-connect/auth`
- Token: `/realms/{realm-name}/protocol/openid-connect/token`
- Certificates (JWKS): `/realms/{realm-name}/protocol/openid-connect/certs`
- Introspection (confidential clients only): `/realms/{realm-name}/protocol/openid-connect/token/introspect`

## Notes
- Avoid using implicit flow for browser apps.
- Prefer short-lived access tokens and rotate refresh tokens if you must keep them in the browser.
- Use HTTPS everywhere.

## External Sources
- [Keycloak releases](https://github.com/keycloak/keycloak/releases)
- [Keycloak OIDC endpoints and introspection rule](https://www.keycloak.org/securing-apps/oidc-layers)
- [Spring Security resource server configuration](https://docs.spring.vmware.com/spring-security/reference/reactive/oauth2/resource-server/jwt.html)
