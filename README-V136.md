# AVAN GALLERY V136 — Consolidated account and admin improvements

## Included
- Real account order history with line items, payment state, order state, and carrier tracking.
- Admin order table with item summary, receipt preview, payment transaction reference, approve/reject actions, and shipment tracking code.
- Separate `payment_reference` and `tracking_code` fields to avoid mixing bank transaction references with carrier tracking numbers.
- Working dashboard add-product and customer-support buttons; refreshed full-cover watch hero and inline SVG watch mark.
- D1-backed staff accounts, role-based API permissions, activation/deactivation, and admin activity log.
- D1-backed general store settings, public non-sensitive settings endpoint, configurable logo URL, and shipping fee/free-shipping threshold applied during checkout.
- Preserves the navy/gold AVAN styling and does not use Cloudflare R2.

## Deployment
1. Extract this archive.
2. Replace the contents of the existing GitHub project with the contents of `avangalleryshop-main`.
3. Commit and wait for the Cloudflare Worker deployment to finish.
4. Hard-refresh the site (`Ctrl+F5`).
5. Test a customer login and order, submit a receipt, then verify receipt preview, approve/reject, and carrier tracking from the admin panel.
6. In `/admin`, create staff accounts from **مدیران و دسترسی‌ها**. Staff sign in using their email and password; the master account continues to use the Cloudflare `ADMIN_PASSWORD` secret.

The Worker lazily creates the new staff/activity tables and migrates the order columns, including `receipt_image` and `payment_reference`. JavaScript syntax and archive integrity are checked, but production D1 and OAuth behavior still require a live post-deploy smoke test.
