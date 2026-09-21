#!/usr/bin/env python3
"""Fetch build & release status for Matrinsoft GNOME repos, output data.json."""
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

API = "https://api.github.com"
ORG = "Matrinsoft"
TOKEN = os.environ.get("GH_TOKEN", "")

def api(path):
    url = f"{API}{path}"
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "lingmo-build-dashboard")
    if TOKEN:
        req.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        body = e.read().decode(errors="replace")
        print(f"  error {e.code} on {url}: {body[:200]}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"  error on {url}: {e}", file=sys.stderr)
        return None

def get_build(repo):
    runs = api(f"/repos/{ORG}/{repo}/actions/runs?per_page=1")
    if not runs or not runs.get("workflow_runs"):
        return {"status": "none"}
    r = runs["workflow_runs"][0]
    return {
        "status": r.get("status"),
        "conclusion": r.get("conclusion"),
        "name": r.get("name"),
        "branch": r.get("head_branch"),
        "url": r.get("html_url"),
        "run_at": r.get("created_at"),
        "updated_at": r.get("updated_at"),
    }

def get_release(repo):
    rel = api(f"/repos/{ORG}/{repo}/releases/latest")
    if not rel:
        return {"tag": None}
    return {
        "tag": rel.get("tag_name"),
        "name": rel.get("name"),
        "url": rel.get("html_url"),
        "published_at": rel.get("published_at"),
    }

def main():
    repos = json.load(open(os.path.join(os.path.dirname(__file__), "repos.json")))
    out = {"generated_at": datetime.now(timezone.utc).isoformat(), "repos": []}
    for i, repo in enumerate(repos):
        build = get_build(repo)
        release = get_release(repo)
        out["repos"].append({"name": repo, "build": build, "release": release})
        print(f"[{i+1}/{len(repos)}] {repo}: build={build.get('status')}/{build.get('conclusion')} release={release.get('tag')}", flush=True)
    with open(os.path.join(os.path.dirname(__file__), "data.json"), "w") as f:
        json.dump(out, f, indent=2)
    print("done", flush=True)

if __name__ == "__main__":
    main()
