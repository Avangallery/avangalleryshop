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

## V130 — Checkout database compatibility
The Worker now checks the existing `order_items` table and adds the missing `product_name` column before creating orders. Deploy the Worker; the migration runs automatically when the order-table initialization runs. No R2 binding is required.


## V131 — Card transfer checkout
The checkout payment step now shows the configured card number, holder, bank, payment note, order ID, and payable amount; includes a copy-card button and a warning if the card number is not configured. Admin payment settings validate a provided card number as 16 digits. Set the card details in `/admin/payment` after signing into the admin panel. Never commit real payment card details into source code.
