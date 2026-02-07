## 📊 Project

**Vibe Drift Tracker** is a developer tool that measures and visualizes the number of AI interactions (Claude Code) per commit, helping developers detect when they're drifting from their original intent, doing feature creep, or losing efficiency in their AI-assisted workflow.

The tool focuses on:

- clear, actionable metrics per commit
- drift detection and feature creep alerts
- minimal friction integration into existing dev workflows
- clean, dashboard-style UI inspired by Linear/Vercel

Any code or feature added to the project must respect these principles.

---

## 🧭 Golden Rule

- **Every feature must serve one goal: helping the developer stay on track.** If a feature doesn't directly help the user understand their AI interaction patterns or improve their workflow, it doesn't belong here.

---

## 🎨 Design & UX

### Visual consistency

- Always respect:
  - the existing color palette (dark theme, minimal accent colors)
  - the existing typography
  - spacing, layout, and data visualization rhythm
- Do not introduce new styles without a clear and explicit reason.
- Reuse existing components whenever possible.

### Data visualization

- Charts and metrics must be **instantly readable**
  - no decoration for decoration's sake
  - labels, axes, and legends must be self-explanatory
  - use color purposefully (green = on track, amber = drifting, red = significant drift)
- Numbers and stats should always include context (trend, comparison, threshold)

### Buttons & interactions

- **All buttons must clearly look clickable**
  - default, hover, active, and disabled states
- No interactive element should look like static text.
- Clickable areas must be comfortable and accessible.

### User feedback

- Any meaningful action must provide clear feedback:
  - visual (loading state, active state, subtle animations)
  - or textual (message, tooltip, confirmation)
- Avoid silent actions.

---

## 🧱 Code & architecture

- Prioritize:
  - readability
  - simplicity
  - maintainability
- Avoid over-engineering.
- Code should remain understandable **months later without context**.

Before introducing an abstraction, always ask:

> "Is this truly necessary for Vibe Drift Tracker right now?"

**Irony clause:** This is a tool that detects feature creep. Do not feature-creep the tool itself.

---

## 🧪 Testing & verification

### Manual testing

- Use **agent-browser** ONLY IF RELEVANT to:
  - test pages in localhost
  - verify UI interactions
  - ensure charts render correctly with real and edge-case data
  - detect visual or UX inconsistencies

Testing must be done in a real browser, not only by reasoning about the code.

---

## 📚 Documentation & dependencies

- For any API, library, or framework:
  - use **Context7 MCP** to consult the official documentation
  - never guess an API
  - never invent options or parameters

If documentation is unclear:

> ask explicitly before implementing.

---

## 🔐 Security & credentials

- Never:
  - hardcode credentials
  - expose API keys client-side
- All sensitive information must be handled via:
  - environment variables
  - or an equivalent secure mechanism

Git tokens, API keys, or any auth mechanism:

> explicitly ask for the required credentials before proceeding.

---

## 🧠 Product philosophy

Vibe Drift Tracker exists because **vibe coding without feedback loops leads to chaos**. The tool must:

- make drift **visible** before it becomes a problem
- stay out of the developer's way (low friction, no config hell)
- present data honestly — no vanity metrics, no gamification traps
- help developers build better habits with AI, not shame them

Core metrics to track:

- number of Claude Code interactions per commit
- ratio of interactions to lines changed
- deviation from initial task scope
- session duration vs. output

Always prioritize:

- developer understanding of their own patterns
- actionable insights over raw data dumps
- consistency across the product

If a feature is "cool" but doesn't help the developer stay focused:

> it's drift. Don't add it.

---

## ❓ When in doubt

- Ask questions rather than assume.
- When relevant, propose multiple options with:
  - pros
  - cons
  - a clear recommendation.
