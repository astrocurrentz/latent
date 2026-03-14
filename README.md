# Latent

After the collapse of the AI systems, most digital images became unreadable.

The networks survived.
The formats did not.

The models that once decoded images are gone, leaving behind vast archives of data that no machine can interpret.

To record new memories, survivors began using simple devices known as **Latent Machines**.

A Latent Machine does not store photos instantly.
Instead, it writes images slowly onto a **Latent Card**.

Each card holds a fixed number of frames.

Until the final frame is recorded, the images inside cannot be viewed.

A common card holds **24 frames**.
Only after the 24th photograph does the machine unlock the card and reveal the images.

Some cards pass between machines.
Different survivors may write different frames into the same sequence.

No one knows what the card contains until it is complete.

Some engineers also build rare optical modules called **Latent Lenses**.

Unlike the filters of the old world, these lenses alter light physically before it reaches the sensor.
They cannot be copied digitally.

They must be carried.

In a world where the past became unreadable, Latent Machines record memory the only reliable way left.

Slowly.

One frame at a time.

## Implementation Status (v1 scaffold)

This repository now contains the iOS-first Latent v1 scaffold:

- Next.js 16 + React 19 + TypeScript App Router frontend
- Capacitor 8 configuration and iOS native plugin skeleton (`AVFoundation` + `CoreImage`)
- Latent Card lifecycle APIs (`create`, `join`, `capture`, `develop`, `reveal`)
- Shared-card invite flow (`deep link + code`)
- Lens entitlement + purchase application API contracts
- One-time starter inventory + paid consumable card logic
- Localization (`en`, `zh-Hans`, `zh-Hant`) with OpenCC fallback for missing `zh-Hant` keys
- Supabase SQL migration with schema, transactional RPCs, and RLS policies
- Unit, integration, and e2e test suites

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Configure environment.

```bash
cp .env.example .env.local
```

3. Run the app.

```bash
npm run dev
```

4. Run tests.

```bash
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Capacitor Release Web Assets

The `out/` directory must contain a real static export before running release sync.

Use:

```bash
npm run build:web:export
npm run cap:sync:release
```

Notes:
- `build:web:export` performs an export-safe build and verifies `out/index.html` is not the placeholder.
- For static-exported clients, set `NEXT_PUBLIC_API_BASE_URL` to your deployed API origin so app requests are routed correctly.

## iOS Workflows (No Stale Bundle Drift)

Use one of these commands to avoid simulator/app stale-web-asset mismatch:

```bash
# Development (live reload, no export/sync loop)
npm run ios:dev

# Release-style local run (always rebuild + sync first)
npm run ios:run
```

Details:
- `ios:dev` launches iOS with Capacitor live reload on `http://127.0.0.1:3000` and keeps the dev server process alive.
- `ios:run` always rebuilds `out/` and syncs before deploying, so the app cannot run an outdated export by mistake.
- Both commands auto-target the booted simulator when available. You can override with `IOS_TARGET=<udid>`.

## Supabase Setup

- Apply SQL in `supabase/migrations/0001_latent_init.sql`.
- The API layer auto-switches:
  - Uses Supabase-backed store when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.
  - Falls back to in-memory store for local development if env vars are missing.

## iOS Native Plugin Notes

Native plugin source is in:

- `ios/App/App/Plugins/LatentCameraPlugin.swift`
- `ios/App/App/Plugins/LatentCameraImplementation.swift`
- `ios/App/App/Plugins/LatentLensProcessor.swift`

This scaffold includes capture and lens processing contracts. Register the plugin in your Capacitor iOS project during native app integration.
