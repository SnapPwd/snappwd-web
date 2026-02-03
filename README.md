# SnapPwd Self-Hosted Web

A minimal, static web frontend for self-hosting [SnapPwd](https://github.com/snappwd/snappwd). Built with Vite, React, TypeScript, and Tailwind CSS.

## Features

- Client-side encryption (AES-256-GCM)
- Text and File sharing
- Zero-knowledge architecture (server never sees the key)
- Simple Docker deployment

## Prerequisites

- Node.js 20+ (for development)
- Docker & Docker Compose (for deployment)
- A running instance of `snappwd-service`

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

   By default, it expects the API at `/api`. To proxy to a local backend running on port 8080, update `vite.config.ts` or set the env var:
   ```bash
   VITE_API_URL=http://localhost:8080 npm run dev
   ```

## Deployment with Docker

### 1. Build & Run
You can use the included `docker-compose.yml` to spin up the full stack (Web + API + Redis).

```bash
docker-compose up -d
```

### 2. Configuration
The frontend connects to the backend via `VITE_API_URL`. Since this is a static build, the URL is baked in at build time.

**To change the API URL:**
Rebuild the image with a build argument:

```bash
docker build --build-arg VITE_API_URL=https://api.yourdomain.com -t snappwd-web .
```

Or update the `docker-compose.yml`:

```yaml
services:
  web:
    build:
      context: .
      args:
        - VITE_API_URL=https://api.yourdomain.com
```

## Security

This application performs all encryption and decryption in the browser using the Web Crypto API. The encryption key is part of the URL hash fragment (`#id_key`) and is never sent to the server.
