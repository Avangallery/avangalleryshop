# AVAN GALLERY V84 — Premium Product Form

V84 upgrades the real D1-backed product form without changing the working admin route, authentication, D1 binding, or existing products.

## Product form
- Main information tab
- Real local SVG brand selector
- Category and gender
- Price + old price + automatic discount percentage
- Stock + SKU
- Store visibility, featured, bestseller, new badges
- Short and full descriptions
- Gallery URLs / local asset paths with live previews
- Watch specifications
- SEO fields
- Preview before save
- Mobile responsive tabbed layout

## D1
Adds a safe `product_meta` table via `CREATE TABLE IF NOT EXISTS`. Existing `products` rows are preserved. Extra product metadata is stored as JSON in `product_meta.metadata_json`.

No R2 is used.
