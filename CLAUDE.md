# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm initialize   # Initialize new playlists: saves .spotdl metadata files for each playlist
pnpm sync         # Sync/download tracks: reads existing .spotdl files and downloads missing songs
```

Scripts are run directly with `tsx` (no build step needed).

## Environment Setup

Copy `.env.example` to `.env` and fill in:

- `MUSIC_DIR` — absolute path to the local music library directory
- `SPOTDL_BINARY` — absolute path to the `spotdl` executable
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — Spotify app credentials
- `INIT_FILE` — path to a CSV-like playlist file (used only by `initialize`)

## Architecture

The tool wraps [spotdl](https://github.com/spotDL/spotify-downloader), a CLI that downloads Spotify tracks from YouTube.

**Two-phase workflow:**

1. **Initialize** (`src/init/index.ts`) — Reads a playlist file (`INIT_FILE`, format: `Name, https://open.spotify.com/...` one per line), runs `spotdl save` for each playlist to produce `{MUSIC_DIR}/{PlaylistName}/meta.spotdl`, then rewrites that file to add a `type: "sync"` wrapper needed for subsequent syncs.

2. **Sync** (`src/sync/index.ts`) — Scans `MUSIC_DIR` for subdirectories containing a `*.spotdl` file (via `getSpotdlFilePaths` in `src/utils.ts`), then runs `spotdl download` against the individual track URLs stored in each `.spotdl` file. Track URLs are read directly from the saved file rather than fetched from Spotify's API (which returns 403 as of 2024).

**Music library layout** (under `MUSIC_DIR`):
```
music_library/
  PlaylistName/
    meta.spotdl     ← JSON: { type, query, songs: [{ url, ... }] }
    track1.mp3
    track2.mp3
    ...
```

`src/utils.ts` contains the two shared helpers: `getSpotdlFilePaths` (directory scanner) and `readPlaylistFile` (CSV playlist parser).
