# Vibe Drift Tracker

**Track your AI interactions per commit. Detect drift before it derails your project.**

You start with a clear goal, open Claude Code, and 47 prompts later you've refactored half the codebase and added three features nobody asked for. Sound familiar?

Vibe Drift Tracker measures how many AI prompts go into each commit, how many lines each prompt produces, and whether your session is drifting from focused work into feature creep.

```
$ git commit -m "add user auth"

VibeDriftTracker — commit analysis
─────────────────────────────────
  Prompts used     12
  Lines changed    +147 / -23
  Drift score      0.73 ▲ high

⚠ You're drifting — scope expanded beyond initial task
  Scope: auth, middleware, database
```

---

## How It Works

```
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   Code with  │     │  Commit your │     │   VibeDrift   │     │  See your    │
  │  Claude Code │ ──▶ │    work      │ ──▶ │   analyzes    │ ──▶ │  drift       │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

On every `git commit`, VibeDrift parses your Claude Code session logs from `~/.claude/projects/` to extract the prompts, responses, and tool calls that happened since your last commit. It combines that with git metadata (diff stats, files changed, branch) and sends the whole payload to the dashboard API.

Every commit gets a **drift score** and a **drift level**:

| Level          | Score | Color  | Meaning                              |
| -------------- | ----- | ------ | ------------------------------------ |
| **low**        | 0–1   | green  | Focused, on track                    |
| **moderate**   | 1–3   | yellow | Starting to wander                   |
| **high**       | 3–6   | orange | Significant drift from original task |
| **vibe-drift** | 6+    | red    | You've lost the plot — time to reset |

### Scoring

The drift score is based on two factors:

- **Prompt count** — more prompts per commit = more drift
- **Lines per prompt** — a high ratio (50+ lines/prompt) means productive work and lowers the score; a low ratio (< 5 lines/prompt) means you're spinning and raises it

One prompt is never penalized. The score roughly equals `prompts * efficiency_factor`, where the efficiency factor ranges from 0.7 (productive) to 1.5 (spinning).

---

## Getting Started

### 1. Create an account

Go to your hosted VibeDrift dashboard and sign up. Authentication is handled via Neon Auth.

### 2. Generate an API key

1. Navigate to **Settings** in the dashboard
2. Click **Generate API Key** and give it a name
3. Copy the key — it's only shown once

### 3. Install the VS Code extension

```bash
cd extensions/vscode
pnpm build && pnpm package
code --install-extension vibedrift-vscode-0.1.0.vsix
```

Then add to your VS Code `settings.json`:

```json
{
  "vibedrift.apiUrl": "https://your-dashboard-url.com",
  "vibedrift.apiKey": "your-api-key"
}
```

| Setting             | Type    | Default                 | Description                        |
| ------------------- | ------- | ----------------------- | ---------------------------------- |
| `vibedrift.apiUrl`  | string  | `http://localhost:3000` | URL of the VibeDrift dashboard API |
| `vibedrift.apiKey`  | string  | `""`                    | API key for authentication         |
| `vibedrift.enabled` | boolean | `true`                  | Enable automatic commit tracking   |

The extension activates when a `.git` folder is detected. It also shows a **real-time drift score in the status bar** as you interact with Claude, before you even commit.

---

## Dashboard

The web dashboard gives you a clear view of your AI-assisted development patterns:

- **Stats summary** — total commits, average drift score, total lines changed, total prompts
- **Commit table** — sortable table with color-coded drift badges, prompt counts, and line stats
- **Commit detail** — expand any row to see the full list of prompts, file changes, and session metadata
- **Filters** — filter by project and date range

---

## Tech Stack

| Layer       | Technology                      |
| ----------- | ------------------------------- |
| Framework   | Next.js 15, React 19            |
| Database    | Neon PostgreSQL, Drizzle ORM    |
| Styling     | Tailwind CSS 4                  |
| Auth        | Neon Auth                       |
| Package mgr | pnpm                            |
| Monorepo    | Turborepo                       |
| Bundler     | esbuild (extension)             |
| Language    | TypeScript                      |

---

## Development

### Prerequisites

- Node.js 18+
- pnpm 9+

### Setup

```bash
pnpm install
pnpm build
pnpm dev
```

The dashboard runs at `http://localhost:3000` with Turbopack.

### Environment variables

The web app requires these environment variables (see `app/.env.example` if available):

| Variable              | Description                     |
| --------------------- | ------------------------------- |
| `DATABASE_URL`        | Neon PostgreSQL connection string |
| `DATABASE_AUTHENTICATED_URL` | Neon authenticated connection URL |

### Project structure

```
vibedrift-tracker/
├── app/                   # Next.js dashboard (UI + API routes)
├── extensions/vscode/     # VS Code extension (commit tracking + live status bar)
├── packages/shared/       # Shared types, scoring algorithm, Claude session parser
├── turbo.json
└── pnpm-workspace.yaml
```

### Key scripts

| Command          | Description                    |
| ---------------- | ------------------------------ |
| `pnpm dev`       | Start all packages in dev mode |
| `pnpm build`     | Build all packages             |
| `pnpm lint`      | Lint all packages              |
| `pnpm clean`     | Clean build artifacts          |
| `pnpm db:push`   | Push schema to database        |
| `pnpm db:studio` | Open Drizzle Studio            |

### API endpoints

| Method   | Path                   | Description                  |
| -------- | ---------------------- | ---------------------------- |
| `POST`   | `/api/commits`         | Submit a commit payload      |
| `GET`    | `/api/commits`         | Query commits (with filters) |
| `DELETE` | `/api/commits/[id]`    | Delete a commit              |
| `GET`    | `/api/projects`        | List user's projects         |
| `POST`   | `/api/api-keys`        | Generate an API key          |
| `DELETE` | `/api/api-keys/[id]`   | Delete an API key            |

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes
4. Run `pnpm build && pnpm lint` to verify
5. Open a pull request

---

## License

MIT
