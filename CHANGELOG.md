# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-11-23

### Added

- Static, dependency-free HTML, CSS and JavaScript frontend for snappwd-service,
  replacing the original React/Vite app.
- Text-secret creation with browser-side AES-256-GCM encryption and a choice of
  one-hour, one-day or one-week expiration sent to the API.
- Share links with the secret ID in the query string and the encryption key in
  the URL fragment, plus a copy-link action.
- Confirmation before fetching a one-time secret, local decryption, a copy-secret
  action, and error messages for missing keys and unavailable secrets.
- Light and dark appearance based on the browser's color-scheme preference.
- Nginx Docker image with runtime `API_URL` configuration, and Docker Compose
  setup that builds the sibling snappwd-service repository and runs Redis.
- MIT license, setup instructions and HTTPS guidance for remote deployments.
- Pinned-install instructions and a create-secret screenshot using demo data.

[Unreleased]: https://github.com/SnapPwd/snappwd-web/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/SnapPwd/snappwd-web/releases/tag/v0.1.0
