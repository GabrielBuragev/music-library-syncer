# Copilot Instructions

## What this project does

`sound-library-sync` is a TypeScript CLI tool that syncs Spotify playlists to local audio files using the [`spotdl`](https://github.com/spotDL/spotify-downloader) binary. It wraps two `spotdl` operations:

- **Initialize** (`pnpm initialize`): reads a playlist list file, runs `spotdl save` for each playlist, then patches the output JSON to add the `type: "sync"` and `query` fields required for subsequent syncing.
- **Sync** (`pnpm sync`): discovers all `.spotdl` files under `MUSIC_DIR` subdirectories and runs `spotdl sync` on each one.

## Commands

```sh
pnpm sync         # sync all playlists in MUSIC_DIR
pnpm initialize   # initialize new playlists from INIT_FILE
```

Scripts run directly via `tsx` — there is no build step.

## Environment variables

Configured via `.env` (see `.env.example`):

| Variable | Description |
|---|---|
| `MUSIC_DIR` | Absolute path to the root music library directory |
| `SPOTDL_BINARY` | Path to the `spotdl` executable |
| `INIT_FILE` | Path to the playlist list file (used by `initialize` only) |

## Playlist list file format

A plain-text file where each line is a comma-separated `name, spotify_url` pair:

```
Solstitude, https://open.spotify.com/playlist/...
```

`playlists.txt` in the repo root is an example of this format.

## Directory layout convention

Each playlist lives in its own subdirectory of `MUSIC_DIR`:

```
MUSIC_DIR/
  <playlist-name>/
    meta.spotdl     ← spotdl sync config; created by `initialize`
    *.mp3           ← downloaded audio files; managed by `sync`
```

`getSpotdlFilePaths` in `src/utils.ts` discovers `.spotdl` files by scanning one level of subdirectories — it does **not** recurse deeper.

## Key implementation detail

After `spotdl save` writes its output, `src/init/index.ts` rewrites the file to wrap the song array in an object with `type: "sync"` and `query: [playlistUrl]`. This patching is required because `spotdl save` does not produce a file in the format expected by `spotdl sync`.
