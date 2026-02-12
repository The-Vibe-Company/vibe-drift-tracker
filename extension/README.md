# VibeDrift Tracker for VS Code

**Your AI drift score, live in the status bar.**

You start with a clear goal, open Claude Code, and 47 prompts later you've refactored half the codebase and added three features nobody asked for.

VibeDrift watches your Claude Code sessions and shows a real-time drift score right in VS Code. The more you prompt without committing, the higher the score. Commit to reset, and keep your sessions focused.

---

## Getting Started

1. **Install** the extension from the marketplace.
2. **Create an account** on [vibedrift.dev](https://www.vibedrift.dev) and generate an API key in your dashboard settings.
3. **Set your API key** in VS Code settings (`vibedrift.apiKey`).
4. **Code with Claude** — your drift score appears in the status bar.

That's it. No config files, no CLI, no extra steps.

---

## What You See

### Status bar

A live drift score updates as you work:

```
$(pulse) VibeDrift: 0.0 (very-low)     — you just committed, fresh start
$(pulse) VibeDrift: 2.1 (low)          — focused work, on track
$(pulse) VibeDrift: 5.3 (high)         — drifting, consider committing
$(pulse) VibeDrift: 8.7 (vibe-drift)   — you've lost the plot
```

The score resets to 0 after every commit.

### Commit notifications

After each commit, a status bar message confirms the data was sent to your dashboard:

```
VibeDrift: commit sent (low)
```

---

## Drift Levels

| Level          | Score   | What it means                        |
| -------------- | ------- | ------------------------------------ |
| **very-low**   | < 1.2   | Minimal interaction, on track        |
| **low**        | < 2.5   | Focused, on track                    |
| **moderate**   | < 4     | Starting to wander                   |
| **high**       | < 7     | Significant drift from original task |
| **vibe-drift** | 7+      | Time to reset and refocus            |

The score is based on **prompt count** and **efficiency** (lines changed per prompt). More prompts = more drift. But if each prompt produces a lot of code, the score stays lower. One prompt is never penalized.

---

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `vibedrift.apiUrl` | `https://www.vibedrift.dev` | VibeDrift API URL |
| `vibedrift.apiKey` | — | Your API key (generate one in dashboard settings) |
| `vibedrift.enabled` | `true` | Enable or disable tracking |

---

## How It Works

The extension runs silently in the background:

1. **Watches Claude Code sessions** — reads session logs from `~/.claude/projects/` and counts prompts since your last commit.
2. **Tracks your code changes** — monitors `git diff` to know how many lines you've changed.
3. **Computes a live score** — combines prompt count and code output into a drift score, updated in real time.
4. **Sends data on commit** — when you commit, the full session snapshot (prompts, diff stats, drift score) is sent to your VibeDrift dashboard.

Works with VS Code and Cursor. Requires a git repository and Claude Code.
