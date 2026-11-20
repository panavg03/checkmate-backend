declare const process: { exit(code?: number): never };

import { redis } from "../../../shared/db/redis.js";
import { getlb, getscore, update } from "../../../colyseus/src/rooms/GameLb.js";

async function main() {
  await redis.flushdb();

  const first = await update("alpha", "Alpha", 1, 12);
  if (!first.applied || first.gained !== 200) throw new Error("first completion should score 200");
  if ((await getscore("alpha")) !== 1) throw new Error("team should have one completed level");

  await update("alpha", "Alpha", 2, 12);
  if ((await getscore("alpha")) !== 2) throw new Error("team completion count should be two");

  for (let i = 0; i < 30; i++) await update(`team-${i}`, `Team ${i}`, 3, i * 60);
  const leaderboard = await getlb();
  if (leaderboard.length !== 10) throw new Error("leaderboard should return ten teams");
  if (leaderboard[0].teamId !== "alpha" && leaderboard[0].teamId !== "team-0") {
    throw new Error("leaderboard should be sorted by score");
  }

  await redis.flushdb();
  await redis.quit();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
