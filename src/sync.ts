import assert from "assert";

import { spawn } from "child_process";

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
