# Beauty Nails Management System 💅

A full-featured salon management app built with **Next.js** (App Router), **Prisma** (Postgres), and **NextAuth.js** for authentication. This README is a concise guide for contributors who clone this repository and want to run the app locally.

---

## 🚀 Quick Start

1. Clone the repo:

```bash
git clone https://github.com/ZAWADI-25103/Beauty_Nails_Salon_System.git
cd Beauty_Nails_Salon_System
```

2. Install dependencies:

```bash
npm install
```

3. Create your local environment file (see **Environment** below):

```bash
touch .env
# then open .env and fill values
```

4. Prepare the database (see **Prisma & Postgres**):

```bash
# generate the client and apply migrations
npx prisma generate
npx prisma migrate dev --name init
# open Prisma Studio to inspect data
npx prisma studio
```

5. Start the app:

```bash
npm run dev
```

Open http://localhost:3000 and register and sign in (use existing credentials or create a user via the API/seed if provided).

---

## 🔧 Environment (add to `.env`)

Create a `.env` at repo root (we keep secrets out of source control). Example variables the app expects:

```env
# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-32+ char secret>
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Database (Postgres)
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>?schema=public
```

Tip: generate NEXTAUTH_SECRET with `openssl rand -base64 32` or any 32+ char random string.

> Note: `.env` is gitignored; consider adding `.env.example` with placeholders for easier onboarding.

---

## 🗄️ Prisma & PostgreSQL (quick)

This project uses Prisma with the schema defined in `prisma/schema.prisma`.

- Ensure Postgres is running locally but I recommend cloud prisma postgres (or use a managed DB). Example using Docker:

```bash
# start a local Postgres container
docker run --name bn-postgres -e POSTGRES_USER=bn -e POSTGRES_PASSWORD=bnpass -e POSTGRES_DB=beauty_nails -p 5432:5432 -d postgres
```

- Set `DATABASE_URL` in `.env` to point at your DB.

- Apply migrations & generate client:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

- Open Prisma Studio to inspect and create data:

```bash
npx prisma studio
# visit http://localhost:5555
```

If you are using Prisma Cloud / Prisma Console:
- Sign up at https://console.prisma.io/sign-up (GitHub OAuth available).
- Create a new project or database resource and copy the provided `DATABASE_URL` into your `.env`.
- Use `npx prisma db pull` to introspect an existing DB or run local migrations to apply schema.

---

## 🔐 Authentication notes

- This project uses NextAuth.js with the Prisma adapter. Required env vars include `NEXTAUTH_URL` and `NEXTAUTH_SECRET`.
- Credentials provider is set up in the codebase; ensure users have `emailVerified` set if necessary for login flows.

---

## ✅ Common Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Start (production): `npm start`
- Prisma generate: `npx prisma generate`
- Prisma migrate (dev): `npx prisma migrate dev --name <name>`
- Prisma deploy (prod): `npx prisma migrate deploy`
- Prisma Studio: `npx prisma studio`

---

## 🛠️ Troubleshooting

- Migration errors: verify `DATABASE_URL`, check schema changes, or (dev only) `npx prisma migrate reset` to wipe and reapply migrations.
- NextAuth errors: ensure `NEXTAUTH_SECRET` is set correctly and `NEXTAUTH_URL` matches your dev URL.
- If the Prisma client is not found: run `npx prisma generate` and restart the dev server.

---

## 📚 Where to look in this repo

- `prisma/` – Prisma schema and migrations
- `app/` – Next.js App Router routes and pages
- `app/api/` – API route handlers (server-side logic)
- `lib/` – helpers (including `lib/prisma.ts`, `lib/auth`)
- `PRISMA_SCHEMA_NEXTJS.md`, `NEXTAUTH_SETUP.md`, `QUICK_START.md` – useful internal docs

---

## ✨ Contributing & Notes

- Keep secrets out of git; use `.env` and/or environment variables on hosts.
- If you need an initial admin user, check for a `seed` script or open Prisma Studio to create one.

---

If you want, I can also add a `.env.example` file and a short `SETUP.md` with Windows/Docker commands. Would you like me to add those? ✅

#
