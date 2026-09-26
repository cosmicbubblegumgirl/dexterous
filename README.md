# Dexterous

A Pokémon field guide for curious collectors, by Quantum Cupcake Creations.

## Frontend

Static ES modules, responsive CSS, a bundled species catalog, browser IndexedDB for guest records, and a service worker for previously loaded entries and assets. Publish the repository root with GitHub Pages. No frontend build is required.

Core tools include the complete 1,025-entry National Pokédex snapshot (Kanto through Paldea), regional and type filtering, collection flags and notes, shiny previews, evolution families and conditions, team coverage, comparison tables, GO CSV imports, wishlists, share links, goals, a field journal, calendar exports, quizzes, theme and accessibility controls, and portable backups.

## Backend

`npm install` then `npm start` runs the local server on port 4173 with SQLite. Account passwords use salted scrypt; sessions store only token hashes in the database. Account recovery uses a one-time recovery code; no verification or recovery email service is configured. Guest records are separate from cloud accounts.

### Deploy the app and backend to Vercel

Import this repository into Vercel with the repository root as the project root. The Vercel build script copies only frontend files into `dist`; `api/[...path].mjs` is deployed separately as a serverless function. Connect a Neon PostgreSQL database for Production, Preview, and Development. The backend accepts `DATABASE_URL`, `POSTGRES_URL`, and the Vercel Neon integration's prefixed `yuvertel_DATABASE_URL` or `yuvertel_POSTGRES_URL`. Vercel's `VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL` values are automatically allowed as same-origin hosts, so the app uses its Vercel origin for `/api` without a frontend build-time URL.

After logging into Vercel, linking the project, and connecting Neon, deploy with:

```sh
npm.cmd exec --yes --package=vercel -- vercel login
npm.cmd exec --yes --package=vercel -- vercel link
npm.cmd exec --yes --package=vercel -- vercel env add DATABASE_URL production
npm.cmd exec --yes --package=vercel -- vercel env add DATABASE_URL preview
npm.cmd exec --yes --package=vercel -- vercel env add DATABASE_URL development
npm.cmd exec --yes --package=vercel -- vercel --prod
```

Enter the Neon connection string at the CLI prompt; never commit it. Redeploy after changing environment variables. The production deployment URL serves both the frontend and account API.

For a separately hosted frontend, configure:

- `DATABASE_URL`: the server-only Neon database connection string.
- `ALLOWED_ORIGINS`: the exact frontend origin, such as `https://cosmicbubblegumgirl.github.io`.
Set `apiBase` in `config.js` to the deployed backend origin for that separate frontend. Never commit keys or database connection strings. The production backend does not fall back to an ephemeral local database. Database tables are created on first connection.

Until the backend is activated, the live Pages app clearly labels guest storage. Sign-up/login/recovery and cross-device storage are implemented but must be validated against the hosted service after provisioning.

`node scripts/check-backend.mjs` checks local account separation, login, session invalidation, storage revisions, origin checks and account recovery against an isolated temporary database.

## Pokémon GO

This is a manual companion, not an authorised GO account connector. CSV imports are reviewed by the user. It does not request Pokémon GO credentials, automate play, or access live inventories. Main-series stats are labelled separately from GO tracking.

## Data and artwork

Species data and artwork are from [PokéAPI](https://pokeapi.co) and its public [data repository](https://github.com/PokeAPI/pokeapi) and [sprites repository](https://github.com/PokeAPI/sprites). Pokémon and character artwork belong to their respective owners. This is an independent fan project. Cached API entries are refreshed after seven days. The bundled catalog is a snapshot and can be rebuilt using `scripts/catalog.py`.
