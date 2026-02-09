# Vibe Drift Tracker

**Track your AI interactions per commit. Detect drift before it derails your project.**

---

## What is Vibe Drift Tracker?

Vibe coding without feedback loops leads to chaos. You start with a clear goal, open Claude Code, and 47 prompts later you've refactored half the codebase and added three features nobody asked for.

Vibe Drift Tracker measures how many AI prompts go into each commit, how many lines of code each prompt produces, and whether your session is drifting from focused work into feature creep. Every commit gets a **drift score** and a **drift level**:

| Level        | Color  | Meaning                              |
|--------------|--------|--------------------------------------|
| **low**      | 🟢 Green  | Focused, on track                    |
| **moderate** | 🟡 Yellow | Starting to wander                   |
| **high**     | 🟠 Orange | Significant drift from original task |
| **vibe-drift** | 🔴 Red | You've lost the plot — time to reset |

---

## How It Works

1. You code with **Claude Code** as usual
2. You **commit** your changes
3. VibeDrift automatically captures metrics — prompts, lines changed, files touched — by parsing your Claude session logs
4. The **dashboard** shows your drift patterns over time

Data sources: the git post-commit hook or the VS Code extension sends a payload to the dashboard API on every commit. The payload includes git metadata (hash, author, branch, diff stats) and Claude Code session data (prompts, responses, tool calls) from the time window between your last two commits.

---

## Getting Started

### 1. Create an account

Go to your hosted VibeDrift dashboard and sign up. Authentication is handled via Neon Auth (passwordless).

### 2. Generate an API key

1. Navigate to **Dashboard → Settings**
2. Click **Generate API Key** and give it a name
3. Copy the key — it's only shown once

### 3. Install the VS Code extension

Install from the `.vsix` file:

```bash
# From the repo root
cd extensions/vscode
pnpm build && pnpm package
code --install-extension vibedrift-vscode-0.1.0.vsix
```

Then configure in VS Code settings (`settings.json`):

```json
{
  "vibedrift.apiUrl": "https://your-dashboard-url.com",
  "vibedrift.apiKey": "your-api-key",
  "vibedrift.enabled": true
}
```

| Setting              | Type    | Default                  | Description                          |
|----------------------|---------|--------------------------|--------------------------------------|
| `vibedrift.apiUrl`   | string  | `http://localhost:3000`  | URL of the VibeDrift dashboard API   |
| `vibedrift.apiKey`   | string  | `""`                     | API key for authentication           |
| `vibedrift.enabled`  | boolean | `true`                   | Enable automatic commit tracking     |

The extension activates automatically when a `.git` folder is detected in your workspace.

### 4. Alternative: Git hook (CLI)

If you prefer a standalone hook over the VS Code extension:

```bash
# Install the hook
pnpm vibedrift init --api-url https://your-dashboard-url.com

# Set your API key
export VIBEDRIFT_API_KEY="your-api-key"
```

The hook installs into `.git/hooks/post-commit` and runs automatically on every commit. If you already have a post-commit hook, VibeDrift chains with it — your existing hook is preserved.

To remove:

```bash
pnpm vibedrift uninstall
```

After each commit, you'll see a summary line in your terminal:

```
VibeDrift 0.73 (high) | 12 prompts, +147/-23 lines
```

---

## Dashboard

The web dashboard gives you a clear view of your AI-assisted development patterns:

- **Stats summary** — total commits, average drift score, total lines changed, total prompts
- **Commit table** — each commit with its drift badge (color-coded), prompt count, and line stats
- **Commit detail** — expand any commit to see the list of prompts sent, file changes, and session metadata
- **Filters** — filter by project and date range to focus on specific work periods

---

## Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Framework     | Next.js 15, React 19              |
| Database      | Neon PostgreSQL, Drizzle ORM      |
| Styling       | Tailwind CSS 4                    |
| Auth          | Neon Auth                         |
| Package mgr   | pnpm                             |
| Monorepo      | Turborepo                         |
| Bundler       | esbuild (CLI, hooks, extension)   |
| Language      | TypeScript 5.6                    |

---

## Development

### Prerequisites

- Node.js
- pnpm 9+

### Setup

```bash
pnpm install
pnpm build
pnpm dev
```

The dashboard runs at `http://localhost:3000` with Turbopack.

### Project structure

```
vibedrift-tracker/
├── apps/web/              # Next.js dashboard (UI + API)
├── cli/                   # CLI tool (vibedrift init / uninstall)
├── extensions/vscode/     # VS Code extension
├── hooks/                 # Git post-commit hook binary
├── packages/shared/       # Shared types, scoring, Claude session parser
├── turbo.json
└── pnpm-workspace.yaml
```

### Key scripts

| Command          | Description                       |
|------------------|-----------------------------------|
| `pnpm dev`       | Start all packages in dev mode    |
| `pnpm build`     | Build all packages                |
| `pnpm lint`      | Lint all packages                 |
| `pnpm clean`     | Clean build artifacts             |
| `pnpm db:push`   | Push schema to database (web)     |
| `pnpm db:studio` | Open Drizzle Studio (web)         |

---

## License

TBD
