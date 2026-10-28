# AVAN GALLERY V163 — Fix registration against legacy D1 users schema

- New registrations store `password_hash` and `password_salt` in their dedicated columns, satisfying the existing legacy schema.
- Login supports both the legacy `salt$hash` format and the separate salt/hash columns.
- Worker migration adds `password_salt` safely with an empty default if missing.
- Existing users and orders are not deleted or rebuilt.
- Google login remains removed; checkout login gate, EZPay link, card-to-card flow, support and FAQ changes are preserved.

Deploy this project to Cloudflare and test with a new email. Live D1 execution cannot be verified from this package alone.
