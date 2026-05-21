# Cosmos Explorer

An interactive astrophysics primer at roughly first-year-course depth. Eighteen topics, all client-side, no external APIs:

1. Observational Astronomy — constellations and how to look up
2. The Moon — phases, tides, eclipses
3. The Solar System — eight planets, rings, ice and rock
4. Stellar Size Comparison — Earth to hypergiant by orders of magnitude
5. How Telescopes See — light, resolution, detectors
6. Spectral Classification — reading the bar code of starlight
7. Hertzsprung–Russell Diagram — temperature, luminosity, stellar lives
8. The Stellar Lifecycle — how initial mass decides everything
9. Nuclear Fusion in Stars — the binding energy curve and burning chains
10. Orbits & Gravity — Kepler, Newton, and weird loops
11. Exoplanet Detection — transits, radial velocity, microlensing, imaging
12. The Cosmic Distance Ladder — measuring the universe step by step
13. Galaxy Morphology — the Hubble sequence and beyond
14. The Big Bang Timeline — Planck era to recombination, logarithmically
15. The Cosmic Microwave Background — a baby photo at 380,000 years
16. Anatomy of a Black Hole — horizons, photon spheres, Hawking evaporation
17. Special Relativity Essentials — the Lorentz factor and what it does
18. The Standard Model — the 17 particles that build everything

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
