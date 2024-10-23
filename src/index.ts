import { config } from "dotenv";
import assert from "assert";
import { sync } from "./sync";
import { getSpotdlFilePaths } from "./utils";
config();

const { SPOTDL_BINARY, MUSIC_DIR } = process.env;

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
