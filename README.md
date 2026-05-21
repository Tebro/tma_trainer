# TMA Trainer

A browser-based training app that helps players learn Target Motion Analysis (TMA), passive sonar interpretation, contact management, and decision-making workflows used in modern submarine games.

The app is intended for simulation and game literacy. It should teach repeatable player workflows, explain what the game is likely modeling, and help users practice estimation under uncertainty without presenting real-world naval operations as authoritative doctrine.

## Documents

- [Product Plan](docs/product-plan.md): goals, audience, feature set, and MVP scope.
- [Curriculum And Scenarios](docs/curriculum-and-scenarios.md): learning path, drills, scenario design, and assessment model.
- [Technical Design](docs/technical-design.md): architecture, domain model, simulator components, and data storage.
- [Implementation Roadmap](docs/implementation-roadmap.md): milestones, risks, validation, and future expansion.
- [Agent Task Breakdown](docs/agent-task-breakdown.md): task IDs, dependencies, ownership boundaries, and acceptance criteria for parallel implementation.
- [Implementation Handoff Template](docs/implementation-handoff-template.md): reusable assignment template for developers and AI agents.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (20 or later)
- [pnpm](https://pnpm.io/)

### Install Dependencies

```bash
pnpm install
```

### Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173/` by default.

### Production Build

```bash
pnpm build
```

Output will be placed in the `dist/` directory.

### GitHub Pages Build

Build the app with the GitHub Pages base path and add an SPA fallback page:

```bash
pnpm build:pages
```

Preview the GitHub Pages build locally:

```bash
pnpm preview:pages
```

The default Pages base path is `/tma_trainer/`. If your GitHub repository has a different name, override it when building locally:

```bash
BASE_URL=/your-repo-name/ pnpm build:pages
```

### Type Checking

```bash
npx tsc --noEmit
```

### Verification

Run the full verification suite (lint, format check, tests, and build):

```bash
pnpm verify
```

Individual commands:

```bash
pnpm test          # Unit tests
pnpm test:watch    # Unit tests in watch mode
pnpm lint          # ESLint
pnpm format        # Auto-format with Prettier
pnpm format:check  # Check formatting without changing files
```

## GitHub Pages Deployment

This project deploys automatically through GitHub Actions using `.github/workflows/deploy.yml`.

One-time setup after creating the GitHub repository:

1. Push the project to GitHub on the `main` branch.
2. Open repository Settings > Pages.
3. Set Source to `GitHub Actions`.
4. Push future updates to `main`; the workflow will run `pnpm verify`, build with the repository base path, and publish `dist/`.

No committed `dist/` directory is required. The deployment workflow creates the production build and uploads it to GitHub Pages.

## Project Structure

```text
├── content/
│   ├── lessons/          # Lesson definitions
│   └── scenarios/        # Scenario data
├── docs/                 # Planning documents
├── src/
│   ├── app/              # App shell and routing
│   ├── components/       # Shared UI components
│   ├── simulation/       # Simulation core (geometry, tracks, observations, playback)
│   ├── lessons/          # Lesson engine and task logic
│   ├── scoring/          # Estimate and debrief scoring
│   ├── storage/          # Local persistence
│   └── styles/           # Global styles and design tokens
├── tests/                # Test suites
├── index.html            # Root HTML entry point
├── package.json
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite build configuration
```

## Tech Stack

- [React](https://react.dev/) — UI framework
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Vite](https://vitejs.dev/) — Build tool and dev server

## Product Direction

The first version should be a browser-based trainer with guided lessons, interactive plots, passive sonar exercises, and debriefs. It should teach the player how bearing-only information evolves over time, how ownship maneuvers improve a solution, how sensor confidence affects classification, and how to translate partial information into game decisions.

The core loop is:

1. Present a controlled tactical situation.
2. Let the user observe bearings, contact notes, and sonar cues over time.
3. Ask the user to estimate contact course, speed, range, and classification.
4. Let the user choose an ownship maneuver or observation plan.
5. Score the estimate and explain what changed.

## Initial Success Criteria

- A new player can complete the basic TMA path and explain why a single bearing is insufficient.
- An intermediate player can use maneuvers and time-separated bearings to improve a contact solution.
- A returning player can practice short drills without replaying long lessons.
- The app can model game-like uncertainty, imperfect contact classification, and noisy sensor cues.
- The content remains useful across multiple submarine games through configurable assumptions.
