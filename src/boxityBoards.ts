import { BOXITY_BOARDS, BOXITY_BOARD_FIELDS, BOXITY_REPORT_MS, BOXITY_SCORES_PER_CALL, GUEST_ID_PREFIX } from "./constants.js";
import { getPlayers, type PlayerDoc } from "./db.js";

// Boxity leaderboards (docs.bloxity.io LEADERBOARDS). A game with its own server on Boxity hosting
// reports scores from the SERVER, out of the saved docs (Mongo), never straight from a client
// packet: WorldRoom marks a signed-in player whenever their save is loaded or changes, and every
// BOXITY_REPORT_MS the marked players' Wins / Power / Rebirths are read back and POSTed in batches,
// plus once more on shutdown (index.ts). Hosting injects BLOXITY_REPORT_TOKEN and BLOXITY_GAME_ID;
// without them (local dev, tests) nothing is marked or sent. Never throws into the game.

export type BoardScore = { board: string; userId: string; score: number };

let reporting = false;
let url = "";
let token = "";
const marked = new Set<string>(); // saved user ids whose scores changed since the last report

// "legion_<id>" for a Bloxity account id, "" for guests and local dev ids. A "#m..." mode suffix
// is dropped (none is added here, but the rule is Boxity's).
export function boxityUserId(userId: string): string {
  const id = (userId || "").split("#m")[0];
  if (!id || id.startsWith(GUEST_ID_PREFIX) || id.startsWith("dev-")) return "";
  return id.startsWith("legion_") ? id : `legion_${id}`;
}

// The scores these saved docs report: whole, finite and above zero only.
export function scoresOf(docs: Pick<PlayerDoc, "_id" | "trophies" | "energy" | "rebirths">[]): BoardScore[] {
  const out: BoardScore[] = [];
  for (const d of docs) {
    const userId = boxityUserId(d._id);
    if (!userId) continue;
    for (const b of BOXITY_BOARDS) {
      const score = Math.floor(Number(d[BOXITY_BOARD_FIELDS[b.id]]));
      if (Number.isFinite(score) && score > 0) out.push({ board: b.id, userId, score });
    }
  }
  return out;
}

// A signed-in player's save was loaded or changed: their scores go out with the next batch.
export function markScores(userId: string): void {
  if (reporting && boxityUserId(userId)) marked.add(userId);
}

// Sends one batch. True when it needs no retry (sent, or refused for good: a 4xx other than 429).
async function post(scores: BoardScore[]): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ boards: BOXITY_BOARDS, scores }),
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    if (!res.ok) {
      console.warn(`[boxity-boards] report failed (${res.status})`, text.slice(0, 300));
      return res.status >= 400 && res.status < 500 && res.status !== 429;
    }
    let dropped: Record<string, number> | undefined;
    try {
      dropped = JSON.parse(text)?.dropped;
    } catch {
      // Not JSON: nothing to read.
    }
    if (dropped && Object.values(dropped).some((n) => n > 0)) console.warn("[boxity-boards] scores dropped", dropped);
    return true;
  } catch (err) {
    console.warn("[boxity-boards] report failed", (err as Error)?.message ?? err);
    return false;
  }
}

// Reports every marked player's current scores. A failed read or send keeps them marked.
export async function flushScores(): Promise<void> {
  const players = getPlayers();
  if (!reporting || !players || !marked.size) return;
  const ids = [...marked];
  marked.clear();
  let scores: BoardScore[];
  try {
    const docs = await players.find({ _id: { $in: ids } }, { projection: { trophies: 1, energy: 1, rebirths: 1 } }).toArray();
    scores = scoresOf(docs);
  } catch (err) {
    console.warn("[boxity-boards] read failed", err);
    for (const id of ids) marked.add(id);
    return;
  }
  for (let i = 0; i < scores.length; i += BOXITY_SCORES_PER_CALL) {
    const batch = scores.slice(i, i + BOXITY_SCORES_PER_CALL);
    if (!(await post(batch))) for (const id of ids) marked.add(id); // re-sending a score is harmless
  }
}

// Called once at server start. No-op without the hosting credentials.
export function installBoardReporter(): void {
  const gameId = process.env.BLOXITY_GAME_ID;
  token = process.env.BLOXITY_REPORT_TOKEN || "";
  if (!token || !gameId) return;
  const api = (process.env.BLOXITY_API_URL || "https://api.bloxity.io").replace(/\/$/, "");
  url = `${api}/v1/leaderboards/hosted/${encodeURIComponent(gameId)}/report`;
  reporting = true;
  setInterval(() => void flushScores(), BOXITY_REPORT_MS).unref();
  console.log("[boxity-boards] reporting scores to", url);
}
