# Wiring Assistant (v1)

Scans a frontend route or file to produce a wiring checklist: discovered API references, Next.js proxy route status, and backend controller route matches.

## Usage

By route:

```
npm run bot:wiring -- --route "/admin/salespeople"
npm run bot:wiring -- --route "/customers"
npm run bot:wiring -- --route "/"
```

By file:

```
npm run bot:wiring -- --file "03_frontend/app/admin/salespeople/page.tsx"
npm run bot:wiring -- --file "03_frontend/app/customers/page.tsx"
```

## What It Does

1. **Resolves the frontend page** from the route or file path
2. **Scans the page and sibling files** for API references (`/api/...`, `fetch()`, `apiFetch()`, `axios`)
3. **Checks Next.js proxy routes** — verifies `app/api/<endpoint>/route.ts` exists for each `/api/` reference
4. **Scans backend controllers** — builds a route map from `@Controller` / `@Get` / `@Post` / etc. decorators
5. **Matches proxy endpoints to backend routes** — flags missing links

## Verdict

- **GO** — frontend page found and all referenced `/api/*` proxy routes exist
- **NO_GO** — frontend page not found, or one or more proxy routes are missing

Backend route mismatches are listed as warnings but do not trigger NO_GO in v1.
