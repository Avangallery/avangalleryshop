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


## V132 — Legacy D1 schema compatibility
Checkout chooses product_id binding based on the actual products.id schema, avoiding NULL product IDs when IDs are text slugs. Email/password registration supports legacy databases with INTEGER PRIMARY KEY user IDs by allowing SQLite to allocate the ID and retrieving the created user. Existing records are preserved.


## V133 — Legacy schema compatibility hardening
Order-item inserts are now generated from the actual D1 table columns and populate legacy `price` as well as `unit_price`, plus common quantity/total fields. Password registration uses the detected users schema and fills legacy required columns conservatively. This does not replace a live test against the production D1 database; deploy to staging or test with a low-value test order first.


## V134 — Payment receipt upload
Checkout payment form accepts an optional JPG/PNG/WebP receipt image up to 2 MB, previews/removes it client-side, and submits it with the transaction reference. The Worker stores the data URL in `orders.receipt_image`; existing D1 databases receive the new column through the orders migration. Admin UI visibility of receipt images may require a separate admin-orders UI change.


## V135 — Required receipt, optional reference
Checkout now places the receipt upload before the transaction reference, makes the image required and the reference optional, and styles the upload area in the navy/gold AVAN theme with preview, remove, and drag/drop support. API also rejects payment submissions without a valid receipt image.


## V136 — Consolidated account and admin workflows

- Customer account page loads the signed-in customer's real order history, line items, payment state, shipment state, and carrier tracking code.
- Admin order management displays order items, receipt preview, transaction reference, payment approval/rejection actions, order status, and carrier tracking-code editing.
- Payment transaction references are stored separately from shipment tracking codes.
- Admin dashboard hero uses a full-width watch image treatment, a small inline SVG watch mark, and working product-add/support actions.
- Admin staff management supports creating email/password staff accounts, role assignment, activation/deactivation, and role checks for protected API routes.
- Admin activity log records sign-ins, product mutations, order updates, payment settings, staff changes, and store settings changes.
- Store settings are D1-backed; the public endpoint exposes only non-sensitive store/shipping settings, and configured shipping cost/free-shipping threshold are used during checkout.
- No Cloudflare R2 dependency was introduced.


## V143 — customer authentication fix
- Fixed password-account registration for the existing D1 schema by storing `google_id` as `NULL` rather than an empty string (the original schema marks this field `UNIQUE`).
- Added a clear preflight error when no stable customer session secret is configured.
- Improved safe, actionable messages for common D1 migration/uniqueness failures while keeping SQL details in Worker logs.
- No Cloudflare R2 dependency added.
