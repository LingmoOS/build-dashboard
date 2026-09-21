# LingmoOS Build Dashboard

Web dashboard to monitor the build and release status of the 79 GNOME source
repositories in the [Matrinsoft](https://github.com/Matrinsoft) organization.

## How it works

1. **`.github/workflows/fetch-data.yml`** runs every 15 minutes and fetches the
   latest workflow run + release for each repo via the GitHub API, producing
   `data.json` (committed back to this repo).
2. The **frontend** (`index.html` + `app.js` + `style.css`) reads `data.json`
   and renders the dashboard. It is served via GitHub Pages.
3. An optional **backend** (`server.py`) is provided for local/self-hosted
   serving; it serves the static frontend and a `/api/data` endpoint.

## Local development

```bash
# 1. Fetch live data (needs a GitHub token)
export GH_TOKEN=your_token
python fetch_data.py

# 2. Serve the dashboard
python server.py
# open http://localhost:8000
```

## Deploy on GitHub Pages

1. Enable Pages in repository **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: `main` → `/ (root)`
2. The dashboard is then available at
   `https://lingmoos.github.io/build-dashboard/`.

> `fetch-data.yml` uses the built-in `GITHUB_TOKEN`, which can read public
> repository actions/releases data across the `Matrinsoft` org.

## Files

| File | Purpose |
|------|---------|
| `repos.json` | List of the 79 repository names to monitor |
| `fetch_data.py` | Fetches build + release status → `data.json` |
| `data.json` | Generated snapshot (refreshed by Actions) |
| `index.html` / `app.js` / `style.css` | Frontend |
| `server.py` | Optional lightweight backend |
