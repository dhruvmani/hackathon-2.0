# Netflix Clone — Microservices Monorepo

Apollo Federation v2 GraphQL API with three subgraph services, an API gateway, MongoDB x3, and Redis.

## Architecture

```
gateway          :8080  — Apollo Gateway (IntrospectAndCompose)
user-service     :4001  — Auth, user profiles
movie-service    :4002  — Movies, banner uploads
review-service   :4003  — Reviews (federated onto Movie + User)
mongo-user       :27017
mongo-movie      :27018
mongo-review     :27019
redis            :6379  — Subgraph response caching

Observability
grafana          :3000  — Dashboards (admin/admin)
prometheus       :9090  — Metrics scraping
loki             :3100  — Log aggregation
tempo            :3200  — Distributed tracing (OTLP HTTP :4318)
```

## Prerequisites

- Docker Desktop 24+
- Copy `.env.example` to `.env` and set `JWT_SECRET`

```bash
cp .env.example .env
```

## Commands

### Dev

```bash
docker compose up --build
```

### Dev (detached)

```bash
docker compose up -d --build
```

### Prod

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

### Seed movies

```bash
docker compose exec movie-service node scripts/seed.js
```

### Tear down (removes volumes)

```bash
docker compose down -v
```

## GraphQL Endpoint

```
http://localhost:8080/graphql
```

## Health Checks

```
GET http://localhost:8080/health
GET http://localhost:4001/health
GET http://localhost:4002/health
GET http://localhost:4003/health
```

## Observability

| Tool       | URL                          | Credentials |
|------------|------------------------------|-------------|
| Grafana    | http://localhost:3000        | admin/admin |
| Prometheus | http://localhost:9090        | —           |
| Tempo      | http://localhost:3200/ready  | —           |
| Loki       | http://localhost:3100/ready  | —           |

Metrics are exposed at `/metrics` on each service. Logs ship to Loki via `winston-loki`. Traces go to Tempo via OTLP HTTP.

## Example Queries

**Register**
```graphql
mutation {
  register(name: "Jane Doe", email: "jane@example.com", password: "secret123") {
    token
    user { id name email }
  }
}
```

**List movies**
```graphql
query {
  movies(page: 1, limit: 10) {
    movies { id title genre releaseYear }
    total totalPages
  }
}
```

**Post a review** *(requires `Authorization: Bearer <token>` header)*
```graphql
mutation {
  postReview(movieId: "<id>", rating: 5, comment: "Incredible film.") {
    id rating comment createdAt
  }
}
```
