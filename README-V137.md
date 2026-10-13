# AVAN GALLERY V137 — Wallet and reports

This release extends V136. It replaces the placeholder cards on the Wallet & Loyalty and Reports pages with working D1-backed views.

## Wallet & loyalty
- Lists customer accounts, paid order count and spend, wallet balance, points and tier.
- Points are calculated at one point per 10,000 toman of paid orders.
- Master/admin staff can add credit, record wallet debit (only if balance is sufficient), and manually adjust loyalty points.
- Every manual ledger transaction records the customer, amount, note, administrator and timestamp.

## Reports
- Date-range filters for order count, paid sales, paid/unpaid order counts, and daily totals.
- Top-selling items are computed from paid orders and order_items.
- Inventory report lists products from lowest stock upwards and flags low/out-of-stock items.
- Daily report can be exported to CSV.

## Notes
- Wallet balance is an internal customer credit ledger; it is not a payment gateway or a bank account.
- Loyalty points are calculated from paid order totals plus manual point adjustments.
- Existing V136 account, order, receipt, staff, settings and dashboard changes are preserved.
- No Cloudflare R2 dependency is introduced.
- New wallet tables are created lazily by the Worker; JavaScript syntax and ZIP integrity should be checked before deployment. Live D1 data still requires a post-deploy test.
