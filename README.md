# embed-kit

Normalized API across different embed sources (YouTube, Twitch, TikTok, and others).

## Setup

When **developing** this package locally:

```bash
npm install
npm run build
```

When **installing as a dependency** (e.g. `"embed-kit": "github:ReactTV/embed-kit"`), `dist/` is committed so the package works without running a build. The `prepare` script also runs on install as a fallback.

## Scripts

- **`npm run build`** — Compile TypeScript to `dist/`
- **`prepare`** — Runs on `npm install`; builds the package so consumers get a working `dist/`
- **`npm run clean`** — Remove `dist/`

## Development

Source lives in `src/`. Import from subpaths: `embed-kit/base`, `embed-kit/youtube`, etc.

## Test pages

Each provider has its own test page in its package: `src/youtube/test.html`, `src/twitch/test.html`, etc. To run the test server (builds then serves):

```bash
npm run test
```

Open the URL shown (e.g. `http://localhost:3000/test/` for the index, or `http://localhost:3000/src/youtube/test.html` for YouTube).
