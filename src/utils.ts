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
