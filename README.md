# Vibe Drift Tracker

**Track your AI interactions per commit. Detect drift before it derails your project.**

You start with a clear goal, open Claude Code, and 47 prompts later you've refactored half the codebase and added three features nobody asked for. We've all been there.

Vibe Drift Tracker measures how many AI prompts go into each commit, how many lines each prompt produces, and whether your session is drifting from focused work into feature creep.

---

## How It Works

1. **Install the extension** — One click in VS Code or Cursor.
2. **Code with Claude** — Write code, ask questions, iterate. We silently count.
3. **See your drift live** — Watch your drift score update in real time as you code.
4. **Commit your work** — Every git commit saves a snapshot of your session.
5. **Track your history** — Prompts, lines changed, drift score — commit by commit.

VibeDrift calculates a drift score on every prompt and resets it to 0 after each commit. Under the hood, it parses Claude Code session logs from `~/.claude/projects/` and combines them with git metadata (diff stats, files changed, branch) to produce a per-commit analysis.

Every commit gets a **drift score** and a **drift level**:

| Level          | Score   | Meaning                              |
| -------------- | ------- | ------------------------------------ |
| **very-low**   | < 1.2   | Minimal interaction, on track        |
| **low**        | < 2.5   | Focused, on track                    |
| **moderate**   | < 4     | Starting to wander                   |
| **high**       | < 7     | Significant drift from original task |
| **vibe-drift** | 7+      | You've lost the plot — time to reset |

### Scoring

The drift score is based on two factors:

- **Prompt count** — more prompts per commit = more drift
- **Lines per prompt** — a high ratio (50+ lines/prompt) means productive work and lowers the score; a low ratio (< 5 lines/prompt) means you're spinning and raises it

One prompt is never penalized. The score roughly equals `prompts * efficiency_factor`, where the efficiency factor ranges from 0.7 (productive) to 1.5 (spinning).

A few things to note:

- Commits with 0 prompts are not counted in stats.
- A prompt that doesn't produce code doesn't produce drift.
