# AVAN GALLERY V119 — Checkout Guest User Fix

Fixes the existing D1 `orders.user_id NOT NULL` constraint for guest checkout.

- Authenticated users use their Google user ID.
- Guests get a lightweight unique guest user record in `users`.
- Existing orders and D1 schema are preserved.
- Payment/admin settings remain included.
