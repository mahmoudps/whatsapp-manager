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

Additional options such as `PORT`, `HOST`, and WebSocket settings can also be set.

- `DEBUG_ROUTES` (default: `false`) enables debug-only API endpoints. Avoid
  enabling this in production.

## CLI installation

The repository includes a helper CLI called `wa-manager`.

Run the installer with root privileges:

```bash
sudo ./install.sh
```

This copies `wa-manager.sh` to `/usr/local/bin/wa-manager` so it can be used from anywhere. If you prefer a manual install:

```bash
sudo cp wa-manager.sh /usr/local/bin/wa-manager
sudo chmod +x /usr/local/bin/wa-manager
```

## Managing the service

Use the CLI to control the Docker service:

```bash
wa-manager start   # start containers
wa-manager stop    # stop containers
wa-manager status  # check status
```

For production with SSL certificates run `wa-manager install full` and follow the prompts for your domain. The CLI sets up Nginx and obtains Let's Encrypt certificates automatically. If you already have certificates, place them in `ssl/live/<your-domain>/` and adjust `nginx-ssl.conf` as needed.

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
