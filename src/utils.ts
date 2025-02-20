import * as fs from "fs";

export const getSpotdlFilePaths = (rootFolder: string): string[] => {
  const folders = fs.readdirSync(rootFolder);

  return folders
    .map((folder) => {
      // folder where we expect to find .spotdl file
      const folderAbsolutePath = `${rootFolder}/${folder}`;
      if (fs.lstatSync(folderAbsolutePath).isDirectory()) {
        // find the .spotdl file in the folder
        const fileName = fs
          .readdirSync(folderAbsolutePath)
          .find((file) => file.includes(".spotdl"));

        if (fileName) {
          // return the absolute path to the .spotdl file
          return `${folderAbsolutePath}/${fileName}`;
        }
      }

      return undefined;
    })
    .filter((file) => file) as string[];
};

export const readPlaylistFile = (
  filePath: string
): [name: string, playlistUrl: string][] => {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const lines = fileContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map(
    (line) => line.split(",").map((part) => part.trim()) as [string, string]
  );
};
