# Contributing

ClimaScope is useful to someone else only when that person can run the briefing, reuse the ensemble, or correct it. Issues and pull requests from outside the maintainer are how that use becomes visible.

## Ways to take part

- Report a station whose name, elevation, or river series looks wrong.
- Add a reference place in `PRESETS` inside `src/lib/api.ts` when a region is missing.
- Extend the ensemble with another HighResMIP model and add a test in `test/outlook.test.ts`.
- Improve a figure so the baseline, the future decade, and the spread stay readable.

## Local check

```bash
npm install
npm test
npm run lint
npm run dev
```

The dev server listens on http://127.0.0.1:47231.

## Pull requests

Describe the coordinate or the model you checked, and what changed in the briefing. Keep the method honest: grid means, the 1991–2000 and 2041–2050 decades, and no claim that this replaces CMIP6 or an IPCC report.
