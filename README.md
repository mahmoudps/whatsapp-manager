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

Install dependencies and execute Jest:

```bash
npm install
npx jest
```

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
