## Security Incident Response (Git/Supabase/Vercel)

### 1) If secrets were committed to git
1. Rotate immediately:
   - `NATIONAL_LAW_API_KEY`
   - `OPENAI_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET_CURRENT` (move old value to `ADMIN_SESSION_SECRET_PREVIOUS` briefly, then remove)
2. Invalidate active admin sessions by rotating session secrets.
3. Rewrite repository history to remove leaked files (recommended):
   - `git filter-repo` or BFG on files/patterns like `debug_*`, `*.log`, `OC=...`, `admin123`, `cpla2024admin`.
4. Force-push rewritten history and notify collaborators to re-clone.

### 2) Supabase hardening checklist
1. Confirm `service_role` key is never exposed to client code (`NEXT_PUBLIC_*` only for anon).
2. Rotate `service_role` and `anon` keys in Supabase project settings if leak suspected.
3. Keep RLS enabled on all PII tables and deny direct anonymous access.
4. Keep short data retention for contact/request logs.

### 3) Vercel hardening checklist
1. Rotate all Environment Variables in Vercel Project Settings if leak suspected.
2. Check Deployments -> Logs for accidental key/PII output.
3. Verify `.vercel` is not committed (contains `orgId`/`projectId` metadata).
4. Restrict preview/prod domains and keep CORS allowlist minimal.

### 4) Local prevention
1. Run `npm run security:scan` before push.
2. Keep `.env*`, `.settings.json`, `.secret.key`, debug logs out of git.
3. Do not commit API response dumps or local server logs.
