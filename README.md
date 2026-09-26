# Dexterous

Dexterous is a playful Pokémon field guide and trainer toolkit by Quantum Cupcake Creations.

It combines a National Pokédex browser with personal collection tracking, Pokémon GO companion tools, team planning, battle and raid sandboxes, event reminders, field notes, and cloud sync.

## What is inside

- National Pokédex browsing with region, type, rarity, search, and sorting controls
- Collection tracking for caught, seen, shiny, lucky, favourites, wishlists, trades, notes, nicknames, dates, locations, and quantities
- Pokémon GO CSV import plus a bulk box builder for adding several species at once
- Team Builder with shared weakness checks and type coverage
- 1v1 Battle Lab for lightweight base-stat and type-matchup comparisons
- Raid Lab for counter-type planning and team-readiness checks
- Official-event cards with local dates, source links, and calendar reminders
- Evolution families and condition notes
- Trainer profile, themes, display controls, badges, journal entries, goals, quizzes, backups, and collection sharing
- Offline-friendly shell and local guest storage
- Account signup, login, recovery, and cross-device collection sync

## Project structure

The frontend is plain HTML, CSS, and JavaScript modules. There is no frontend framework or bundler required for day-to-day development.

Key files:

- `index.html` — app shell
- `app.js` — interface and feature behaviour
- `style.css` — responsive visual system
- `lib/data.js` — Pokédex helpers and type-matchup utilities
- `lib/store.js` — local storage, account sessions, and cloud sync
- `data/catalog.json` — bundled Pokédex snapshot
- `sw.js` — offline cache
- `scripts/catalog.py` — catalog rebuild utility

## Cloud accounts

Production accounts use Supabase Auth and a row-level-secured `dexterous_field_guides` table.

The browser only receives the public Supabase project URL and publishable key. User collection rows are protected by database policies tied to the signed-in user ID.

Guest collections stay in IndexedDB on the current device until the user signs in or exports a backup.

## Running locally

Install the project dependencies:

```sh
npm install
```

Start the local app:

```sh
npm start
```

The production site is deployed from the `main` branch through Vercel.

## Pokémon GO companion

Dexterous does not request Pokémon GO credentials or access a live Pokémon GO inventory.

GO collection data is entered by the user through the bulk picker or CSV import. Event cards link back to official Pokémon GO pages so changing event details can be checked at the source.

Battle and raid tools are planning sandboxes. They use the data available inside Dexterous and are not exact replacements for live-game damage or raid calculations.

## Data and artwork

Pokédex data and artwork are sourced from PokéAPI and its public data and sprite repositories.

Pokémon names, characters, and artwork belong to their respective rights holders. Dexterous is an independent fan project.
