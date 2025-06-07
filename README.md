# WhatsApp Manager

This project provides a web-based interface for managing WhatsApp sessions using Node.js and Next.js. It relies on Docker for quick setup.

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

Copy `.env.example` to `.env` and adjust values as needed before running the application.

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
