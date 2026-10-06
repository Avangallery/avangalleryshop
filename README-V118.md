# AVAN GALLERY V118 — Checkout datatype mismatch fix
- Fixed SQLite datatype mismatch on legacy `orders.id` schemas.
- Detects the existing `orders.id` type at runtime.
- Uses numeric timestamp IDs when legacy `id` is INTEGER PRIMARY KEY; keeps AVN string IDs for TEXT schemas.
- Preserves order_items, payment, admin payment settings, Google login, D1 and no-R2 architecture.
