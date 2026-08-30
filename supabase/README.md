# Supabase backend

Backend-as-code for the flashcard app's accounts + sync. The database and auth
live on Supabase's servers; the code that *defines* them lives here as
version-controlled SQL. See `docs/spec.md` → Backend for the design.

## Contents
- `migrations/20260801000000_init_backend.sql` — schema (`decks`, `cards`), row-level
  security, and the transactional `save_deck(jsonb)` RPC.

## One-time project setup

1. Create a free account at https://supabase.com (GitHub or email).
2. **New project** → pick a name (e.g. `flashcard2026`), set a database password
   (save it), choose the nearest region, and create it. Give it ~2 min to spin up.
3. Grab your keys from **Project Settings → API**:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **publishable** key (`sb_publishable_...`) — formerly called the **anon public**
     key; older projects may still show a JWT-style `eyJ...` value instead. Never
     the **secret** key (`sb_secret_...`, formerly `service_role`): it bypasses RLS
     and must never reach the browser.
   These go in a gitignored `.env.local` at the repo root when we wire the client:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_PUBLISHABLE_KEY=...
   ```
   (The publishable key is safe to ship in the client — row-level security is what
   protects the data, not key secrecy.)

## Applying the migration

**Quick path (no CLI):** open the project's **SQL Editor**, paste the contents of
`migrations/20260801000000_init_backend.sql`, and run it.

**CLI path (reproducible, preferred once set up):**
```
brew install supabase/tap/supabase   # or see supabase.com/docs/guides/cli
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

## Auth settings
Under **Authentication → Providers**, keep **Email** enabled (email/password is
all v1 needs). For local dev you may want to turn *off* "Confirm email" so sign-up
doesn't require clicking a confirmation link.
