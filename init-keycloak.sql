SET password_encryption = 'md5';
CREATE USER keycloak WITH ENCRYPTED PASSWORD 'keycloak';
CREATE DATABASE keycloak;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;

-- Connect to the keycloak database
\c keycloak

-- Grant schema privileges
GRANT USAGE, CREATE ON SCHEMA public TO keycloak;

-- Grant table and sequence privileges for existing and future objects
GRANT ALL ON ALL TABLES IN SCHEMA public TO keycloak;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO keycloak;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO keycloak;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO keycloak;

# Do the same for openfga with DB name openfga_db
