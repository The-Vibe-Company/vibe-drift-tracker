# Release Process

## How it works

We use [release-please](https://github.com/googleapis/release-please) with a **single root package** config. Any commit merged to `main` triggers release-please to open (or update) a release PR that bumps all packages together.

### Flow

1. Merge a PR to `main`
2. Release-please automatically opens/updates a PR titled `chore(main): release X.Y.Z`
3. That PR bumps versions in `package.json` (root + `shared`) and updates `CHANGELOG.md`
4. When you merge the release PR, the `publish` job publishes to npm:
   - `vibedrift-shared`

### Key files

- `release-please-config.json` — config (single root package + `extra-files` to sync sub-package versions)
- `.release-please-manifest.json` — current version
- `.github/workflows/release.yml` — CI workflow

### Commit convention

Release-please uses [Conventional Commits](https://www.conventionalcommits.org/) to determine version bumps:

- `fix:` → patch (0.0.X)
- `feat:` → minor (0.X.0)
- `feat!:` or `BREAKING CHANGE:` → major (X.0.0)
- `chore:`, `docs:`, `refactor:` → no version bump (but included in changelog)

## Local development

```bash
# Install deps
pnpm install

# Run the web app (Next.js)
pnpm dev --filter vibedrift-app

# Build all packages
pnpm build

# Build only publishable packages (what CI does)
pnpm turbo build --filter=vibedrift-shared
```

### Environment variables (web app)

Create `app/.env` with:

```
DATABASE_URL=<neon-postgres-url>
NEON_AUTH_BASE_URL=<neon-auth-url>
NEON_AUTH_COOKIE_SECRET=<random-secret>
```
