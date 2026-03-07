# embed-kit

Normalized API across different embed sources (YouTube, Twitch, TikTok, and others).

## Setup

```bash
npm install
npm run build
```

## Scripts

- **`npm run build`** — Compile TypeScript to `dist/`
- **`npm run clean`** — Remove `dist/`

## Development

Source lives in `src/`. Import from subpaths: `embed-kit/base`, `embed-kit/youtube`, etc.

## Test pages

Each provider has its own test page in its package: `src/youtube/test.html`, `src/twitch/test.html`, etc. To run the test server (builds then serves):

```bash
npm run test
```

Open the URL shown (e.g. `http://localhost:3000/test/` for the index, or `http://localhost:3000/src/youtube/test.html` for YouTube).
