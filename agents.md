## Stack

- **Package manager**: pnpm (install deps, run scripts)
- **Framework**: React Router v8 (framework mode)
- **Deploy**: Cloudflare
- **UI**: shadcn + Base UI
- **Database**: Neon (Postgres) + Drizzle ORM
- **Auth**: Better Auth

## Conventions

- Server code lives in `*.server.ts` files
- Use Drizzle schema in `app/db/schema.ts`
- Auth routes under `/api/auth/*`
- Use `pnpm` for all package and script commands (e.g. `pnpm install`, `pnpm dev`)
- Keep changes minimal and match existing patterns
- use getAppContext in actions/loaders to get any global bindings, like auth, db, env, cloudflare, ...
- Use layout routes in `app/routes.ts` for shared page chrome (navbar, footer, sidebars). Do not branch on `pathname` in `root.tsx` or elsewhere to decide which UI shell to show — wrap routes in the appropriate layout instead.

## Rules

- Whenever you introduce a change or feature that impacts all developers or project workflows, document it as a rule in agents.md. This ensures all team members are informed of global practices, standards, or requirements.
