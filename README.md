# Fort Bend LGBTQIA+ Community Resources

A community-maintained website for sharing **LGBTQIA+ resources, events, and support** in Fort Bend County and nearby areas.

This is a **monorepo** (one repo with multiple apps):

- **Client**: React + Vite (deployed to Netlify)
- **Server**: Node.js + Express + MongoDB (deployed to Render)

The public site is **database-driven**: resources live in MongoDB and are served by the API.

---

## Project structure

```text
ftbend-community-resources/
  client/               # Frontend (React + Vite)
  server/               # Backend (Express + MongoDB)
  client/public/        # Static files served at the site root (favicons, images)
  netlify.toml          # Netlify build + proxy config
  render.yaml           # Render service config (optional)
```

---

## Quick start (local development)

### Prerequisites

- **Node.js** (current LTS recommended)
- A **MongoDB** connection string (Atlas is fine)

### Setup

From the repo root:

```bash
npm install
```

Create a root `.env` (you can copy `.env.example`):

```bash
npm run dev
```

This starts:

- Client: http://localhost:5173
- Server API: http://localhost:8080

In dev, the client proxies `/api/*` to the local server.

---

## Environment variables

These are read by the **server** (from the repo root `.env`).

### Required

- `MONGODB_URI` (recommended to include a database name like `ftbend`)

```text
mongodb+srv://<user>:<pass>@<cluster-host>/ftbend?retryWrites=true&w=majority&authSource=admin
```

- `JWT_SECRET` (a long random string)

### Optional

- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (used by the seed script)

---

## Common commands

Run all commands from the **repo root** unless noted.

```bash
npm run dev        # start client + server
npm run dev:client # start client only
npm run dev:server # start server only

npm run build      # build the client (Netlify runs this)
npm run start      # start the server (production)
```

---

## Admin dashboard (content management)

- Login: `/admin/login`

### Roles

- `admin`: can archive/unarchive resources
- `editor`: cannot archive/unarchive

### Create or reset an admin account

This repo includes a seed script that **upserts** an admin user:

```bash
SEED_ADMIN_EMAIL="you@example.com" SEED_ADMIN_PASSWORD="your-password" npm run seed --workspace server
```

---

## Data migration utilities

### Import the original static resource list into MongoDB

```bash
npm run migrate:resources --workspace server
```

---

## Deployments

### Frontend: Netlify

- Builds with: `npm run build --workspace client`
- Publishes: `client/dist`

Netlify also proxies API requests:

- `/api/*` → Render backend `/api/:splat`

See `netlify.toml`.

### Backend: Render

- Runs the Express server
- Connects to MongoDB using `MONGODB_URI`

**Important:** Make sure Render’s `MONGODB_URI` includes the correct database name (for example `/ftbend`).

---

## Troubleshooting

### “401 Unauthorized” on admin login

- Your deployed server is likely pointing at a different database than the one you seeded.
- Confirm Render `MONGODB_URI` matches your local one (including the database name).

### “400 Bad Request” when submitting a resource

- The API validates:
  - `name` (2–140 chars)
  - `url` (server will add `https://` if missing)

---

## Contributing

Non-technical help is welcome: submit links, report broken/outdated resources, and share feedback.

---