# UI Shell Drift Guardian

Scans `03_frontend` for pages that still contain mocked-UI or demo-mode markers. Prevents false claims that a screen is wired to real data when it is not.

## Detected Patterns

- `UI shell (mocked)`
- `logged-out demo mode`

## Usage

```
npm run bot:ui-drift
```

Exits **0** if clean, **1** if any drift is found.
