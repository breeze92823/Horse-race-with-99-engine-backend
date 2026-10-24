import assert from "assert";

import { boxityUserId, scoresOf } from "../src/boxityBoards.js";
import { applyEmote } from "../src/presence.js";
import { PlayerState } from "../src/rooms/schema/WorldState.js";

const doc = (_id: string, f: Record<string, unknown>) => ({ _id, ...f }) as any;

describe("boxity leaderboards", () => {
  it("reports only Bloxity accounts, as legion_<id> without a mode suffix", () => {
    assert.strictEqual(boxityUserId("abc123"), "legion_abc123");
    assert.strictEqual(boxityUserId("legion_abc123"), "legion_abc123");
    assert.strictEqual(boxityUserId("abc123#m2"), "legion_abc123");
    assert.strictEqual(boxityUserId("guest-x1"), "");
    assert.strictEqual(boxityUserId("dev-x1"), "");
    assert.strictEqual(boxityUserId(""), "");
  });

  it("turns saved docs into whole, positive scores per board", () => {
    const scores = scoresOf([
      doc("a", { trophies: 1234.9, energy: 50, rebirths: 2 }),
      doc("b", { trophies: 0, energy: Infinity, rebirths: -1 }),
      doc("guest-c", { trophies: 99 }),
    ]);
    assert.deepStrictEqual(scores, [
      { board: "wins", userId: "legion_a", score: 1234 },
      { board: "power", userId: "legion_a", score: 50 },
      { board: "rebirths", userId: "legion_a", score: 2 },
    ]);
  });
});

describe("emote presence", () => {
  it("counts plays so the same emote again is a change, and clears on end", () => {
    const p = new PlayerState();
    applyEmote(p, { id: "65f0c0ffee0000000000abcd" });
    assert.strictEqual(p.emote, "65f0c0ffee0000000000abcd:1");
    applyEmote(p, { id: "65f0c0ffee0000000000abcd" });
    assert.strictEqual(p.emote, "65f0c0ffee0000000000abcd:2");
    applyEmote(p, { id: "bad id!" });
    assert.strictEqual(p.emote, "65f0c0ffee0000000000abcd:2");
    applyEmote(p, { id: "" });
    assert.strictEqual(p.emote, "");
  });
});
