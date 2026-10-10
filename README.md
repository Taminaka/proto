# Tamaka frontend

Next.js frontend for Tamaka, deployed independently from the Spring Boot API.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

The local default is `http://localhost:3000`. Configure:

```text
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Render deployment

Create a Render Blueprint from this repository using `render.yaml`, or create a Docker web service manually:

- Dockerfile: `./Dockerfile`
- Docker context: `.`
- Health check: `/`
- Custom domain: `proto.taminaka.com`
- `NEXT_PUBLIC_API_URL`: `https://proto-api.taminaka.com/api`

Authenticated users can edit their name, phone, address, and profile photo from
the account menu. Profile uploads use the backend's Cloudflare R2 storage
configuration.

The API is maintained in the separate `tamaka-backend` repository.
