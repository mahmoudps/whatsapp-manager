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

The application relies on environment variables defined in `.env`.
Create this file by copying the provided example and then modify the values to suit your setup:

```bash
cp .env.example .env
# edit .env to customise the variables
```

## License

MIT
