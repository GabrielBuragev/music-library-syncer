#!/usr/bin/env -S pnpm tsx

import { config } from "dotenv";
import { getSpotdlFilePaths } from "../utils";
config();
import assert from "assert";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const { MUSIC_DIR } = process.env;

const FFMPEG = path.join(
  process.env.HOME!,
  ".spotdl",
  "ffmpeg"
);

interface Song {
  name: string;
  artist: string;
  artists: string[];
  album_name: string;
  year: string;
  track_number: number;
  url: string;
}

const spawnAsync = (cmd: string, args: string[]): Promise<number> =>
  new Promise((resolve) => {
    const proc = spawn(cmd, args, { stdio: "inherit" });
    proc.on("close", resolve);
  });

export const downloadSong = async (song: Song, outputFolder: string): Promise<void> => {
  const safeTitle = `${song.artist} - ${song.name}`.replace(/[/\\:*?"<>|]/g, "_");
  const outputPath = path.join(outputFolder, `${safeTitle}.mp3`);

  if (fs.existsSync(outputPath)) {
    console.log(`Skipping (exists): ${safeTitle}`);
    return;
  }

  const searchQuery = `ytsearch:${song.name} ${song.artist}`;
  console.log(`Downloading: ${safeTitle}`);

  const code = await spawnAsync("yt-dlp", [
    searchQuery,
    "--extract-audio",
    "--audio-format", "mp3",
    "--audio-quality", "128K",
    "--ffmpeg-location", FFMPEG,
    "--output", outputPath,
    "--add-metadata",
    "--parse-metadata", `${song.name}:%(meta_title)s`,
    "--parse-metadata", `${song.artist}:%(meta_artist)s`,
    "--parse-metadata", `${song.album_name}:%(meta_album)s`,
    "--parse-metadata", `${song.year}:%(meta_date)s`,
    "--no-playlist",
    "--quiet",
    "--progress",
  ]);

  if (code !== 0) {
    console.error(`Failed to download: ${safeTitle} (exit code ${code})`);
  }
};

export const sync = async (configFilePath: string): Promise<void> => {
  assert(configFilePath.includes(".spotdl"), "config file must be a .spotdl file");

  const outputFolder = path.dirname(configFilePath);
  const spotdlFile = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
  const songs: Song[] = spotdlFile.songs;

  console.log(`\nSyncing ${songs.length} tracks → ${outputFolder}\n`);

  for (const song of songs) {
    await downloadSong(song, outputFolder);
  }
};

const main = async () => {
  assert(MUSIC_DIR, "process.env.MUSIC_DIR is not set");

  const spotdlConfigFilePaths = getSpotdlFilePaths(MUSIC_DIR);

  for (const configFilePath of spotdlConfigFilePaths) {
    await sync(configFilePath);
  }

  process.exit();
};

(async () => {
  await main();
})();

process.on("unhandledRejection", (error) => {
  console.log(error);
});

process.on("uncaughtException", (error) => {
  console.log(error);
});
