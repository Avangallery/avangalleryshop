AVAN GALLERY V73 – Admin Login Fix

Admin password: avan
Login now redirects to /admin/dashboard.html directly so the dashboard does not depend on a /admin/dashboard rewrite.

If /admin itself is not resolving, the Cloudflare Worker/static-assets route must serve _redirects or explicitly map /admin to /admin/index.html.
