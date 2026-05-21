# Cosmos Explorer

An interactive astrophysics primer at roughly first-year-course depth. Eleven topics, all client-side, no external APIs:

HR Diagram · Stellar Sizes · Stellar Lifecycle · Nuclear Fusion · Spectral Classification · Cosmic Distance Ladder · Black Hole Anatomy · Galaxy Morphology · Big Bang Timeline · Exoplanet Detection · The Moon (phases, tides, eclipses)

**Live:** https://AndyFou.github.io/cosmos-explorer/

## Stack

- Vite + React (hooks: `useState`, `useEffect`, `useMemo`)
- Tailwind CSS v3
- lucide-react for icons
- Fraunces + JetBrains Mono via Google Fonts (loaded inline, no setup)

## Local development

```bash
npm install
npm run dev      # http://localhost:5173/cosmos-explorer/
npm run build    # outputs to dist/
```

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the site and publishes `dist/` to GitHub Pages.
