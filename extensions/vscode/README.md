# VibeDrift Tracker for VS Code

**Track your AI prompt count per commit and detect vibe drift in real time.**

## Features

- **Real-time drift scoring** — see your current drift level in the status bar as you work
- **Commit tracking** — automatically counts AI prompts between commits
- **Drift detection** — alerts when you're drifting from your original intent
- **Dashboard integration** — syncs data with the VibeDrift web dashboard

## How it works

1. **Prompts are counted** — each Claude Code interaction increments your session counter
2. **Score is computed** — a drift score is calculated based on prompt count and activity
3. **Status bar updates** — your current drift level is displayed in the VS Code status bar
4. **Reset on commit** — the counter resets when you commit, starting a fresh cycle

## Drift levels

| Level | Prompts | Meaning |
|-------|---------|---------|
| Low | 1–5 | On track, focused work |
| Moderate | 6–15 | Starting to explore, stay aware |
| High | 16–30 | Significant drift, consider committing |
| Vibe Drift | 30+ | Feature creep likely, time to refocus |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `vibedrift.apiUrl` | `http://localhost:3000` | URL of the VibeDrift dashboard API |
| `vibedrift.apiKey` | `""` | API key for authentication (optional) |
| `vibedrift.enabled` | `true` | Enable automatic commit tracking |

## Getting started

1. **Install** — install the `.vsix` extension or get it from the marketplace
2. **Configure** — set `vibedrift.apiUrl` to point to your VibeDrift dashboard
3. **Code** — start working and watch your drift score in the status bar
