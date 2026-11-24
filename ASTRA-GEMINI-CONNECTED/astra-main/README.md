# ASTRA — Your Personal Universe Explorer

ASTRA is an educational space-discovery platform created by **Ankit Das**. It brings together skywatching preparation, astronomy learning, curated explanations, interactive missions, and a workspace for sky photographs.

## Current project status

This repository contains a responsive frontend prototype with:

- A responsive landing page and custom ASTRA logo system.
- Space topic search with dedicated quick-discovery cards for the Sun, Jupiter, Moon and Orion Nebula.
- ASTRA AI chat connected to Gemini through a server-side API route when a valid server key is configured.
- Multiple conversations with New Chat, automatic local saving, history search, reopen, rename and delete.
- Chat history stored in the browser using IndexedDB. No account, Google login, GitHub login or Supabase authentication is required.
- A sky observation planner for location, date and local observation time. It currently stores planning choices only; it is not a live ephemeris or weather forecast.
- Interactive beginner astronomy missions and quizzes.
- Local image preview for Point & Discover. Remote image analysis is not connected.
- Creator attribution for Ankit Das.

## Important limitations

The Gemini API is called through a server-side `/api/astra` route. The API key is read from `GEMINI_API_KEY` on the server and is never included in browser code. Real-time sky positions, astronomy visibility forecasts and automatic celestial-object identification remain separate features and are not implied by the chat integration.

Chat history is stored locally in the current browser profile on the current device. It does not sync across devices or browsers. Clearing browser site data can remove saved conversations. Export/import backup is not implemented yet.

## Run locally

Requirements: Node.js 20.19+ or 22.12+ recommended.

1. Create a `.env.local` file in the same folder as `package.json`.
2. Add `GEMINI_API_KEY=your_key_here` to that file. Do not add a `VITE_` prefix. Never commit or share the key.
3. Install and run the app:

```bash
npm install
npm run dev
```

If the development server was already running when you created or changed `.env.local`, stop it with `Ctrl+C` and start it again so the server reloads the environment variable. The chat header reports whether the server detected the key; a successful response changes the status to `ASTRA ONLINE`.

Open the local URL printed by Vite.

## Quality checks

```bash
npm run lint
npm run test
npm run build
```

## Security notes

- Do not commit `.env` files, API keys, passwords, or private tokens.
- Keep any future AI provider credentials on a server-side endpoint.
- Request only the location precision needed for a feature.
- Do not upload user images to a third party without clear disclosure and consent.

## Creator

**Created by Ankit Das** — Founder & Creator of ASTRA.

## ASTRA update notes (24 Nov 2026)

- SKY NOW now uses Open-Meteo Geocoding for place suggestions and Open-Meteo Forecast for hourly local weather. A user must select a suggestion so the app has explicit coordinates. Weather is not the same as astronomical visibility; this UI labels that limitation.
- Discovery entries now expand into an in-page briefing and can navigate to related Space Explorer topics.
- Point & Discover now performs a small, local browser-side image inspection (dimensions and brightness sampling). It does **not** identify planets, stars or constellations and does not upload the image.
- ASTRA AI uses a server-side Gemini integration when configured. The API key is not bundled into frontend code.

External data services require an internet connection. If they are unavailable, the app displays an unavailable state rather than inventing results.


## Gemini chat integration

- Chat messages are sent to the same-origin `/api/astra` server route.
- The server reads `GEMINI_API_KEY` per request and calls the Gemini Developer API using `gemini-3.8-flash`.
- The API key must remain in `.env.local` or the hosting provider's server-side secret settings. Do not use `VITE_GEMINI_API_KEY`.
- The API key status indicator only confirms that the server can read a key; the first successful chat confirms that the provider call works.
- Point & Discover image recognition is not wired to this endpoint in this update.
