# AVAN GALLERY V79 – GitHub + Cloudflare D1 FIX

## Important
Cloudflare build failed because wrangler.jsonc pointed to `./public` but the repository had no `public` directory.
This version places all storefront/static files inside `public/` and keeps Worker code in `src/`.

Repository structure:
- public/ = website assets and admin pages
- src/index.js = Worker/API
- schema.sql = D1 schema
- wrangler.jsonc = Cloudflare configuration

## Before deploy
1. Replace `PASTE_YOUR_D1_DATABASE_ID_HERE` in wrangler.jsonc with the UUID of `avan-gallery-db`.
2. In Cloudflare Worker settings add secret `ADMIN_PASSWORD` with value `avan`.
3. GitHub Actions needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.
4. Push to main.
