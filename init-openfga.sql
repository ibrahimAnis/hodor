-- SET password_encryption = 'md5';
CREATE USER openfga WITH ENCRYPTED PASSWORD 'openfga';
CREATE DATABASE openfga_db;
GRANT ALL PRIVILEGES ON DATABASE openfga_db TO openfga;

-- Connect to the keycloak database
\c openfga_db

-- Grant schema privileges
GRANT USAGE, CREATE ON SCHEMA public TO openfga;

-- Grant table and sequence privileges for existing and future objects
GRANT ALL ON ALL TABLES IN SCHEMA public TO openfga;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO openfga;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO openfga;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO openfga;

