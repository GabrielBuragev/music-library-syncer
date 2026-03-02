#!/usr/bin/env -S pnpm tsx

import { config } from "dotenv";
import { getSpotdlFilePaths } from "../utils";
config();
import assert from "assert";
import fs from "fs";
import path from "path";
import { YtDlp } from "ytdlp-nodejs";

const { MUSIC_DIR, YTDLP_BINARY } = process.env;

const ytdlp = new YtDlp({
  binaryPath: YTDLP_BINARY,
  ffmpegPath: path.join(process.env.HOME!, ".spotdl", "ffmpeg"),
});

interface Song {
  name: string;
  artist: string;
  artists: string[];
  album_name: string;
  year: string;
  track_number: number;
  url: string;
}

export const downloadSong = async (song: Song, outputFolder: string): Promise<void> => {
  const safeTitle = `${song.artist} - ${song.name}`.replace(/[/\\:*?"<>|]/g, "_");
  const outputPath = path.join(outputFolder, `${safeTitle}.mp3`);

  if (fs.existsSync(outputPath)) {
    console.log(`⏭️  Skipping (exists): ${safeTitle}`);
    return;
  }

  console.log(`⏬ Downloading: ${safeTitle}`);

  try {
    await ytdlp
      .download(`ytsearch:${song.name} ${song.artist}`)
      .extractAudio()
      .audioFormat("mp3")
      .audioQuality("5")
      .setOutputTemplate(outputPath.replace(/\.mp3$/, ".%(ext)s"))
      .addOption("--no-playlist")
      .on("progress", (p) => process.stdout.write(`\r   ${p.percentage_str} at ${p.speed_str} ETA ${p.eta_str}   `))
      .on("finish", () => process.stdout.write("\n"))
      .run();

    console.log(`✅ Downloaded: ${safeTitle}`);
  } catch (err) {
    process.stdout.write("\n");
    console.error(`❌ Failed: ${safeTitle}`, err);
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
  assert(YTDLP_BINARY, "process.env.YTDLP_BINARY is not set");

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
