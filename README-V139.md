# AVAN GALLERY V139 — Content, announcements, reviews

## Admin pages upgraded from placeholder cards to D1-backed management screens
- Content & banners: manage Hero, banners, magazine articles, and static pages; create/edit/delete, image URL, CTA, ordering and publish toggle.
- Announcements: create/edit/delete, audience, active toggle and optional schedule. The public `/api/announcements` endpoint returns active customer-facing announcements. This does not send SMS/email unless an external provider is separately configured.
- Customer reviews: list/filter by status, create test/manual reviews, approve/reject/mark spam, add admin reply and delete.
- D1 tables are created lazily by the Worker. Admin routes are protected by existing admin/staff authorization.
- Keeps AVAN navy/gold styling, Persian RTL, and the prior V138 account scroll improvements.
- No R2 dependency is added.
