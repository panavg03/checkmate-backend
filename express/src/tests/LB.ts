import { redis } from "../../../shared/db/redis.js";
import {
  updateTeamScore,
  getTeamScore,
  getAllTeamScores,
  pointsFor,
} from "../../../colyseus/src/rooms/GameLb.js";

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, actual: unknown = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`, actual);
  } else {
    failed++;
    console.log(`  FAIL  ${label}`, actual);
  }
}

async function main() {
  await redis.flushdb();

  console.log("\nPoints by level and minutes taken:");
  console.log("  mins:     0    15    30    60   120   240");
  for (const level of [1, 2, 3, 4]) {
    const row = [0, 15, 30, 60, 120, 240]
      .map((m) => String(pointsFor(level, m)).padStart(5))
      .join(" ");
    console.log(`  L${level}:   ${row}`);
  }

  console.log("\nFormula:");
  check("full points at 0 minutes", pointsFor(1, 0) === 100, pointsFor(1, 0));
  check("loses 1 point per minute", pointsFor(2, 30) === 170, pointsFor(2, 30));
  check("floor is 40% of base", pointsFor(4, 9999) === 160, pointsFor(4, 9999));
  check("floor stops falling", pointsFor(3, 200) === pointsFor(3, 5000), pointsFor(3, 5000));
  check("negative minutes ignored", pointsFor(1, -50) === 100, pointsFor(1, -50));
  check("bad level falls back to L1", pointsFor(99, 0) === 100, pointsFor(99, 0));

  console.log("\nAwarding:");
  const first = await updateTeamScore("alpha", 1, 10);
  check("first award applies", first.applied === true);
  check("gains base minus minutes", first.gained === 90, first.gained);
  check("total matches gain", first.total === 90, first.total);

  const second = await updateTeamScore("alpha", 2, 30);
  check("second level adds on top", second.total === 260, second.total);
  check("stored total agrees", (await getTeamScore("alpha")) === 260, await getTeamScore("alpha"));

  console.log("\nIdempotency (the important part):");
  const replays = [];
  for (let i = 0; i < 5; i++) replays.push(await updateTeamScore("alpha", 1, 999));

  check("replay reports applied:false", replays.every((r) => !r.applied));
  check("replay returns ORIGINAL points", replays.every((r) => r.gained === 90), replays[0].gained);
  check("replay does not change total", (await getTeamScore("alpha")) === 260, await getTeamScore("alpha"));

  const burst = await Promise.all(
    Array.from({ length: 20 }, () => updateTeamScore("race", 3, 20))
  );
  check("20 simultaneous calls apply once", burst.filter((r) => r.applied).length === 1);
  check("score reflects a single award", (await getTeamScore("race")) === 280, await getTeamScore("race"));

  console.log("\nReading:");
  check("unknown team scores 0", (await getTeamScore("ghost")) === 0);

  for (let i = 1; i <= 6; i++) await updateTeamScore(`team${i}`, (i % 4) + 1, i * 3);

  const board = await getAllTeamScores();
  check("every team appears once", new Set(board.map((r) => r.teamId)).size === board.length, board.length);
  check("ranks run 1..N", board.every((r, i) => r.rank === i + 1));
  check("sorted highest first", board.every((r, i) => i === 0 || board[i - 1].points >= r.points));
  check("scores match getTeamScore", (await getTeamScore(board[0].teamId)) === board[0].points);

  console.log("\n  " + board.map((r) => `${r.rank}:${r.teamId}=${r.points}`).join("  "));

  await redis.flushdb();
  await redis.quit();

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Test crashed:", err);
  process.exit(1);
});