# AVAN GALLERY V121 — Checkout Robust D1 + Payment Flow

- Hardened checkout against legacy D1 INTEGER/TEXT primary key schemas.
- Dynamically adapts orders.id, orders.user_id, order_items.id, order_items.order_id and order_items.product_id types.
- Guest checkout creates a compatible guest user when orders.user_id is NOT NULL.
- Existing orders/users tables are migrated without destructive recreation.
- Successful order creation returns the configured payment card data so checkout immediately reveals the card-transfer step.
- Admin payment/card settings remain available at `/admin/payment` and through the dashboard.
- No R2.
