import { config } from "dotenv";
import { getSpotdlFilePaths } from "../utils";
config();
import assert from "assert";
import { spawn } from "child_process";

const { SPOTDL_BINARY, MUSIC_DIR } = process.env;

export const sync = async (binaryPath: string, configFilePath: string) => {
  assert(
    configFilePath.includes(".spotdl"),
    "config file must be a .spotdl file"
  );

  const dlOutputFolder = configFilePath.substring(
    0,
    configFilePath.lastIndexOf("/")
  );

  return new Promise<void>((resolve, reject) => {
    const cmd = binaryPath;
    const cmdArgs = [
      "sync",
      configFilePath,
      "--sync-without-deleting",
      "--output",
      dlOutputFolder,
      "--bitrate",
      "128k",
    ];

    const ls = spawn(cmd, cmdArgs);

    console.log("Starting command:");
    console.log(`> ${cmd} ${cmdArgs.join(" ")}\n`);

    ls.stdout.on("data", (data) => {
      const msg = String(data);

      if (msg.match(/Found [0-9]+ songs/g)) return console.log(msg);
      if (msg.match(/ConnectionError:/g)) return console.log(msg);

      console.log(`STDOUT: ${msg}`);
    });

    ls.on("close", (code) => {
      console.log(`Command finished with code:${code}`);
      resolve();
    });
  });
};

const main = async () => {
  assert(MUSIC_DIR, "process.env.MUSIC_DIR is not set");

  const spotdlConfigFilePaths = getSpotdlFilePaths(MUSIC_DIR);

  for (const configFilePath of spotdlConfigFilePaths) {
    await sync(SPOTDL_BINARY, configFilePath);
  }
  // await sync(SPOTDL_BINARY);

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
