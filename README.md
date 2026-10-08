# SnapPwd Self-Hosted Web

[![Live App](https://img.shields.io/badge/Live_App-snappwd.io-00C853?style=for-the-badge&logo=appveyor)](https://snappwd.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

The official self-hosted web frontend for [SnapPwd](https://snappwd.io).

This is a lightweight, static Single Page Application (SPA) built with **zero-dependency HTML, CSS, and JavaScript**. It is designed to work with the [snappwd-service](https://github.com/SnapPwd/snappwd-service) backend.

## Try it

**Hosted**: use [snappwd.io](https://www.snappwd.io) directly. No setup, nothing to install.

**Self-hosted**: run the web app, the API and Redis with Docker Compose. The included `docker-compose.yml` builds the backend from a **sibling directory**, so clone both repositories side by side:

```bash
mkdir snappwd-selfhosted && cd snappwd-selfhosted
git clone https://github.com/SnapPwd/snappwd-web.git
git clone https://github.com/SnapPwd/snappwd-service.git

cd snappwd-web
docker compose up -d
```

Open `http://localhost` to use the app. The API is published on `http://localhost:8080`.

The browser calls the API at the address in `API_URL`, which `docker-compose.yml` sets to `http://localhost:8080`. To reach the instance from another machine, change `API_URL` to an address that machine can resolve. The [self-hosting guide](https://www.snappwd.io/docs/self-hosting) covers the full stack, and the [snappwd-service README](https://github.com/SnapPwd/snappwd-service#abuse-protection-and-rollout) covers what to configure before exposing an instance publicly.

## Features

- **Zero-Knowledge Architecture**: Encryption happens in the browser using the Web Crypto API (AES-GCM). The server never sees the key.
- **Secure Sharing**: Create one-time links for text secrets.
- **Minimalist**: Fast, simple UI focusing on speed and security.
- **No Build Step**: Pure static files. Modify and run instantly.

## Prerequisites

To run a full self-hosted instance, you need:

1. **SnapPwd Web** (This repo).
2. **[SnapPwd Service](https://github.com/SnapPwd/snappwd-service)** - The backend API.
3. **Redis** - For data storage.

## Development

Since this project uses vanilla HTML/JS, there is no build step or package installation required.

1. **Configure Environment**:
   Edit `env.js` and set `API_URL` to the API you want to use (see [Configuration](#configuration)).

2. **Serve the app**:
   You can use any static file server.
   ```bash
   # Using npx (Node.js)
   npx serve .

   # Or Python
   python3 -m http.server 3000
   ```

3. **Visit**: `http://localhost:3000`

## Configuration

Configuration is handled at runtime via `env.js`.

### Environment Variables (Docker)

When running via Docker, environment variables are injected into `env.js` at startup.

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | The public URL of your `snappwd-service` instance. | `http://localhost:8080` (set in `docker-compose.yml`) |

### Manual Configuration

If not using Docker, simply edit `env.js`:

```javascript
window.config = {
    API_URL: "https://api.your-snappwd-instance.com"
};
```

## Security Model

1. **Browser**: Generates a random AES encryption key.
2. **Encrypt**: Data is encrypted locally (Web Crypto API).
3. **Upload**: Only the *ciphertext* is sent to the API.
4. **Share**: The URL contains the `id` (path) and the `key` (hash fragment).
   - **Important**: Hash fragments (`#key=...`) are **never** sent to the server.

## License

[MIT](LICENSE)
