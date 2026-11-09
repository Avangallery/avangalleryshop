# AVAN GALLERY V164 — Performance & Cleanup

- Removed legacy root-level duplicate assets, old CSS/JS copies, old admin folders and historical version README files that were outside the deployed `public/` directory.
- Kept the Cloudflare Worker entry, wrangler config, package manifest, D1 schema, README, and all files under `public/`.
- Replaced repeated 1.2 MB inline logo data URIs in pages with a single static image path.
- Replaced the repeated inline hero JPEG data URI with the existing static hero image.
- Converted the 2048x2048 transparent logo PNG to lossless WebP and updated public references.
- Removed duplicate admin logo file.
- No database schema, Worker routes, checkout, payment, authentication or product records were intentionally changed.
- The product image chooser already present in the admin UI is preserved. Its current helper text says selected files are for preview; permanent file upload/storage is not added in this performance-only release.
