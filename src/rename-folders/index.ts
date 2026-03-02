import { config } from "dotenv";
config();
import fs from "fs";
import path from "path";
import assert from "assert";

const { MUSIC_DIR, INIT_FILE } = process.env;

const extractPlaylistId = (url: string): string | null => {
  const match = url.match(/spotify\.com\/playlist\/([A-Za-z0-9]+)/);
  return match ? match[1] : null;
};

const main = () => {
  assert(MUSIC_DIR, "process.env.MUSIC_DIR is not set");
  assert(INIT_FILE, "process.env.INIT_FILE is not set");

  const sanitize = (name: string) => name.replace(/\//g, "-").replace(/[:<>"|?*\\]/g, "_");

  // Build id -> name map from playlists.txt
  const idToName = new Map<string, string>();
  for (const line of fs.readFileSync(INIT_FILE, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const commaIdx = trimmed.indexOf(",");
    if (commaIdx === -1) continue;
    const name = trimmed.slice(0, commaIdx).trim();
    const url = trimmed.slice(commaIdx + 1).trim();
    const id = extractPlaylistId(url);
    if (id) idToName.set(id, name);
  }

  const dirs = fs.readdirSync(MUSIC_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let renamed = 0;
  let skipped = 0;

  for (const dir of dirs) {
    const dirPath = path.join(MUSIC_DIR, dir);
    const metaFiles = fs.readdirSync(dirPath).filter((f) => f.endsWith(".spotdl"));
    if (metaFiles.length === 0) continue;

    const meta = JSON.parse(fs.readFileSync(path.join(dirPath, metaFiles[0]), "utf-8"));
    const queries: string[] = Array.isArray(meta.query) ? meta.query : [meta.query];
    const id = queries.map(extractPlaylistId).find(Boolean) ?? null;

    if (!id) {
      console.log(`⚠️  Skipping "${dir}" — could not extract playlist ID`);
      skipped++;
      continue;
    }

    const newName = sanitize(idToName.get(id) ?? "");
    if (!newName) {      console.log(`⏭️  Skipping "${dir}" — playlist ID ${id} not found in ${INIT_FILE}`);
      skipped++;
      continue;
    }

    if (newName === dir) {
      console.log(`✅ "${dir}" — already correct`);
      continue;
    }

    const newPath = path.join(MUSIC_DIR, newName);
    if (fs.existsSync(newPath)) {
      console.log(`⚠️  Skipping "${dir}" → "${newName}" — target already exists`);
      skipped++;
      continue;
    }

    fs.renameSync(dirPath, newPath);
    console.log(`📁 Renamed "${dir}" → "${newName}"`);
    renamed++;
  }

  console.log(`\nDone — ${renamed} renamed, ${skipped} skipped.`);
};

main();
