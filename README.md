# GTO Trainer

A browser-based 6-max No-Limit Hold'em training app built with Next.js, React, TypeScript, Tailwind CSS v4, and Zustand.

The app deals playable hands, runs automated villain actions, and gives simplified GTO-inspired feedback after each hero decision. It also tracks session stats and hand history in local storage.

## What It Does

- Runs a playable 6-max cash-game style training loop with rotating positions and 100bb stacks
- Deals full hands from preflop through showdown
- Supports hero actions including fold, check, call, bet, raise, and all-in sizing via presets and a slider
- Uses villain archetypes (`TAG`, `LAG`, `TIGHT_PASSIVE`, `LOOSE_PASSIVE`) with range-based preflop logic and heuristic postflop logic
- Evaluates hero decisions with immediate feedback based on position, initiative, board texture, SPR, hand category, and pot context
- Shows end-of-hand review with action log, showdown results, and decision feedback
- Persists session stats in the browser, including net BB, win rate, rating distribution, leak breakdown, and recent hand history

## Routes

- `/` - main trainer table and gameplay UI
- `/stats` - session statistics view

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Zustand for game and session state

## Getting Started

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Because `next.config.ts` sets `basePath` to `/Poker-GTO-Trainer`, open:

```text
http://localhost:3000/Poker-GTO-Trainer
```

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## How Gameplay Works

1. Start a hand from the main page.
2. The engine shuffles a deck, deals six players, posts blinds, and assigns positions.
3. Villains act automatically when it is not the hero's turn.
4. Each hero action is evaluated before the game advances.
5. Feedback is shown immediately, then play continues.
6. At hand completion, the app shows a review modal and updates session stats.

## Project Structure

```text
src/
  app/                 App Router pages and global styles
  components/          Table, action, feedback, stats, review, and UI components
  data/                Preflop ranges, scenario seeds, archetype profiles
  engine/              Game flow, betting, villain logic, hand classification, feedback
  hooks/               Auto-villain and session/stat hooks
  store/               Zustand stores for game and persisted session state
  types/               Shared poker/game/feedback/session types
  utils/               Deck, range parsing, card formatting, hand evaluation helpers
```

## Deployment

This project is configured for static export and GitHub Pages.

- `next.config.ts` uses `output: "export"`
- Assets are served from the `/Poker-GTO-Trainer` base path
- GitHub Actions builds the site and publishes the `out/` directory through `.github/workflows/deploy.yml`
- Live site: `https://harshu11-ai.github.io/Poker-GTO-Trainer/`

Pushes to `main` trigger deployment.

## Notes

- Session data is stored in browser `localStorage` under `gto-trainer-session`
- This trainer uses simplified, heuristic GTO-inspired logic rather than solver-accurate outputs
- There is currently no automated test suite in the repository
