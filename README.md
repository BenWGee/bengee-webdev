# Neocities Static Sumo API Site

This folder contains a static HTML/CSS/JS conversion of the Flask app from `api_requests`.

## Files

- `index.html` - API Explorer page
- `scheduled-matches.html` - Scheduled matches page
- `styles.css` - Shared styling
- `app.js` - Client-side logic for API Explorer
- `scheduled-matches.js` - Client-side logic for scheduled matches

## Publish To Neocities

1. Sign in to your Neocities account.
2. Open your dashboard file manager.
3. Upload all files from this folder:
   - `index.html`
   - `scheduled-matches.html`
   - `styles.css`
   - `app.js`
   - `scheduled-matches.js`
4. Make sure `index.html` is in the site root (or the folder you want to serve).
5. Open your Neocities site URL and verify both pages load.

## Local Preview (Optional)

Use any static server so browser fetch behaves consistently.

Example from this folder:

```powershell
python -m http.server 8000
```

Then open:

- `http://localhost:8000/index.html`
- `http://localhost:8000/scheduled-matches.html`

## Notes

- The site calls `https://sumo-api.com` directly from the browser.
- If requests fail on Neocities, check browser developer tools for CORS/network errors.
- Query params are supported for quick sharing/bookmarking.

### Example URLs

- `index.html?endpoint=rikishi&rikishi_id=1`
- `scheduled-matches.html?basho_id=202405&day=1&spoiler=1`
