# AVAN GALLERY — V69 Clean Responsive

- Persian RTL storefront
- Navy / soft-gold luxury theme
- Cleaned legacy CSS into a single storefront stylesheet
- Removed unused legacy images and version README files
- Responsive header, hero, products and cart
- Admin login at `/admin` with password `avan`
- Admin dashboard at `/admin/dashboard`
- No Cloudflare R2 dependency
- Ready for GitHub + Cloudflare static deployment

Admin route rewrites are in `_redirects`.

## Latest patch
See `README-V126.md` for the V126 style-guide, responsive layout, checkout and admin order workflow changes.


## Customer authentication
- Google OAuth: `/api/auth/google`
- Email/password registration: `POST /api/auth/register` with `{ "name": "...", "email": "...", "password": "..." }`
- Email/password login: `POST /api/auth/login` with `{ "email": "...", "password": "..." }`
- Session status: `GET /api/auth/me`
- Passwords are stored as PBKDF2-SHA256 hashes with random salts; plaintext passwords are not stored.
- The existing D1 `users` table is migrated on demand to add `password_hash`.
- Optional `AUTH_SESSION_SECRET` can be configured as a Cloudflare secret. If omitted, the app falls back to the existing Google OAuth secret (or admin password) for signing customer sessions.
- Standard registration currently accepts email addresses, not phone numbers. Email verification and password reset are not implemented in this version.
