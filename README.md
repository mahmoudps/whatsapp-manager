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
The compose file uses the `Dockerfile` in the repository root to build the
image. The resulting `whatsapp-manager` container runs the `start-production.sh`
script, which launches the WebSocket server inside the same container when
`ENABLE_WEBSOCKET=true`.

Chromium and all required system libraries are downloaded automatically during
installation, so no additional `PUPPETEER_*` environment variables are required.

**Security notice:** The `.env.example` file ships with placeholder credentials
(`ADMIN_USERNAME=admin` and `ADMIN_PASSWORD=admin123`). Be sure to change these
values in your `.env` before deploying.

By default the Nginx container binds to ports `80` and `443`. You can override
these using the `HTTP_PORT` and `HTTPS_PORT` environment variables when starting
the stack. This is handy when another web server already occupies the default
ports.

The WebSocket server listens on port `3001`. The compose file now exposes this
port so you can connect directly if desired. Set `NEXT_PUBLIC_WEBSOCKET_URL`
to `ws://localhost:3001` for local setups or `wss://<your-domain>/ws` when using
Nginx as a reverse proxy.

When using the provided Nginx examples inside Docker, make sure the upstream
addresses target the `whatsapp-manager` service instead of `localhost`.

```bash
HTTP_PORT=8080 HTTPS_PORT=8443 docker-compose up -d
```
The application will then be served through Nginx on `http://localhost:8080` (or
`https://localhost:8443` when HTTPS is configured).
Nginx forwards requests to the `whatsapp-manager` service, so use
`http://whatsapp-manager` instead of `localhost` in any custom upstreams.
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

When running via Docker Compose the WebSocket server is started from within the
`whatsapp-manager` container whenever `ENABLE_WEBSOCKET=true`.
For local development you can launch it manually with:

```bash
node websocket-server.js
```
Before running this command make sure the project dependencies are installed:

```bash
npm install # or `pnpm install`
```
Docker builds run this step for you during `docker-compose up`, but if you start
the WebSocket server manually you need to install the packages yourself.

Make sure to install dependencies first:

```bash
npm install
```

For process management you can also use PM2 with the provided
`ecosystem.config.js`:

```bash
pm2 start ecosystem.config.js
```

The ecosystem file runs the main server and the standalone WebSocket
process. Make sure `NEXT_PUBLIC_WEBSOCKET_URL` in your `.env` reflects the
public address (for example `wss://example.com/ws`) so clients can connect
when running under PM2.

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

Install dependencies and run the test suite. The tests rely on dev
dependencies such as **Jest**, so be sure to install everything first.
Create a `.env.test` file based on the provided `.env.example` and adjust the
required variables (for example `JWT_SECRET` and the admin credentials):

```bash
cp .env.example .env.test
PUPPETEER_SKIP_DOWNLOAD=1 npm install --ignore-scripts
npm test
```

For automated environments you can also run:

```bash
npm run test:ci
```
which installs dependencies using `npm ci` before running Jest.

## External API

Set `EXTERNAL_API_KEY` in your `.env` file to enable programmatic access from
other projects. Use the `/api/external/send-message` endpoint to send WhatsApp
messages.

Example request:

```bash
curl -X POST http://localhost:3000/api/external/send-message \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: your-key' \
  -d '{"deviceId":1,"recipient":"+123456789","message":"Hello"}'
```

The endpoint returns a JSON object indicating success or failure.

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
