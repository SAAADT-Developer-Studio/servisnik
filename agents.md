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
