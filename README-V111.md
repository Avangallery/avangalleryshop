# AVAN GALLERY V111 — D1 + Google Login Fix

- Adds automatic runtime migration for `product_meta` so existing D1 databases do not fail with `no such table: product_meta`.
- Adds `keep_vars: true` to Wrangler config so Cloudflare dashboard Production Variables/Secrets such as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are preserved during GitHub/Wrangler deployments.
- Does not embed the Google Client Secret in the project.
- Keeps the existing D1 database and admin/customer systems.
