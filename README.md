# embed-kit

Normalized API across different embed sources (YouTube, Twitch, TikTok, and others). Includes custom elements per provider and a React wrapper (`ReactEmbedKit`).

## Install (GitHub Packages)

The package is published to GitHub Package Registry. Use the scoped name `@reacttv/embed-kit`.

1. **Authenticate** with GitHub Packages (one-time). Create a [Personal Access Token](https://github.com/settings/tokens) with `read:packages` (and `write:packages` if you will publish). Then:

   ```bash
   npm login --scope=@reacttv --registry=https://npm.pkg.github.com
   # Username: your GitHub username
   # Password: your PAT (not your GitHub password)
   # Email: your email
   ```

   Or add to your project or home `~/.npmrc` (never commit a real token):

   ```
   @reacttv:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
   ```

2. **Install** the package:

   ```bash
   npm install @reacttv/embed-kit
   ```

## Setup (developing this package)

When **developing** this package locally:

```bash
npm install
npm run build
```

The `prepare` script runs on install and builds `dist/` so consumers get a working build.

## Publishing (GitHub Packages)

- **From CI**: Push a tag (e.g. `v0.1.0`) or create a GitHub Release; the workflow in `.github/workflows/publish.yml` builds and runs `npm publish` to GitHub Package Registry.
- **Manually**: Ensure you’re logged in to the registry (`npm login --scope=@reacttv --registry=https://npm.pkg.github.com`), then run `npm run build` and `npm publish`.

## Scripts

- **`npm run build`** — Compile TypeScript to `dist/`
- **`prepare`** — Runs on `npm install`; builds the package so consumers get a working `dist/`
- **`npm run clean`** — Remove `dist/`

## Development

Source lives in `src/`. The build outputs to `dist/` with the same structure.

## Test pages

Each provider has its own test page in its package: `src/youtube/test.html`, `src/twitch/test.html`, etc. To run the test server (builds then serves):

```bash
npm run test
```

Open the URL shown (e.g. `http://localhost:3000/test/` for the index, or `http://localhost:3000/src/youtube/test.html` for YouTube).
