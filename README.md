# Crédito Proximidad Frontend

Spanish-language web application for an academic commercial credit project. Store admins use it for product and stock management, customer credit files, the point of sale, financing simulation, statements, collections and reports. It also provides global store administration and a customer account portal.

## Stack and structure

Angular 22, TypeScript, Angular Material, RxJS and Zod. Vitest covers unit tests and Playwright covers integrated browser flows. The application calls the [Spring Boot backend](https://github.com/finanzas-g5-2620/credito-proximidad-backend) through `/api/v1`. Nginx serves the production build and forwards API requests on the same origin.

| Path | Responsibility |
| --- | --- |
| `src/app/` | Feature modules for identity, catalog, credit, finance, sales, statements and analytics |
| `src/app/shared/` | Shared UI, HTTP infrastructure and domain utilities |
| `public/`, `src/styles.scss` | Brand assets and application theme |
| `e2e/`, `docs/` | Browser tests and technical documentation |

Features separate presentation, application, domain and infrastructure code where appropriate. The backend owns financial calculations, authorization and persistence.

## Run locally

Check out both repositories as siblings. From the **backend** directory, start the integrated stack:

```sh
docker compose up -d --build --wait
```

Open the [application](http://localhost:4200). For frontend development, use Node.js 24.15 or later in the 24.x line and npm 12, then run `npm ci` and `npm start` here. The development proxy expects a backend reachable at `http://localhost:8081`. Adjust `proxy.conf.json` and the dev server port if you are using the Docker stack as the API origin.

## Deploy

Keep both repositories on the deployment host, or set `FRONTEND_CONTEXT` to this checkout. Configure `.env.deploy` in the backend directory, then run there:

```sh
docker compose --env-file .env.deploy -f docker-compose.yml -f docker-compose.deploy.yml up -d --build --wait
```

The frontend Dockerfile builds Angular in Node and serves the result with Nginx on container port 80. The Compose stack handles routing and the backend connection. Follow the [backend deployment guide](https://github.com/finanzas-g5-2620/credito-proximidad-backend/blob/main/docs/deployment.md) for secrets, demo data and HTTPS.

## Checks and documentation

Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`. To run `npm run e2e`, use an isolated Docker stack with the demo clock enabled and point `E2E_BASE_URL` to it. See the [technical documentation](docs/README.md) for the API contract and the end-to-end setup.

## License

[MIT](LICENSE).
