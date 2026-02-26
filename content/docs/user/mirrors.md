+++
title = "Mirrors Guide"
template = "article.html"
+++

HyPrism uses a **data-driven mirror system** for downloading game files.
Instead of hardcoding URLs, the launcher reads mirror definitions from
`.mirror.json` files stored in the `Mirrors/` directory.

This guide explains how mirrors work, how to add them, and how to configure them.

## Overview

HyPrism always prefers **official Hytale servers** when available.
If they are unavailable or slow, the launcher automatically selects the
best mirror based on priority and speed.

Mirrors are useful when:

- You don’t have an official Hytale account
- Official servers are down or slow
- You want faster regional downloads
- You want to self-host files for a community

No mirrors are enabled by default.

## How mirrors work

1. On startup, HyPrism scans the `Mirrors/` directory for `*.mirror.json` files
2. Disabled mirrors are ignored
3. Sources are sorted by priority (lower number = higher priority)
4. The best reachable source is selected automatically

## Adding mirrors

### Method 1: Settings UI (recommended)

1. Open **Settings → Downloads**
2. Click **Add Mirror**
3. Enter the mirror base URL
4. HyPrism auto-detects the mirror type
5. The mirror is ready immediately

### Method 2: Manual configuration

1. Open the launcher data directory
2. Navigate to `Mirrors/`
3. Create a file named `my-mirror.mirror.json`
4. Paste a mirror configuration
5. Restart the launcher

## Data directory location

- **Windows:** `%LOCALAPPDATA%\HyPrism\`
- **Linux:** `~/.local/share/HyPrism/`
- **macOS:** `~/Library/Application Support/HyPrism/`

## Mirror file structure

```
Mirrors/
└── my-mirror.mirror.json
```

The filename does not matter, but the `id` inside the file must be unique.

## Mirror schema (common fields)

| Field | Description |
|-----|------------|
| `schemaVersion` | Always `1` |
| `id` | Unique mirror identifier |
| `name` | Display name |
| `priority` | Lower = preferred |
| `enabled` | Enable or disable mirror |
| `sourceType` | `pattern` or `json-index` |

## Pattern-based mirrors

Pattern mirrors build download URLs from templates.

Example:

```json
{
  "schemaVersion": 1,
  "id": "example-pattern",
  "name": "Example Mirror",
  "priority": 100,
  "enabled": true,
  "sourceType": "pattern",
  "pattern": {
    "baseUrl": "https://mirror.example.com/hytale",
    "fullBuildUrl": "{base}/{os}/{arch}/{branch}/0/{version}.pwr",
    "versionDiscovery": {
      "method": "static-list",
      "staticVersions": [1, 2, 3, 4]
    }
  }
}
```

## JSON index mirrors

JSON index mirrors expose a single API returning all download URLs.

Example:

```json
{
  "schemaVersion": 1,
  "id": "example-json-index",
  "name": "JSON Index Mirror",
  "priority": 110,
  "enabled": true,
  "sourceType": "json-index",
  "jsonIndex": {
    "apiUrl": "https://mirror.example.com/api/index",
    "rootPath": "hytale",
    "structure": "flat"
  }
}
```

## Disabling or removing mirrors

- Disable: set `"enabled": false`
- Remove: delete the `.mirror.json` file
- Restart the launcher after changes

## Troubleshooting

- Ensure the JSON file is valid
- Ensure the mirror URL is reachable
- Check launcher logs under **Settings → Logs**
- Verify `os`, `arch`, and `branch` naming

## FAQ

**Do mirrors replace the official source?**
No. Official servers are always tried first.

**Do I need to restart after editing mirrors?**
Yes. Mirrors are loaded on startup only.

**Can I use mirrors for one branch only?**
Yes. Other branches fall back automatically.
