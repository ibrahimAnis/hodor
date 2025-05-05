# HODOR

Centralized Authentication System using Keycloak, OpenFGA, and PostgreSQL.

![Architecture Diagram](docs/architecture.png)

## Features

* Single Sign-On (SSO)
* Multi-Factor Authentication (MFA)
* Email Verification After Signup
* Relationship-Based Access Control (RBAC/ABAC)

## Architecture

![Architecture Diagram](docs/architecture.png)

**Components**:

1. **Clients**

   * Web, Mobile, & API consumers
2. **HODOR API**

   * SSR login pages & API endpoints
   * Routes auth requests to Keycloak & OpenFGA
3. **Keycloak**

   * OAuth2/OpenID Connect provider
   * Manages user sessions, tokens, and MFA
4. **OpenFGA**

   * Fine-grained authorization policies
   * Enforces relationship-based access control
5. **PostgreSQL**

   * Stores user data, sessions, audit logs

**Flow**:

1. Client → HODOR API → Keycloak for authentication (login, signup, email verification, MFA)
2. HODOR API → OpenFGA to authorize protected resource requests
3. All data persisted in PostgreSQL

## Prerequisites

* Docker & Docker Compose installed

## Quick Start

```bash
git clone https://github.com/ibrahimAnis/hodor.git
cd hodor
docker compose up -d
```

This will start:

* Keycloak at `http://localhost:8080`
* OpenFGA at `http://localhost:8081`
* PostgreSQL at `localhost:5432`
* HODOR API at `http://localhost:3000`

## Usage

* Visit `http://localhost:3000` to access the login page and test SSO/MFA flows.

## Contributing

Contributions are welcome! Please fork the repo, make your changes, and open a pull request.

## License

MIT
