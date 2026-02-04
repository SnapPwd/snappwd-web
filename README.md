# SnapPwd Self-Hosted Web

The official self-hosted web frontend for [SnapPwd](https://snappwd.io).

This is a lightweight, static Single Page Application (SPA) built with Vite, React, and Tailwind CSS. It is designed to work with the [snappwd-service](https://github.com/SnapPwd/snappwd-service) backend.

## Features

- **Zero-Knowledge Architecture**: Encryption happens in the browser using the Web Crypto API (AES-GCM). The server never sees the key.
- **Secure Sharing**: Create one-time links for secrets and files.
- **Minimalist**: Fast, simple UI focusing on speed and security.

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

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the dev server**:
   ```bash
   # Point to your local API service
   VITE_API_URL=http://localhost:8080 npm run dev
   ```

## Configuration

The frontend is a static site. The API URL must be known at **build time** (baked into the JS bundle).

### Build Args

| Build Arg | Description | Default |
|-----------|-------------|---------|
| `VITE_API_URL` | The public URL of your `snappwd-service` instance. | `http://localhost:8080` |

```bash
docker build --build-arg VITE_API_URL=https://api.your-company.com -t snappwd-web .
```

## Security Model

1. **Browser**: Generates a random AES encryption key.
2. **Encrypt**: Data is encrypted locally (Web Crypto API).
3. **Upload**: Only the *ciphertext* is sent to the API.
4. **Share**: The URL contains the `id` (path) and the `key` (hash fragment).
   - **Important**: Hash fragments (`#key=...`) are **never** sent to the server.

## License

MIT
