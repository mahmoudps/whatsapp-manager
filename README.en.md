# WhatsApp Manager

**Languages:** [English](README.en.md) | [العربية](README.md)

A comprehensive tool to manage multiple WhatsApp sessions through a web interface built with **Next.js** and **Node.js**. The project simplifies controlling several WhatsApp devices from a single dashboard and provides REST APIs with optional real-time broadcasting over WebSocket.

## Features
- Manage multiple WhatsApp sessions in one place
- Interactive interface built with Next.js and React
- REST API for devices and session management
- Easy to setup SQLite database
- Optional WebSocket server for real time updates
- CLI script for container management and system setup

### Screenshots
![Web UI](docs/images/web-ui.svg)
![CLI](docs/images/cli-example.svg)

## Prerequisites
- Node.js **20** or newer
- Docker and Docker Compose (for container usage)
- Git

## Local Development
```bash
# Clone the repository
git clone <repository-url>
cd whatsapp-manager

# Install dependencies without the bundled browser
PUPPETEER_SKIP_DOWNLOAD=1 npm install --ignore-scripts
# Afterwards you **must** rebuild `bcrypt` and `better-sqlite3`
npm run rebuild:native

# Start the development server
npm run dev
# Start the WebSocket server if needed
npm run ws
```

If you want to run the WebSocket server directly on the host (outside Docker) build it first:
```bash
npm run build:ws
node dist/websocket-server.js
```
You may include the `dist/` folder in distribution packages or automate the build during installation.

### Fetching the CSRF token
Before sending POST requests like login, first obtain a token from `GET /api/csrf-token` which returns:
```json
{ "csrfToken": "..." }
```
The route also sets a `_csrf` cookie that will be validated later. Pass the token via the `X-CSRF-Token` header when calling protected APIs.

### Installing Chrome for Puppeteer
When using `PUPPETEER_SKIP_DOWNLOAD=1` install a compatible browser manually:
```bash
npx puppeteer browsers install chrome
```
Or specify `PUPPETEER_EXECUTABLE_PATH`. Leaving it empty will download a compatible version at runtime.
#### Puppeteer troubleshooting
If the browser fails to start with `chrome_crashpad_handler: --database is required` set `PUPPETEER_ARGS=--disable-crashpad` in `.env`.

## Docker
To build a production ready image make sure the `data/` and `logs/` directories are writable by UID `1001` then run:
```bash
sudo chown -R 1001:1001 data logs
docker-compose up --build -d
```
This starts the application container with Nginx and the `start-production.sh` script which sets up the environment and launches the WebSocket server by default. Disable realtime broadcasting with `ENABLE_WEBSOCKET=false` in the environment file. Ensure the port defined in `WEBSOCKET_PORT` is free before starting or the script will exit.

## Environment variables
Copy the example file then edit sensitive values before running:
```bash
cp .env.example .env
```
Important variables:
- `ADMIN_USERNAME` and `ADMIN_PASSWORD`: dashboard credentials
- `JWT_SECRET`: token signing key
- `DATABASE_PATH`: database location
- `WHATSAPP_WEB_VERSION_URL`: HTML URL of the WhatsApp Web version
- `CORS_ORIGIN`: comma separated list of allowed origins **without spaces**
- `ENABLE_WEBSOCKET` and `WEBSOCKET_PORT`: enable the WebSocket server and port to use; the port must be available
- The rest are documented inside `.env.example`

After configuring the file run:
```bash
npm run setup
```
to initialize the database and create default values.

## CLI Script
`wa-manager.sh` provides quick commands to manage the service. After copying it to a suitable location:
```bash
sudo cp wa-manager.sh /usr/local/bin/wa-manager
sudo chmod +x /usr/local/bin/wa-manager
```
Before running commands ensure `data/` and `logs/` are writable by UID `1001`:
```bash
sudo chown -R 1001:1001 data logs
```
Main commands:
```bash
wa-manager start    # Start containers
wa-manager stop     # Stop them
wa-manager restart  # Restart the system
wa-manager status   # Show status
wa-manager install full  # Install with Nginx and SSL
wa-manager install pm2   # Install Node.js and PM2 to run directly on the host
```
During `wa-manager install full` you will be asked to set the admin username and password with default values offered. After installation (using `install cli` or `install full`) an auto completion file is created at `/etc/bash_completion.d/wa-manager`. Activate it without logging out using:
```bash
source /etc/bash_completion.d/wa-manager
```
> **Note:** the installer leaves `PUPPETEER_EXECUTABLE_PATH` and `PUPPETEER_ARGS` empty in `.env` so Puppeteer downloads Chromium automatically with default settings.

### Running via PM2
After installation manage the service with PM2. Again ensure `data/` and `logs/` are writable by UID `1001`:
```bash
sudo chown -R 1001:1001 data logs
```
```bash
pm2 status
pm2 logs
```
Use `wa-manager restart` to restart all containers and the WebSocket server if needed.

### Checking the WebSocket server
Verify the server is running by executing:
```bash
curl http://localhost:3000/api/socket/status
# or
curl http://localhost:3001/health
```
You should receive JSON containing the identifier `whatsapp-manager-ws`. When using Nginx or another reverse proxy forward the `/health` path to the WebSocket server to keep health checks working.
```nginx
location /health {
    proxy_pass http://localhost:3001/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Color customization
Base colors for light and dark mode live in `lib/theme.ts`. Modify them then run `npm run dev` or build the project to update `styles/themes/colors.css` via the Tailwind plugin.

## Updates and maintenance
After pulling updates from the repository run:
```bash
wa-manager rebuild
# or
npm run setup
```
This refreshes `.env` and ensures essential variables like `JWT_SECRET` exist.

## Running tests
```bash
cp .env.test .env
PUPPETEER_SKIP_DOWNLOAD=1 npm install --ignore-scripts
npm run rebuild:native
npm test
```
Some tests may require extra dependencies depending on the environment. Rebuild the `bcrypt` and `better-sqlite3` packages used in tests before running them.

## Linting
To run ESLint:
```bash
npm run lint
```
To automatically fix issues:
```bash
npm run lint:fix
```

## Troubleshooting
If SSL certificate generation fails during setup:
- Make sure the domain points to the correct server address
- Verify ports **80** and **443** are open in the firewall
- Run the installer with root privileges
- Check Certbot logs in `/var/log/letsencrypt` for details
- Try `certbot renew --dry-run` to test the settings

## License
[MIT](LICENSE)
