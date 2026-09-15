CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
EXCEPTION
  WHEN duplicate_table OR insufficient_privilege THEN
    NULL;
END
$$;

DO $$
BEGIN
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE
  AS $fn$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $fn$;
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL;
END
$$;
