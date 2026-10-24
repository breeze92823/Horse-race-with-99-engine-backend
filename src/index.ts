import { listen } from "@colyseus/tools";

import app from "./app.config.js";
import { connectDb } from "./db.js";
import { flushScores, installBoardReporter } from "./boxityBoards.js";

// Player-progress persistence (src/db.ts) connects before the room accepts
// players; connectDb() itself never throws or hangs (degrades to "no persistence").
await connectDb();

// Listens on PORT (or 2567). Colyseus traps SIGTERM (a Legion deploy / scale-down) and shuts down
// gracefully; the Boxity leaderboards get one last report on the way out.
const server = await listen(app);
installBoardReporter();
server.onShutdown(() => flushScores());
