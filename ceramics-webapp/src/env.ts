// Typed shim over window._env_, populated at request time by the platform's
// /env-config.js — never at build time. See react-webapp + thunder-authentication.
type Env = {
  THUNDER_AUTH_CLIENT_ID: string;
  THUNDER_AUTH_ISSUER: string;
  THUNDER_AUTH_JWKS_URL: string;
  THUNDER_AUTH_SCOPES: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
