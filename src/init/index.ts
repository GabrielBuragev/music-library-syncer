import { config } from "dotenv";
import assert from "assert";
import { readPlaylistFile } from "../utils";
import { spawn } from "child_process";
import fs from "fs";
config();

const { SPOTDL_BINARY, MUSIC_DIR, INIT_FILE } = process.env;

export const initPlaylist = async ({
  binaryPath,
  playlistName,
  playlistUrl,
  outDir,
}: {
  binaryPath: string;
  playlistName: string;
  playlistUrl: string;
  outDir: string;
}) => {
  assert(playlistName, "Invalid playlist name.");
  assert(playlistUrl, "Invalid playlist url.");

  return new Promise<void>((resolve, reject) => {
    const outputFilePath = `${outDir}/${playlistName}/meta.spotdl`;
    const cmdArgs = ["save", playlistUrl, "--save-file", outputFilePath];

    if (!fs.existsSync(`${outDir}/${playlistName}`)) {
      fs.mkdirSync(`${outDir}/${playlistName}`);
    }

    const ls = spawn(binaryPath, cmdArgs);

    console.log("Starting command:");
    console.log(`> ${binaryPath} ${cmdArgs.join(" ")}\n`);

    ls.stdout.on("data", (data) => {
      const msg = String(data);

      if (msg.match(/Found [0-9]+ songs/g)) return console.log(msg);
      if (msg.match(/ConnectionError:/g)) return console.log(msg);

      console.log(`STDOUT: ${msg}`);
    });

    ls.on("close", (code) => {
      console.log(`Command finished with code:${code}`);

      // Overwrit with correct meta content for syncing
      const songs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
      const fullMeta = {
        type: "sync",
        query: [playlistUrl],
        songs,
      };
      fs.writeFileSync(outputFilePath, JSON.stringify(fullMeta, null, 2));

      resolve();
    });
  });
};

const main = async () => {
  assert(MUSIC_DIR, "process.env.MUSIC_DIR is not set");
  assert(INIT_FILE, "process.env.INIT_FILE is not set");

  const spotifyPlaylistUrls = readPlaylistFile(INIT_FILE);

  assert(
    spotifyPlaylistUrls.length > 0,
    "No playlist urls found in initialisation file."
  );

  const invalidPlaylistEntry = spotifyPlaylistUrls.find(
    ([name, url]) => !name || !url
  );
  assert(
    invalidPlaylistEntry === undefined,
    `Invalid playlist name or url found in initialisation file. ${invalidPlaylistEntry}`
  );

  for (const [name, playlistUrl] of spotifyPlaylistUrls) {
    await initPlaylist({
      binaryPath: SPOTDL_BINARY,
      playlistName: name,
      playlistUrl: playlistUrl,
      outDir: MUSIC_DIR,
    });
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
