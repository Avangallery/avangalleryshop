# AVAN GALLERY V66 – Admin Route Recovery

- `/admin` and `/admin/` open the password gate.
- `/admin/admin` also opens the password gate (compatibility).
- Password: `avan`
- After successful login, dashboard opens at `/admin/dashboard`.
- Removed the `/admin/admin -> dashboard` rewrite that could create a redirect/auth loop.
- Dashboard remains protected by sessionStorage.

If `/admin` is still intercepted by an existing Worker script, the Worker must pass `/admin` requests to `env.ASSETS.fetch(...)`; `_redirects` only applies to static asset requests not handled first by Worker code.
