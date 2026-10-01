# AVAN GALLERY V75 – ADMIN ROUTE + LOGIN FIX

- `/admin` opens the admin login.
- `/admin/admin` also opens the same admin login (kept as the user's existing entry URL).
- Password: `avan`.
- Successful login goes directly to `/admin/dashboard.html` to avoid route/rewrite ambiguity.
- `/admin/dashboard` and `/admin/dashboard/` remain supported through `_redirects`.
- RTL preserved.

Cloudflare note: `_redirects` rules are static-asset routing rules; if a Worker script intercepts these paths first, the Worker must serve the corresponding asset instead.
