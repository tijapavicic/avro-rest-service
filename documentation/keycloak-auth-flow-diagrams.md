# Keycloak Authentication Flow Diagrams

**Document:** Keycloak Auth for Web Components + Spring Boot  
**Last Updated:** April 7, 2026  
**Keycloak Version:** 26.5.7

---

## Table of Contents

1. [Architecture Diagram](#architecture-diagram)
2. [Sequence Diagram - Full Flow](#sequence-diagram---full-flow)
3. [Component Diagram](#component-diagram)
4. [Token Validation Flow](#token-validation-flow)
5. [Client Configuration Overview](#client-configuration-overview)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KEYCLOAK SERVER                             │
│                       (Authorization Server)                        │
│                     https://keycloak.example.com                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Realm: my-realm                                            │  │
│  │                                                             │  │
│  │  Clients:                                                   │  │
│  │  • frontend-spa (public, PKCE)                             │  │
│  │  • backend-api (resource server)                           │  │
│  │                                                             │  │
│  │  Endpoints:                                                 │  │
│  │  • /auth (Authorization)                                    │  │
│  │  • /token (Token Exchange)                                  │  │
│  │  • /certs (JWKS - Public Keys)                             │  │
│  │  • /.well-known/openid-configuration (Discovery)           │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ▲           ▲
                              │           │
                    ┌─────────┘           └─────────┐
                    │ OIDC/OAuth2                   │ JWT Validation
                    │ Auth Flow                     │ (JWKS)
                    │                               │
┌───────────────────▼─────────────┐    ┌───────────▼──────────────────┐
│      FRONTEND (Browser)         │    │   BACKEND (Spring Boot)      │
│   Web Components (Lit/Stencil)  │    │     Resource Server          │
├─────────────────────────────────┤    ├──────────────────────────────┤
│                                 │    │                              │
│  Client Type: Public            │    │  OAuth2 Resource Server      │
│  Flow: Authorization Code+PKCE  │    │                              │
│                                 │    │  Token Validation:           │
│  Responsibilities:              │    │  • JWT signature (JWKS)      │
│  ✓ Initiate login               │    │  • Issuer verification       │
│  ✓ Handle auth callback         │    │  • Expiry check              │
│  ✓ Store tokens (memory)        │    │  • Audience validation       │
│  ✓ Send Bearer tokens           │    │                              │
│  ✗ Validate tokens              │    │  Authorization:              │
│  ✗ Enforce permissions          │    │  ✓ Role-based access         │
│                                 │    │  ✓ Scope enforcement         │
│                                 │    │  ✓ Permission checks         │
│                                 │    │                              │
└─────────────────┬───────────────┘    └──────────────▲───────────────┘
                  │                                   │
                  │  API Requests                     │
                  │  Authorization: Bearer <token>    │
                  └───────────────────────────────────┘
                            HTTPS Required
```

---

## Sequence Diagram - Full Flow

```
┌──────┐          ┌─────────┐          ┌──────────┐          ┌─────────┐
│ User │          │ Browser │          │ Keycloak │          │ Backend │
│      │          │ (SPA)   │          │ Server   │          │  (API)  │
└──┬───┘          └────┬────┘          └────┬─────┘          └────┬────┘
   │                   │                    │                     │
   │ 1. Click Login    │                    │                     │
   ├──────────────────>│                    │                     │
   │                   │                    │                     │
   │                   │ 2. Generate PKCE   │                     │
   │                   │    code_verifier   │                     │
   │                   │    code_challenge  │                     │
   │                   │    (S256 hash)     │                     │
   │                   │                    │                     │
   │                   │ 3. Redirect to     │                     │
   │                   │    Authorization   │                     │
   │                   │    Endpoint        │                     │
   │                   │    + code_challenge│                     │
   │                   │    + client_id     │                     │
   │                   │    + redirect_uri  │                     │
   │                   ├───────────────────>│                     │
   │                   │                    │                     │
   │ 4. Present Login  │                    │                     │
   │   Screen          │                    │                     │
   │<──────────────────┼────────────────────┤                     │
   │                   │                    │                     │
   │ 5. Enter          │                    │                     │
   │    Credentials    │                    │                     │
   ├──────────────────>│                    │                     │
   │                   ├───────────────────>│                     │
   │                   │                    │                     │
   │                   │ 6. Validate        │                     │
   │                   │    Credentials     │                     │
   │                   │                    │                     │
   │                   │ 7. Return          │                     │
   │                   │    Authorization   │                     │
   │                   │    Code            │                     │
   │                   │    (to redirect_uri)                    │
   │                   │<───────────────────┤                     │
   │                   │                    │                     │
   │                   │ 8. Exchange Code   │                     │
   │                   │    for Tokens      │                     │
   │                   │    POST /token     │                     │
   │                   │    + code          │                     │
   │                   │    + code_verifier │                     │
   │                   │    + client_id     │                     │
   │                   ├───────────────────>│                     │
   │                   │                    │                     │
   │                   │                    │ 9. Verify PKCE     │
   │                   │                    │    (code_challenge │
   │                   │                    │     matches        │
   │                   │                    │     code_verifier) │
   │                   │                    │                     │
   │                   │ 10. Return Tokens: │                     │
   │                   │     • access_token │                     │
   │                   │     • refresh_token│                     │
   │                   │     • id_token     │                     │
   │                   │<───────────────────┤                     │
   │                   │                    │                     │
   │                   │ 11. Store tokens   │                     │
   │                   │     (in memory)    │                     │
   │                   │                    │                     │
   │ 12. User          │                    │                     │
   │     Authenticated │                    │                     │
   │<──────────────────┤                    │                     │
   │                   │                    │                     │
   │ 13. Request API   │                    │                     │
   │     Data          │                    │                     │
   ├──────────────────>│                    │                     │
   │                   │                    │                     │
   │                   │ 14. API Call       │                     │
   │                   │     GET /api/data  │                     │
   │                   │     Authorization: │                     │
   │                   │     Bearer <token> │                     │
   │                   ├────────────────────┼────────────────────>│
   │                   │                    │                     │
   │                   │                    │ 15. Fetch JWKS     │
   │                   │                    │     (first time    │
   │                   │                    │      or cached)    │
   │                   │                    │<────────────────────┤
   │                   │                    │                     │
   │                   │                    │ 16. Public Keys    │
   │                   │                    │────────────────────>│
   │                   │                    │                     │
   │                   │                    │                     │ 17. Validate JWT:
   │                   │                    │                     │     • Signature (JWKS)
   │                   │                    │                     │     • Issuer
   │                   │                    │                     │     • Expiry (exp)
   │                   │                    │                     │     • Audience (aud)
   │                   │                    │                     │     • Not Before (nbf)
   │                   │                    │                     │
   │                   │                    │                     │ 18. Extract Claims:
   │                   │                    │                     │     • Roles
   │                   │                    │                     │     • Scopes
   │                   │                    │                     │     • Permissions
   │                   │                    │                     │
   │                   │                    │                     │ 19. Authorize:
   │                   │                    │                     │     Check user has
   │                   │                    │                     │     required roles
   │                   │                    │                     │
   │                   │ 20. API Response   │                     │
   │                   │     200 OK         │                     │
   │                   │     { data }       │                     │
   │                   │<────────────────────┼─────────────────────┤
   │                   │                    │                     │
   │ 21. Display Data  │                    │                     │
   │<──────────────────┤                    │                     │
   │                   │                    │                     │
```

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                        KEYCLOAK REALM: my-realm                     │
│                                                                     │
│  ┌────────────────────────────┐    ┌─────────────────────────────┐ │
│  │  Client: frontend-spa      │    │  Client: backend-api        │ │
│  │                            │    │                             │ │
│  │  Type: Public              │    │  Type: Resource Server      │ │
│  │  Protocol: openid-connect  │    │  Protocol: openid-connect   │ │
│  │  Access Type: public       │    │  Access Type: bearer-only   │ │
│  │                            │    │                             │ │
│  │  Settings:                 │    │  Settings:                  │ │
│  │  ✓ Standard Flow Enabled   │    │  ✓ Used for audience        │ │
│  │  ✓ PKCE: S256              │    │  ✓ Defines API roles        │ │
│  │  ✗ Implicit Flow           │    │  ✓ Permission mappings      │ │
│  │  ✗ Direct Access Grants    │    │                             │ │
│  │                            │    │  Roles:                     │ │
│  │  Valid Redirect URIs:      │    │  • api-user                 │ │
│  │  • http://localhost:3000/* │    │  • api-admin                │ │
│  │  • https://app.example.com/*   │  • data-read                │ │
│  │                            │    │  • data-write               │ │
│  │  Web Origins:              │    │                             │ │
│  │  • http://localhost:3000   │    │                             │ │
│  │  • https://app.example.com │    │                             │ │
│  └────────────────────────────┘    └─────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Users & Roles                                                │ │
│  │                                                               │ │
│  │  john.doe@example.com                                         │ │
│  │  └─ Roles: api-user, data-read                               │ │
│  │                                                               │ │
│  │  admin@example.com                                            │ │
│  │  └─ Roles: api-admin, api-user, data-read, data-write       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Application Architecture:

┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND APPLICATION (Browser)                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Web Components (Lit / Stencil / Custom Elements)         │ │
│  │                                                            │ │
│  │  ┌───────────────┐  ┌──────────────┐  ┌────────────────┐ │ │
│  │  │ Login Button  │  │ Auth Service │  │ API Client     │ │ │
│  │  │ Component     │──│              │──│                │ │ │
│  │  └───────────────┘  │ • PKCE Gen   │  │ • Add Bearer   │ │ │
│  │                     │ • Token Store│  │ • Handle 401   │ │ │
│  │  ┌───────────────┐  │ • Refresh    │  │ • Retry logic  │ │ │
│  │  │ User Profile  │──│              │  │                │ │ │
│  │  │ Component     │  └──────────────┘  └────────────────┘ │ │
│  │  └───────────────┘                                        │ │
│  │                                                            │ │
│  │  Token Storage: Memory (JavaScript variables)             │ │
│  │  No localStorage for access tokens (security)             │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              │ Authorization: Bearer <access_token>
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND APPLICATION (Spring Boot)                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Spring Security OAuth2 Resource Server                   │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Security Filter Chain                               │ │ │
│  │  │                                                      │ │ │
│  │  │  1. BearerTokenAuthenticationFilter                 │ │ │
│  │  │     └─ Extract JWT from Authorization header        │ │ │
│  │  │                                                      │ │ │
│  │  │  2. JwtAuthenticationProvider                       │ │ │
│  │  │     └─ Decode & Validate JWT                        │ │ │
│  │  │        • Fetch JWKS from Keycloak                   │ │ │
│  │  │        • Verify signature                           │ │ │
│  │  │        • Check issuer, exp, aud                     │ │ │
│  │  │                                                      │ │ │
│  │  │  3. JwtGrantedAuthoritiesConverter                  │ │ │
│  │  │     └─ Extract roles from JWT claims                │ │ │
│  │  │                                                      │ │ │
│  │  │  4. AuthorizationFilter                             │ │ │
│  │  │     └─ Check method security annotations            │ │ │
│  │  │        @PreAuthorize("hasRole('api-admin')")        │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  REST Controllers                                    │ │ │
│  │  │                                                      │ │ │
│  │  │  @GetMapping("/api/data")                           │ │ │
│  │  │  @PreAuthorize("hasAuthority('data-read')")         │ │ │
│  │  │  public ResponseEntity<Data> getData() { ... }      │ │ │
│  │  │                                                      │ │ │
│  │  │  @PostMapping("/api/data")                          │ │ │
│  │  │  @PreAuthorize("hasAuthority('data-write')")        │ │ │
│  │  │  public ResponseEntity<Data> createData() { ... }   │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  application.yml:                                                │
│  spring:                                                         │
│    security:                                                     │
│      oauth2:                                                     │
│        resourceserver:                                           │
│          jwt:                                                    │
│            issuer-uri: https://keycloak.example.com/realms/...   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Token Validation Flow

```
Backend receives request with JWT token:

┌─────────────────────────────────────────────────────────────┐
│  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6...     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ 1. Extract JWT Token  │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ 2. Decode JWT Header  │
                 │    Extract 'kid'      │
                 │    (Key ID)           │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ 3. Fetch JWKS from    │
                 │    Keycloak           │
                 │    (cached if recent) │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ 4. Find Public Key    │
                 │    matching 'kid'     │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ 5. Verify Signature   │
                 │    RS256 / RSA        │
                 └───────────┬───────────┘
                             │
                   ┌─────────┴─────────┐
                   │ Valid?            │
                   └─────┬─────────┬───┘
                    YES  │         │ NO
                         ▼         ▼
              ┌──────────────┐  ┌─────────────────┐
              │ 6. Validate  │  │ 401 Unauthorized│
              │    Claims:   │  │ Invalid Token   │
              │              │  └─────────────────┘
              │ • iss (issuer)
              │ • exp (expiry)
              │ • aud (audience)
              │ • nbf (not before)
              │ • iat (issued at)
              └──────┬────────┘
                     │
           ┌─────────┴─────────┐
           │ All Valid?        │
           └─────┬─────────┬───┘
            YES  │         │ NO
                 ▼         ▼
      ┌──────────────┐  ┌─────────────────┐
      │ 7. Extract   │  │ 401 Unauthorized│
      │    Roles &   │  │ Claims Invalid  │
      │    Scopes    │  └─────────────────┘
      └──────┬───────┘
             │
             ▼
      ┌──────────────┐
      │ 8. Authorize │
      │    Check @   │
      │    PreAuth   │
      └──────┬───────┘
             │
   ┌─────────┴─────────┐
   │ Has Permission?   │
   └─────┬─────────┬───┘
    YES  │         │ NO
         ▼         ▼
  ┌────────────┐  ┌─────────────┐
  │ 200 OK     │  │ 403 Forbidden│
  │ Process    │  │ Insufficient │
  │ Request    │  │ Permissions  │
  └────────────┘  └─────────────┘
```

---

## Client Configuration Overview

### Frontend Client (frontend-spa)

```yaml
Client ID: frontend-spa
Client Type: Public
Protocol: openid-connect
Access Type: public

Flows:
  ✓ Standard Flow (Authorization Code)
  ✓ PKCE Required: S256
  ✗ Implicit Flow (deprecated)
  ✗ Direct Access Grants (not for browser apps)
  ✗ Service Accounts (confidential only)

Authentication:
  ✗ Client Authentication: OFF (public client)
  
URLs:
  Root URL: https://app.example.com
  Valid Redirect URIs: 
    - https://app.example.com/*
    - http://localhost:3000/*
  Web Origins:
    - https://app.example.com
    - http://localhost:3000
  Admin URL: (empty)
  
Settings:
  Consent Required: No
  Display Client On Screen: No
  Client Authenticator: (none - public)
  
Advanced:
  Proof Key for Code Exchange Code Challenge Method: S256
  Access Token Lifespan: 5 minutes (or realm default)
  
Scopes:
  - openid
  - profile
  - email
```

### Backend Client (backend-api)

```yaml
Client ID: backend-api
Client Type: Resource Server / Bearer-only
Protocol: openid-connect

Purpose:
  - Represents the API as a protected resource
  - Defines roles used for authorization
  - Not used for authentication flows

Roles:
  - api-user (basic API access)
  - api-admin (administrative access)
  - data-read (read data)
  - data-write (write data)
  
Role Mappings:
  Assign to users via:
  - Direct assignment
  - Group membership
  - Composite roles
  - Identity provider mappers
  
Token Claims:
  resource_access:
    backend-api:
      roles:
        - api-user
        - data-read
```

---

## Security Best Practices Summary

### ✅ DO

- **Frontend:**
  - Use Authorization Code flow with PKCE (S256)
  - Keep access tokens short-lived (5-15 minutes)
  - Store tokens in memory (JavaScript variables)
  - Clear tokens on logout
  - Handle token expiry gracefully
  - Use HTTPS everywhere

- **Backend:**
  - Validate JWT signature using JWKS
  - Verify issuer, audience, expiry
  - Enforce authorization on every endpoint
  - Use `@PreAuthorize` or equivalent
  - Log authentication/authorization events
  - Rate limit token validation endpoints

- **Keycloak:**
  - Enable HTTPS (TLS 1.2+)
  - Configure proper CORS policies
  - Set appropriate token lifespans
  - Enable session management
  - Monitor failed login attempts
  - Regular security updates

### ❌ DON'T

- **Frontend:**
  - ❌ Use implicit flow (deprecated)
  - ❌ Store access tokens in localStorage
  - ❌ Expose client secrets in browser code
  - ❌ Trust frontend validation alone
  - ❌ Use long-lived access tokens (>15 min)
  - ❌ Implement your own JWT validation

- **Backend:**
  - ❌ Trust tokens without validation
  - ❌ Skip signature verification
  - ❌ Ignore token expiry
  - ❌ Use client secrets in public code
  - ❌ Expose internal errors to clients
  - ❌ Allow authentication bypass for "testing"

---

## Token Anatomy

### Access Token (JWT) Example

```
Header:
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "rsa-key-abc123"
}

Payload:
{
  "exp": 1714150800,               // Expiry timestamp
  "iat": 1714150500,               // Issued at
  "jti": "uuid-token-id",          // JWT ID (unique)
  "iss": "https://keycloak.example.com/realms/my-realm",
  "aud": ["backend-api", "account"], // Audience
  "sub": "user-uuid-123",          // Subject (user ID)
  "typ": "Bearer",
  "azp": "frontend-spa",           // Authorized party (client)
  "session_state": "session-uuid",
  "acr": "1",
  "realm_access": {
    "roles": ["offline_access", "uma_authorization"]
  },
  "resource_access": {
    "backend-api": {
      "roles": ["api-user", "data-read"]
    }
  },
  "scope": "openid profile email",
  "email_verified": true,
  "name": "John Doe",
  "preferred_username": "john.doe",
  "given_name": "John",
  "family_name": "Doe",
  "email": "john.doe@example.com"
}

Signature:
[RSA signature computed from Header + Payload + Private Key]
```

### How Backend Validates:

1. **Decode header** → Extract `kid` (key ID)
2. **Fetch JWKS** → Get public keys from Keycloak
3. **Verify signature** → Use public key matching `kid`
4. **Check `iss`** → Must match configured issuer
5. **Check `exp`** → Token not expired
6. **Check `aud`** → Contains `backend-api` or acceptable audience
7. **Extract roles** → From `resource_access.backend-api.roles`
8. **Authorize** → User has required role for endpoint

---

## Quick Reference

### Keycloak URLs (replace with your actual URLs)

```
Realm: my-realm
Base: https://keycloak.example.com

Discovery:      /realms/my-realm/.well-known/openid-configuration
Authorization:  /realms/my-realm/protocol/openid-connect/auth
Token:          /realms/my-realm/protocol/openid-connect/token
JWKS:           /realms/my-realm/protocol/openid-connect/certs
UserInfo:       /realms/my-realm/protocol/openid-connect/userinfo
Logout:         /realms/my-realm/protocol/openid-connect/logout
Introspection:  /realms/my-realm/protocol/openid-connect/token/introspect
```

### Spring Boot Configuration

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak.example.com/realms/my-realm
          # Optional: jwk-set-uri for offline startup
          jwk-set-uri: https://keycloak.example.com/realms/my-realm/protocol/openid-connect/certs
```

### Example Frontend Auth Request

```javascript
// 1. Generate PKCE
const codeVerifier = generateRandomString(128);
const codeChallenge = await sha256(codeVerifier);

// 2. Redirect to Keycloak
const authUrl = new URL('https://keycloak.example.com/realms/my-realm/protocol/openid-connect/auth');
authUrl.searchParams.set('client_id', 'frontend-spa');
authUrl.searchParams.set('redirect_uri', 'https://app.example.com/callback');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
window.location.href = authUrl.toString();

// 3. Handle callback (after redirect back)
const code = new URLSearchParams(window.location.search).get('code');

// 4. Exchange code for tokens
const tokenResponse = await fetch('https://keycloak.example.com/realms/my-realm/protocol/openid-connect/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: 'frontend-spa',
    redirect_uri: 'https://app.example.com/callback',
    code: code,
    code_verifier: codeVerifier
  })
});

const tokens = await tokenResponse.json();
// tokens.access_token, tokens.refresh_token, tokens.id_token
```

---

**Document Version:** 1.0  
**Based On:** keycloak-auth-webcomponents-springboot.md  
**Created:** April 7, 2026

