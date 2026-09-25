# AVAN GALLERY V65

- Clean admin entry: `/admin`
- Password gate before dashboard.
- Admin password: `avan`
- After successful login, dashboard opens at `/admin/dashboard`.
- Old `/admin/admin` path is rewritten to the dashboard for compatibility.
- Logout returns to `/admin`.
- The gate is a simple client-side entry lock; for production-grade security, connect authentication to Worker/D1 later.
