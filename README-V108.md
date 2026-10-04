# AVAN GALLERY V108 — Google Login Client ID Fix

مهم: GOOGLE_CLIENT_ID عمداً از wrangler.jsonc حذف شده تا مقدار داخل Cloudflare Dashboard کنترل شود و مقدار قدیمی/اشتباه در Deploy آن را override نکند.

Cloudflare Production Variables:
- GOOGLE_CLIENT_ID (Variable) = دقیقاً Client ID فعلی Google OAuth
- GOOGLE_CLIENT_SECRET (Secret) = Secret فعلی Google OAuth
- ADMIN_PASSWORD (Secret)

Google Redirect URI:
https://avangalleryshop.avangallery.workers.dev/api/auth/google/callback

بعد از Deploy، اگر /api/auth/google به Google redirect شد، خطای invalid_client باید برطرف شده باشد؛ در غیر این صورت Client ID موجود در Cloudflare دقیقاً با Client ID صفحه Google Cloud مقایسه شود.
