# AVAN GALLERY V147 — Header and control layout repair

- Removes the broad V146 override that forced borders on every header button and made the search input rectangular.
- Restores corrupted CSS identifiers from the earlier global color replacement (including `white-space` and gold theme variable names). The associated values remain white, so the interface palette stays white and navy only.
- Applies borders only to actual cards/forms, not every navigation item or button.
- Keeps product photos unchanged.
- Cloudflare Workers + D1 setup preserved; no R2 added.

After deployment, hard-refresh the site and test header search, navigation, checkout fields, account pages, and admin on desktop/mobile.
