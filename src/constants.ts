// Keep in step with the client's src/config.js by hand.
export const ROOM_MAX_CLIENTS = 50;

// Longest accepted strings.
export const NAME_MAX = 64;
// Profile picture URL (Bloxity `pfp`), relayed so other players can draw it.
export const PFP_MAX_LEN = 512;
// Presence (presence.ts): the Bloxity avatar JSON relayed for the others to draw, the most pets
// drawn per player, and the pose bounds (|x|, |y| and z up to `xy` m; z down to -`z` m: a race's
// track runs far down -Z; speed in m/s).
export const AVATAR_MAX_LEN = 3000;
export const PRESENCE_PETS_MAX = 8;
export const POSE_BOUNDS = { xy: 5000, z: 1e8, speed: 2000 };

// Colyseus drops the whole connection for a WebSocket message above this (default 4 KB).
export const MAX_PAYLOAD_BYTES = 128 * 1024;

// How long a dropped connection (WiFi blip, backgrounded tab) may reconnect with the same session.
export const RECONNECT_SECONDS = 20;

// Upper bounds for saved values, so a forged payload cannot store a bogus number. Generous
// ceilings, not game rules: the dearest engine costs ~3.6e28 Wins (client ENGINE gems).
export const CURRENCY_MAX = 1e33; // trophies (Wins), gems, lightning (energy)
export const REBIRTHS_MAX = 1e9;
export const DISTANCE_MAX = 1e15; // personal best race distance, studs
export const PLAY_SECONDS_MAX = 31_536_000; // ~1 year

// Owned catalog ids (client HORSES.list ~20, ENGINE ~34, PARTNER ~20, TRAILS ~29), with slack.
export const OWNED_MAX = 256;
// Pets (client PETS): at most PETS_MAX owned, PET_TIERS_MAX craft tiers, slots / storage the
// counters can grow to.
export const PETS_MAX = 1000;
export const PET_TIERS_MAX = 16;
export const PET_SLOTS_MAX = 50;
// Online Gifts (client GIFTS.list, 12 of them): claimed indexes and potion counts.
export const GIFTS_MAX = 64;
export const POTION_KINDS_MAX = 32;
export const POTION_COUNT_MAX = 1e9;
// Daily Reward (client DAILY.days): days in one calendar cycle.
export const DAILY_DAYS = 7;

// Spin wheel (client SPIN in config.js; spin.ts): one free spin every SPIN_EVERY_MS, stored up
// to SPIN_CAP; a new player starts with SPIN_START. SPINS_MAX bounds a saved count.
export const SPIN_EVERY_MS = 15 * 60 * 1000;
export const SPIN_CAP = 5;
export const SPIN_START = 1;
export const SPINS_MAX = 1e6;
// The wedges' prizes and odds (weights in %). Ids match the client's SPIN.wedges; the client
// decides what each prize is, the server only which one is won.
export const SPIN_WEDGES = [
  { id: "doubleWins", weight: 35 },
  { id: "wins50", weight: 25 },
  { id: "luck", weight: 35 },
  { id: "wins250", weight: 4.9 },
  { id: "hugePet", weight: 0.1 },
] as const;

// Leaderboards (leaderboard.ts; client plaza.js boards): the saved doc fields ranked (Rebirth,
// Wins, Power, Playtime), rows per board and how often the lists are re-read and re-sent.
export const LEADERBOARD_STATS = ["rebirths", "trophies", "energy", "playtime"] as const;
export type LeaderboardStat = (typeof LEADERBOARD_STATS)[number];
export const LEADERBOARD_SIZE = 10;
export const LEADERBOARD_EVERY_MS = 60 * 1000;

// Boxity leaderboards (boxityBoards.ts, docs.bloxity.io LEADERBOARDS): the boards on the game page
// and behind the in-game trophy button. The client declares the same list (config.js
// BOXITY_BOARDS, keep in step by hand). The FIRST declaration creates a board; after that the
// Boxity dashboard owns its settings, so ids are permanent. Wins and Power rank the current value
// like the plaza's boards (both are spent), Rebirths only ever goes up.
export const BOXITY_BOARDS = [
  { id: "wins", label: "Wins", order: "desc", mode: "latest", format: "compact", reset: "none" },
  { id: "power", label: "Power", order: "desc", mode: "latest", format: "compact", reset: "none" },
  { id: "rebirths", label: "Rebirths", order: "desc", mode: "best", format: "number", reset: "none" },
] as const;
export type BoxityBoardId = (typeof BOXITY_BOARDS)[number]["id"];
// The saved doc field each board ranks.
export const BOXITY_BOARD_FIELDS: Record<BoxityBoardId, "trophies" | "energy" | "rebirths"> = { wins: "trophies", power: "energy", rebirths: "rebirths" };
// Scores are batched: the changed players' scores every BOXITY_REPORT_MS (and on shutdown), at
// most BOXITY_SCORES_PER_CALL per request (Boxity's limit).
export const BOXITY_REPORT_MS = 20 * 1000;
export const BOXITY_SCORES_PER_CALL = 200;

// Ids from the client's catalogs (horses, engines incl. `ladder-N`, partners, trails, pet kinds,
// potions): camelCase slugs, so nothing odd is stored.
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

// The client's per-browser fallback id for players who are not signed in to Bloxity.
// Guests are never persisted.
export const GUEST_ID_PREFIX = "guest-";
