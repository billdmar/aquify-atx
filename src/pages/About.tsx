// About — project description, team, stack, data sources, and disclaimer.

const STACK = [
  'React 19 + Vite 8 (TypeScript, strict)',
  'React Router v7',
  'Leaflet + react-leaflet (OpenStreetMap)',
  'Firebase Authentication + Firestore',
  'Open-Meteo weather API',
  'Tailwind CSS v4',
  'Vitest + React Testing Library',
]

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-aqua-800">About Aquify ATX</h1>

      <p className="mt-4 text-slate-700">
        Aquify ATX maps public water fountains and bottle-filling stations
        across Austin, Texas, and pairs them with a climate-aware hydration
        recommendation so you always know where to refill and how much to
        drink on a hot Central Texas day.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-aqua-700">The team</h2>
      <p className="mt-2 text-slate-700">
        Built by a 4-person cross-functional team at UT Austin, with William
        Mar serving as Lead Engineer — owning the data model, map experience,
        and the hydration recommendation engine.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-aqua-700">Tech stack</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {STACK.map((item) => (
          <li
            key={item}
            className="rounded-full bg-aqua-100 px-3 py-1 text-sm text-aqua-800"
          >
            {item}
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-lg font-semibold text-aqua-700">Data sources</h2>
      <ul className="mt-2 list-inside list-disc text-slate-700">
        <li>
          Fountain locations are community-seeded and stored in Firestore
          (with a committed local dataset of 30+ Austin locations).
        </li>
        <li>
          Live weather conditions come from the free, key-less{' '}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
            className="text-aqua-600 underline"
          >
            Open-Meteo
          </a>{' '}
          API.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold text-aqua-700">Disclaimer</h2>
      <p className="mt-2 text-sm text-slate-500">
        Fountain availability and status are crowd-sourced and may be
        inaccurate or out of date. The hydration recommendation is a rule-based
        guideline driven by weather data and is not medical advice.
      </p>
    </div>
  )
}
