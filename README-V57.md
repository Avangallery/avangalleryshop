# AVAN GALLERY V57 — Cart Open Fix

Fix: `app.js` was present in the project but was not loaded by `index.html`, so the cart button had no click handler. V57 explicitly loads `app.js` with `defer`.

Cart UI/behavior from V56 is preserved.
