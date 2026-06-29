# Aquify ATX 💧

> Find every public water fountain in Austin — and get a personalized hydration recommendation powered by live Central Texas weather. **Live now.**

[![CI](https://github.com/billdmar/aquify-atx/actions/workflows/ci.yml/badge.svg)](https://github.com/billdmar/aquify-atx/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=for-the-badge)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=for-the-badge)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Auth+Firestore-FFCA28?logo=firebase&logoColor=black&style=for-the-badge)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)](https://tailwindcss.com)
[![Leaflet](https://img.shields.io/badge/Leaflet-OpenStreetMap-199900?logo=leaflet&logoColor=white&style=for-the-badge)](https://leafletjs.com)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Open_App-brightgreen?style=for-the-badge)](https://aquify-atx.vercel.app)

**🔗 Live Demo:** [aquify-atx.vercel.app](https://aquify-atx.vercel.app)

---

![Interactive Austin fountain map with color-coded markers and filter sidebar](docs/screenshots/map.png)

---

## 💡 Why I built this

Austin summers regularly clear 100 °F, and the city's trail network (Lady Bird Lake, the Greenbelt) is dotted with public fountains that aren't on any single map. I wanted one place to **find the nearest working fountain and know how much to actually drink** given the day's heat — and to build it the way I'd build a production feature, not a toy.

A few deliberate engineering bets:

- **Explainable over "AI magic."** The hydration recommendation is a transparent, rule-based engine (`src/recommend/hydroEngine.ts`) that *shows its work* — every cup it adds is tied to a named weather factor. An optional Gemini call enriches it, but the app is fully functional without it.
- **Secrets never reach the browser.** It's a static SPA, so the Gemini key lives only in a Vercel serverless function (`api/hydrate.ts`); the client just POSTs weather and gets back a validated payload, falling back to the rule engine on any failure.
- **Security as committed code.** Firestore rules (`firestore.rules`) — including field/length validation and owner-only writes — live in the repo and are reviewable, not hidden in a console.
- **Works with nothing configured.** A graceful "demo mode" runs the whole map, filters, and hydration engine offline on committed seed data, so the project is explorable in one `npm run dev` with no backend.

---

## ✨ Features

- **Interactive clustered map** — Leaflet + OpenStreetMap, 30+ real Austin fountain locations color-coded by type, grouped into count bubbles that expand as you zoom.
- **Filters + Near Me** — filter by type, ADA accessibility, active status, free-text search, and distance radius; one-tap geolocation.
- **Fountain detail pages** — every fountain has a shareable `/fountain/:id` URL with full info, directions, save, and its visible review list.
- **Firebase Auth** — email/password and Google sign-in, protected routes, per-user profile.
- **Community submissions & reviews** — authenticated users submit new fountains and leave star-rated reviews; validated, owner-scoped Firestore security rules.
- **Climate-driven hydration engine** — transparent rule-based model over live Open-Meteo data (temp, heat index, UV, humidity), with an optional Gemini AI second opinion via a server-side proxy.
- **Installable PWA** — offline-capable service worker caches the app shell, last-seen map tiles, and weather, for the no-signal trail.
- **Dark mode** — system-aware, one-tap toggle, persisted.
- **Type-safe & tested** — strict TypeScript end-to-end, 240+ Vitest tests with a CI coverage gate.

---

## 📸 Screenshots

<table>
<tr>
<td align="center" width="50%">

**Filterable fountain list**

![Filterable card grid of Austin fountains](docs/screenshots/list.png)

</td>
<td align="center" width="50%">

**Live hydration recommendation**

![Hydration panel showing 8 cups recommendation, real weather readout, and 3 nearest fountains with distances](docs/screenshots/hydration.png)

</td>
</tr>
</table>

<p align="center">
  <img src="docs/screenshots/mobile-map.png" width="280" alt="Mobile map view at 390px showing responsive layout" />
  <br/>
  <em>390 px mobile — same full feature set</em>
</p>

![About page](docs/screenshots/about.png)

---

## 🛠 Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + Vite 8, React Router v7, **TypeScript (strict)** |
| Styling | Tailwind CSS v4 |
| Map | Leaflet + react-leaflet (OpenStreetMap tiles — no API key) |
| Auth / DB | Firebase Authentication + Cloud Firestore (v9 modular SDK) |
| AI (optional) | Google Gemini via a Vercel serverless proxy (key never reaches the browser) |
| Weather | Open-Meteo API (free, key-less) |
| Tests | Vitest + React Testing Library · **211 passing tests** |
| CI | GitHub Actions — typecheck + lint + build + test on every push |
| Hosting | Firebase Hosting / Vercel |

---

## 🚀 Quickstart

```bash
git clone https://github.com/billdmar/aquify-atx.git
cd aquify-atx
npm install
npm run dev        # demo mode — no Firebase needed
```

Open [http://localhost:5173](http://localhost:5173). The map, filters, and hydration engine all work immediately on local seed data.

<details>
<summary><strong>Full Firebase setup (auth, live Firestore, community features)</strong></summary>

1. Create a Firebase project; enable **Authentication** (Email/Password + Google) and **Firestore**.
2. Copy the config into a local env file:
   ```bash
   cp .env.example .env
   # Fill in VITE_FIREBASE_* values from your Firebase project settings
   ```
3. Seed fountain data (requires a service-account key):
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json npm run seed
   ```
4. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

`.env` and all `*serviceAccount*.json` files are gitignored — **no secrets are ever committed.**

</details>

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint (zero warnings in CI) |
| `npm test` | Vitest watch mode |
| `npm run test:run` | Vitest single run (used in CI) |
| `npm run seed` | Seed Firestore from `src/data/fountains.json` |

---

## 💧 Hydration Recommendation Model

A transparent, rule-based engine in `src/recommend/hydroEngine.ts` — not a black box. Live conditions come from Open-Meteo for downtown Austin; the engine falls back to documented warm-season averages when the API is unavailable.

| Condition | Adjustment |
|-----------|-----------|
| Baseline | 8 cups (≈ 1.9 L) / day |
| Temperature > 90 °F | + 1 cup |
| Heat index > 100 °F | + 1 cup |
| UV index ≥ 6 | + 1 cup |
| Humidity < 30 % | + 0.5 cup |
| Planning to exercise | + 1 cup |

The recommendation surfaces the specific weather factors that raised it and names the 3 nearest open fountains with walking distances. **This is not medical advice.**

### 🤖 Gemini AI (optional enrichment)

On top of the deterministic engine, the page calls Google's **Gemini** (`gemini-2.0-flash`) for a friendly, Austin-specific hydration tip and a second-opinion cup count. Because Aquify is a **static site**, the API key must never reach the browser — so the call is proxied through a **Vercel serverless function** at [`api/hydrate.ts`](api/hydrate.ts):

- The client (`src/recommend/aiHydrate.ts`) POSTs the current weather to `/api/hydrate`.
- The function reads `GEMINI_API_KEY` from `process.env`, calls the Gemini REST API, validates the JSON, and returns `{ ok, cups, tip, source }`.
- If the key is missing or anything fails, the function returns `{ ok: false }` and the UI **silently falls back** to the rule-based result — the app works perfectly with or without AI.

**Setup:** set `GEMINI_API_KEY` in your Vercel project's Environment Variables (server-side only). Do **not** prefix it with `VITE_` — that would inline it into the public bundle. See [`.env.example`](.env.example).

---

## 🏗 Architecture & Project Structure

Data flows one way: external sources → an isolated I/O layer (`lib/` + `recommend/`) → React Context → stateless presentational components. The Gemini key never crosses into the browser — it stays behind the serverless proxy.

```mermaid
flowchart TD
    subgraph Browser["Browser (static SPA)"]
        Pages["Pages<br/>Home · FountainDetail · Recommend · …"]
        Ctx["Context<br/>AuthContext · FountainContext"]
        Lib["I/O layer<br/>lib/* · recommend/*"]
        Pages --> Ctx --> Lib
    end

    subgraph Vercel["Vercel"]
        Proxy["api/hydrate.ts<br/>(serverless Gemini proxy)"]
    end

    Lib -->|auth + data| Firebase[("Firebase<br/>Auth · Firestore")]
    Lib -->|weather| Meteo["Open-Meteo API"]
    Lib -->|"POST weather"| Proxy
    Proxy -->|"GEMINI_API_KEY<br/>(server-side only)"| Gemini["Google Gemini"]
    Firebase -.->|"committed,<br/>validated rules"| Rules["firestore.rules"]
```

```
aquify-atx/
├── src/
│   ├── types.ts      single-source domain model (Fountain, Review, …)
│   ├── components/   Map (+ FountainPopup), FountainList, FountainCard,
│   │                 FilterBar, ReviewModal, ReviewList, NavBar, PrivateRoute
│   ├── context/      AuthContext, FountainContext (memoized values)
│   ├── hooks/        useGeolocation
│   ├── lib/          firebase, auth, firestore, favorites, geo (Haversine),
│   │                 fountainTypes (shared labels/colors)
│   ├── pages/        Home, Login, Register, Profile, Submit, Recommend,
│   │                 FountainDetail, About
│   ├── recommend/    hydroEngine.ts (rule-based) + aiHydrate.ts (Gemini client)
│   └── data/         fountains.json (30+ Austin locations, seed source)
├── api/hydrate.ts    Vercel serverless Gemini proxy (key stays server-side)
├── scripts/seed.js   Firestore seeder (Admin SDK)
├── firestore.rules   committed, validated security rules
└── .github/workflows/ci.yml
```

**Testing:** 240+ passing Vitest + React Testing Library tests covering the hydration engine, Firestore helpers, hooks, component rendering, and filter logic, behind a CI coverage gate. **Strict TypeScript + ESLint clean.** GitHub Actions runs typecheck → lint → build → test (with coverage) on every push.

**Separation of concerns:** UI components are stateless and receive data via React Context; all Firebase and weather I/O is isolated in `src/lib/` and `src/recommend/`, making the core map and filter experience fully testable without mocking an entire backend.

---

## 🔒 Firestore Data Model & Security

```
/fountains/{id}     public read; writes only via Admin SDK seed script
/submissions/{id}   public read; create if authenticated; update/delete by owner only
/reviews/{id}       public read; create if authenticated; update/delete by owner only
/users/{uid}        read/write by that user only
```

Rules live in `firestore.rules` and are committed verbatim — the security model is auditable in the repo, not locked away in the Firebase console.

---

## 🌐 Deployment

**Vercel (recommended for demos):**
```bash
npm run build
# push to GitHub and connect repo in Vercel dashboard — zero config needed
```

**Firebase Hosting:**
```bash
npm run build
firebase deploy        # serves dist/ via Firebase CDN
```

SPA rewrite to `index.html` is already configured in `firebase.json`.

---

## License

MIT © 2026 William Mar
