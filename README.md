# Aquify ATX 💧

> Full-stack web app mapping 30+ public water fountains across Austin, TX, with Firebase auth, Firestore, and a climate-driven hydration recommendation engine.

![CI](https://github.com/billdmar/aquify-atx/actions/workflows/ci.yml/badge.svg)

Aquify ATX helps Austinites find the nearest public drinking fountain or
bottle-filling station and tells them how much water to drink based on live
Central Texas weather. Built by a 4-person cross-functional UT Austin team;
William Mar served as Lead Engineer (data model, map experience, and the
hydration recommendation engine).

---

## Features

- **Interactive map** (Leaflet + OpenStreetMap) of 30+ real Austin fountains, color-coded by type, with detail popups.
- **List + filter view** — filter by type, ADA accessibility, active status, text search, and distance radius; "Near me" geolocation.
- **Firebase Authentication** — email/password + Google sign-in.
- **Firestore** — community fountain submissions and star-rated reviews, protected by committed security rules.
- **Hydration recommendation engine** — a transparent, rule-based model driven by live Open-Meteo weather (temperature, heat index, UV, humidity) that recommends daily water intake and the 3 nearest fountains.
- **Mobile-responsive**, accessible UI.

> **Demo mode:** the app runs without any Firebase credentials — it falls back
> to the committed local seed data (`src/data/fountains.json`) so the map,
> list, filters, and hydration engine all work out of the box. Auth,
> submissions, and reviews activate once you add your Firebase config.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + Vite, React Router v6, JavaScript |
| Styling | Tailwind CSS v4 |
| Map | Leaflet + react-leaflet (OpenStreetMap tiles, no API key) |
| Auth / DB | Firebase Authentication + Cloud Firestore (v9 modular SDK) |
| Weather | Open-Meteo API (free, key-less) |
| Tests | Vitest + React Testing Library |
| Hosting | Firebase Hosting (Vercel works too) |
| CI | GitHub Actions (lint + build + test) |

---

## Quickstart

```bash
git clone https://github.com/billdmar/aquify-atx.git
cd aquify-atx
npm install
npm run dev        # runs in demo mode with local seed data
```

Open http://localhost:5173.

### Enabling Firebase (optional)

1. Create a Firebase project, enable **Authentication** (Email/Password + Google) and **Firestore**.
2. Copy the config into a local env file:
   ```bash
   cp .env.example .env
   # fill in the VITE_FIREBASE_* values from your Firebase project settings
   ```
3. Seed the fountain data (needs a service-account key):
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json npm run seed
   ```
4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

`.env` and any `*serviceAccount*.json` are gitignored — **no secrets are ever committed.**

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest (watch) |
| `npm run test:run` | Vitest (single run, used in CI) |
| `npm run seed` | Seed Firestore from `src/data/fountains.json` |

---

## Hydration recommendation model

A transparent, rule-based engine (`src/recommend/hydroEngine.js`) — not a black box:

| Condition | Effect |
|-----------|--------|
| Baseline | 8 cups (≈1.9 L) / day |
| Temperature > 90°F | +1 cup |
| Heat index > 100°F | +1 cup |
| UV index ≥ 6 | +1 cup |
| Humidity < 30% | +0.5 cup |
| Planning to exercise | +1 cup |

Live conditions come from Open-Meteo for downtown Austin; if the API is
unavailable, the engine falls back to documented warm-season averages. The
recommendation names the specific factors that raised it and is **not medical
advice**.

---

## Firestore data model & security

```
/fountains/{id}     public read; writes only via the Admin SDK seed script
/submissions/{id}   public read; create if authed; update/delete by owner only
/reviews/{id}       public read; create if authed; update/delete by owner only
/users/{uid}        read/write by that user only
```

Rules live in `firestore.rules` (committed verbatim).

---

## Deployment

```bash
npm run build
firebase deploy        # serves dist/ from Firebase Hosting
```

Alternatively deploy `dist/` to Vercel or any static host (SPA rewrite to
`index.html` is configured in `firebase.json`).

---

## Project structure

```
aquify-atx/
├── src/
│   ├── components/   Map, FountainList, FountainCard, FilterBar, ReviewModal, NavBar, PrivateRoute
│   ├── context/      AuthContext, FountainContext
│   ├── lib/          firebase, auth, firestore, geo (Haversine)
│   ├── pages/        Home, Login, Register, Profile, Submit, Recommend, About
│   ├── recommend/    hydroEngine + tests
│   └── data/         fountains.json (30+ Austin locations)
├── scripts/seed.js   Firestore seeder (Admin SDK)
├── firestore.rules   committed security rules
└── .github/workflows/ci.yml
```

---

## License

MIT © 2026 William Mar
