# Streamfit Session Builder MVP

Single-screen Next.js MVP for generating one home workout session at a time from the provided Streamfit video taxonomy.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Canonical local taxonomy table plus derived runtime JSON

## Run locally

```bash
npm install
npm run import:videos
npm run dev
```

Production build:

```bash
npm run build
npm start
```

## Data flow

1. `npm run taxonomy:bootstrap` force-reseeds the canonical taxonomy table from `Resoruces/streamfit_video_taxonomy_autotagged.xlsx`
2. The canonical table lives in `data/video_taxonomy_ssot.csv`
3. `npm run taxonomy:build` reads that canonical table and builds `data/video_taxonomy_ssot.json`
4. `npm run taxonomy:build` also writes `data/video_taxonomy_validation_report.json`
5. `lib/videoRepository.ts` exposes the canonical runtime dataset to the app
6. `lib/sessionBuilder.ts` builds a deterministic session from those canonical records

## Single source of truth

- Human-editable canonical table: `data/video_taxonomy_ssot.csv`
- Runtime dataset for the app: `data/video_taxonomy_ssot.json`
- Validation output: `data/video_taxonomy_validation_report.json`

The app should be treated as reading the canonical local taxonomy, not the original workbook directly. The original workbook is now only a bootstrap source.
The runtime filter layer should not silently override title or equipment taxonomy at request time. Any taxonomy correction belongs in the canonical CSV plus the build-time validation pipeline.

## Rule engine modules

- `lib/filters.ts`: conservative safety, equipment, impact, and level filtering
- `lib/templates.ts`: duration and goal-based block templates
- `lib/scoring.ts`: readable weighted scoring and selection reasons
- `lib/ordering.ts`: movement flow and transition ordering
- `lib/prescriptions.ts`: simple human-readable work/rest/rep heuristics
- `lib/sessionBuilder.ts`: block-by-block assembly and final session shaping

## Future extension path

The code is already split so the local JSON repository can be replaced by a Supabase-backed implementation later.

Suggested next step:

1. Replace `createVideoRepository()` with a server-side Supabase implementation.
2. Keep the current generator pure and reusable.
3. Move generation to a server action or route only when the dataset grows beyond a comfortable client payload.
