# WhatsApp Manager

This project provides a web-based interface for managing WhatsApp sessions using Node.js and Next.js. It relies on Docker for quick setup.

## Prerequisites

- **Docker** and **Docker Compose**
- **Node.js 18+**
- **Git**

Ensure these are installed before continuing.

## Quick Start

```bash
# clone the repository
git clone <repository-url>
cd whatsapp-manager

# install dependencies
npm install

# start the development server
npm run dev
```

### Production

For a production build you can use Docker:

```bash
docker-compose up --build -d
```
The compose file uses the `Dockerfile` in the repository root to build the image.

**Security notice:** The `.env.example` file ships with placeholder credentials
(`ADMIN_USERNAME=admin` and `ADMIN_PASSWORD=admin123`). Be sure to change these
values in your `.env` before deploying.

By default the Nginx container binds to ports `80` and `443`. You can override
these using the `HTTP_PORT` and `HTTPS_PORT` environment variables when starting
the stack. This is handy when another web server already occupies the default
ports.

```bash
HTTP_PORT=8080 HTTPS_PORT=8443 docker-compose up -d
```
The application will then be served through Nginx on `http://localhost:8080` (or
`https://localhost:8443` when HTTPS is configured).
Make sure the `data` and `logs` directories on the host are writable by UID 1001
(the user inside the container). Starting with the included installer this
ownership is adjusted automatically, but if you run the containers manually
you can fix the permissions with:

```bash
sudo chown -R 1001:1001 data logs
```

The application will be available on `http://localhost:3000`.

## Environment

The application relies on environment variables defined in `.env`.
Create this file by copying the provided example and then modify the values to suit your setup:

```bash
cp .env.example .env
# edit .env to customise the variables
```

Create a `.env` file and provide the required variables:

- `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- `DATABASE_PATH` (default: `./data/whatsapp_manager.db`)
- `JWT_SECRET`

Additional options such as `PORT`, `HOST`, and WebSocket settings can also be set:

- `ENABLE_WEBSOCKET` (default: `false`)
- `WEBSOCKET_PORT` – port for the WebSocket server (default: `3001`)
- `NEXT_PUBLIC_WEBSOCKET_URL` – URL clients should use to connect, e.g.
  `ws://localhost:3001` or `wss://example.com/ws`
- `FRONTEND_URL` – allowed frontend origin for WebSocket connections

To allow cross-origin requests, set `CORS_ORIGIN` to a comma-separated list of allowed origins (e.g. `https://example.com,http://localhost:3000`).
If left unset, only same-origin requests are permitted.

- `DEBUG_ROUTES` (default: `false`) enables debug-only API endpoints. Avoid
  enabling this in production.

## WebSocket support

To broadcast real-time events you can enable the optional WebSocket server. Set
`ENABLE_WEBSOCKET=true` in your `.env` file and adjust the related variables:

- `WEBSOCKET_PORT` – port for the WebSocket server (default: `3001`)
- `NEXT_PUBLIC_WEBSOCKET_URL` – URL clients should use to connect, e.g.
  `ws://localhost:3001` or `wss://example.com/ws`

Start the server separately with:

```bash
node websocket-server.js
```

For process management you can also use PM2 with the provided
`ecosystem.config.js`:

```bash
pm2 start ecosystem.config.js
```

## CLI installation

The repository includes a helper CLI script called `wa-manager.sh`.

To use it globally, copy the script into your `PATH` and make it executable:

```bash
sudo cp wa-manager.sh /usr/local/bin/wa-manager
sudo chmod +x /usr/local/bin/wa-manager
```

After this you can run `wa-manager` from anywhere or execute the script directly with `./wa-manager.sh`.

## Managing the service

Use the CLI to control the Docker service:

```bash
wa-manager start   # start containers
wa-manager stop    # stop containers
wa-manager status  # check status
```

For production with SSL certificates run `wa-manager install full`. If you simply press **Enter** when asked, the default domain `wa-api.developments.world` and email `info@wa-api.developments.world` will be used. The CLI sets up Nginx and obtains Let's Encrypt certificates automatically. If you already have certificates, place them in `ssl/live/<your-domain>/` and adjust `nginx-ssl.conf` as needed.

## Running tests

Install dependencies and run the test suite:

```bash
npm install
npm test
```

## Development login test

The repository includes a small component `components/login-test.tsx` for
verifying the authentication flow during development. It automatically returns
`null` when `NODE_ENV` is `production` so it won't appear in the production UI.
Import and use this component only when debugging login issues locally.

## Generating SSL certificates

Use Certbot to create the TLS certificate files expected by the Nginx configuration:

```bash
sudo certbot certonly --webroot -w ./certbot-webroot -d wa-api.developments.world
mkdir -p ssl/live/wa-api.developments.world
cp -L /etc/letsencrypt/live/wa-api.developments.world/fullchain.pem ssl/live/wa-api.developments.world/
cp -L /etc/letsencrypt/live/wa-api.developments.world/privkey.pem ssl/live/wa-api.developments.world/
```

These files are ignored by Git and required when running Nginx in production.

## License

MIT
