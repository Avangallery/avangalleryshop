# AVAN GALLERY V126 — style guide, checkout and admin order workflow

This version is based on the supplied `AVAN-GALLERY-V125-OAUTH-CHECKOUT-STYLE-FIX.zip`.

## Implemented in V126
- Replaced the four repeated style-guide photos with four different local watch images:
  - Daily: `public/assets/products/seiko-5.jpg`
  - Sport: `public/assets/products/tissot-prx.jpg`
  - Luxury: `public/assets/products/avan-women.jpg`
  - Classic: `public/assets/products/avan-classic.jpg`
- Expanded the style guide introduction and each style's full modal explanation, with practical tips for sizing, matching, comfort and care.
- Improved responsive style-card and modal layouts for desktop, tablet and mobile, including keyboard focus and reduced-motion support.
- Expanded the About AVAN Gallery text while keeping the removed footer statistics and “بیشتر درباره آوان گالری” link absent.
- Kept “۷ روز ضمانت بازگشت” absent from the storefront top service bar.
- Added admin order controls for payment status, order status and tracking code. Admin changes call the existing authenticated `PATCH /api/admin/orders/:id` endpoint.
- Kept checkout's server-side product/price/stock validation, order-number display, card/bank details from Admin payment settings and payment reference submission.
- Kept Google OAuth state-cookie handling and compatibility helpers for existing D1 schemas from V125.
- No Cloudflare R2 binding or dependency was added.

## Validation performed
- `node --check` passed for `src/index.js`, `public/app.js`, `public/admin/admin.js`.
- Inline scripts in `public/index.html`, `public/login.html` and `public/checkout.html` passed `node --check`.
- Verified that all four style cards reference distinct local image files.
- Verified the storefront no longer contains the removed return-guarantee text, footer metrics, or old “more about” link.

## Production checks still required
Google OAuth cannot be fully exercised from the local ZIP because production Cloudflare secrets and Google Cloud OAuth settings are not included (and should never be put in the ZIP). After deployment, verify:
- Production `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Cloudflare.
- The authorized JavaScript origin is `https://avangalleryshop.avangallery.workers.dev`.
- The authorized redirect URI is `https://avangalleryshop.avangallery.workers.dev/api/auth/google/callback`.
- The `DB` D1 binding points to `avan-gallery-db`.

Do not put OAuth secrets in source files or GitHub.
