"""
Pulls public repo metadata for a GitHub user and writes it to data.json
for the showcase site's frontend to render.

Category logic:
  - if the repo has GitHub topics set, use the first topic
  - otherwise fall back to the repo's primary language
  - otherwise "misc"
"""

import json
import os
from datetime import datetime, timezone
from urllib.request import Request, urlopen

USERNAME = "shehryar-92"
TOKEN = os.environ.get("SCAN_TOKEN")
API_URL = f"https://api.github.com/users/{USERNAME}/repos?per_page=100&type=owner"

# Repos to exclude from the showcase (e.g. the profile README repo, this showcase repo itself)
EXCLUDE = {USERNAME, "showcase"}


def fetch_repos():
    headers = {"Accept": "application/vnd.github+json"}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    req = Request(API_URL, headers=headers)
    with urlopen(req) as resp:
        return json.loads(resp.read().decode())


def categorize(repo):
    if repo.get("topics"):
        return repo["topics"][0]
    if repo.get("language"):
        return repo["language"]
    return "misc"


def build_project_entry(repo):
    return {
        "name": repo["name"],
        "description": repo.get("description") or "",
        "url": repo["html_url"],
        "homepage": repo.get("homepage") or None,
        "category": categorize(repo),
        "created_at": repo["created_at"],
        "pushed_at": repo["pushed_at"],
    }


def main():
    repos = fetch_repos()
    projects = [
        build_project_entry(r)
        for r in repos
        if not r.get("fork") and r["name"] not in EXCLUDE
    ]

    data = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "projects": projects,
    }

    with open("data.json", "w") as f:
        json.dump(data, f, indent=2)

    print(f"Wrote {len(projects)} projects to data.json")


if __name__ == "__main__":
    main()
