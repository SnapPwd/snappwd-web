# SnapPwd Self-Hosted Web

The official self-hosted web frontend for [SnapPwd](https://snappwd.io).

This is a lightweight, static Single Page Application (SPA) built with **zero-dependency HTML, CSS, and JavaScript**. It is designed to work with the [snappwd-service](https://github.com/SnapPwd/snappwd-service) backend.

## Features

- **Zero-Knowledge Architecture**: Encryption happens in the browser using the Web Crypto API (AES-GCM). The server never sees the key.
- **Secure Sharing**: Create one-time links for secrets and files.
- **Minimalist**: Fast, simple UI focusing on speed and security.
- **No Build Step**: Pure static files. Modify and run instantly.

## Prerequisites

To run a full self-hosted instance, you need:

1. **SnapPwd Web** (This repo).
2. **[SnapPwd Service](https://github.com/SnapPwd/snappwd-service)** - The backend API.
3. **Redis** - For data storage.

## Quick Start (Docker Compose)

The included `docker-compose.yml` is configured to build the backend service from a **sibling directory**.

1. **Clone both repositories**:
   ```bash
   # Create a folder for the project
   mkdir snappwd-selfhosted && cd snappwd-selfhosted

   # Clone the frontend (this repo)
   git clone https://github.com/SnapPwd/snappwd-web.git

   # Clone the backend (sibling)
   git clone https://github.com/SnapPwd/snappwd-service.git
   ```

   Structure:
   ```
   snappwd-selfhosted/
   ├── snappwd-web/
   └── snappwd-service/
   ```

2. **Start the stack**:
   ```bash
   cd snappwd-web
   docker compose up -d
   ```

Access the app at `http://localhost:3000`.

## Development

Since this project uses vanilla HTML/JS, there is no build step or package installation required.

1. **Configure Environment**:
   Copy the example config and adjust the API URL if needed.
   ```bash
   cp env.js.example env.js
   ```

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
| `API_URL` | The public URL of your `snappwd-service` instance. | `http://localhost:8080` (in `env.js.example`) |

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

MIT
