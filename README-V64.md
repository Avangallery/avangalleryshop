# AVAN GALLERY V64

Fixes the `/admin` route on Cloudflare Workers Static Assets.

- Adds `admin/index.html` so `/admin/` resolves as a real directory index.
- Adds `_redirects` rules that proxy `/admin` and `/admin/` to `/admin/index.html` with HTTP 200, avoiding redirect loops.
- Keeps the V63 storefront and admin files unchanged.
