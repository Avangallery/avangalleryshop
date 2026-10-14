# AVAN GALLERY V143 — Customer Login & Registration Fix

## Fixes
- Password registration stores `google_id` as SQL `NULL`, avoiding collisions with the `UNIQUE` constraint in the existing D1 schema.
- Login/register now checks that a stable session-signing secret exists before creating an account or authenticating.
- Common D1 schema and duplicate-account failures show actionable Persian messages; detailed causes are logged in Cloudflare Worker logs.
- Keeps the current AVAN navy/gold interface and existing features.
- Does not use Cloudflare R2.

## Cloudflare checklist
1. Keep the D1 binding named `DB` connected to `avan-gallery-db`.
2. In Worker Settings → Variables and Secrets, set `AUTH_SESSION_SECRET` as a **Secret** to a long random value (at least 32 random characters). This must remain unchanged across deployments or existing customer sessions will be invalidated.
3. Deploy from GitHub and test registration with a new email, then sign out and test login.
4. Google login separately requires valid `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and the exact callback URL `/api/auth/google/callback` registered in Google Cloud.

Syntax validation passed locally. A live Cloudflare D1/OAuth test has not been performed from this package.
