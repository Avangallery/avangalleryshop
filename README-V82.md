# AVAN GALLERY V82 — Premium Products Admin UI

Built from V81 without changing the Cloudflare Worker/D1 architecture.

## What changed
- Premium RTL product management layout inspired by the approved mockup.
- Product summary cards: inventory value, total products, in-stock, low-stock, out-of-stock.
- Advanced client-side filters for price, stock, category, and brand.
- Product search by name, brand, and SKU.
- Sorting by newest, price, stock, and name.
- D1 connection indicator in the product section.
- Professional product table with image, SKU, category, brand, price, stock, status, date, and actions.
- Existing add/edit/delete API flows are preserved.
- Existing D1 data is not migrated or deleted by this UI update.
- No R2 is used.

## Deploy
Use the same GitHub -> Cloudflare deployment workflow as V81. Do not change the existing D1 ID or ADMIN_PASSWORD secret.
