import { config } from "dotenv";
config();
import assert from "assert";
import fs from "fs";

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
const PLAYLISTS_FILE = "playlists.txt";
const CACHE_PATH = `${process.env.HOME}/.spotdl/.spotipy`;
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API = "https://api.spotify.com/v1";

interface SpotifyToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

interface SpotifyPlaylist {
  name: string;
  public: boolean;
  external_urls: { spotify: string };
  owner: { id: string };
}

const getAccessToken = async (): Promise<string> => {
  // Reuse cached user-auth token if still valid
  if (fs.existsSync(CACHE_PATH)) {
    const cached: SpotifyToken = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    if (cached.expires_at > Date.now() / 1000 + 60) {
      return cached.access_token;
    }
    // Refresh if we have a refresh token
    if (cached.refresh_token) {
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: cached.refresh_token,
        client_id: SPOTIFY_CLIENT_ID!,
        client_secret: SPOTIFY_CLIENT_SECRET!,
      });
      const res = await fetch(SPOTIFY_TOKEN_URL, {
        method: "POST",
        body: params,
      });
      const data = await res.json() as SpotifyToken;
      const updated = { ...cached, ...data, expires_at: Date.now() / 1000 + data.expires_at };
      fs.writeFileSync(CACHE_PATH, JSON.stringify(updated));
      return data.access_token;
    }
  }

  throw new Error(
    "No valid Spotify token found. Run `pnpm sync` or `pnpm initialize` first to authenticate."
  );
};

const fetchAllPlaylists = async (token: string): Promise<SpotifyPlaylist[]> => {
  const playlists: SpotifyPlaylist[] = [];
  let url: string | null = `${SPOTIFY_API}/me/playlists?limit=50`;

  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json() as { items: SpotifyPlaylist[]; next: string | null };
    playlists.push(...data.items);
    url = data.next;
  }

  return playlists;
};

const main = async () => {
  assert(SPOTIFY_CLIENT_ID, "process.env.SPOTIFY_CLIENT_ID is not set");
  assert(SPOTIFY_CLIENT_SECRET, "process.env.SPOTIFY_CLIENT_SECRET is not set");

  const token = await getAccessToken();

  console.log("Fetching playlists from Spotify...");
  const all = await fetchAllPlaylists(token);
  const publicPlaylists = all.filter((p) => p.public);

  console.log(`Found ${publicPlaylists.length} public playlists (${all.length} total)`);

  const lines = publicPlaylists.map((p) => `${p.name}, ${p.external_urls.spotify}`);
  fs.writeFileSync(PLAYLISTS_FILE, lines.join("\n") + "\n");

  console.log(`✅ Written to ${PLAYLISTS_FILE}`);
  publicPlaylists.forEach((p) => console.log(`  - ${p.name}`));
};

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
