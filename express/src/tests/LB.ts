declare const process: {
  exit(code?: number): never;
};

import { redis } from "../../../shared/db/redis.js";
import {
  updateTeamScore,
  getTeamScore,
  getAllTeamScores,
  getLevelSolveCount,
  pointsFor,
  bonusFor,
  baseFor,
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

  console.log("\nPoints by level and finishing position:");
  console.log("  rank:     1     2     5    10    11    50");
  for (const level of [1, 2, 3, 4]) {
    const row = [1, 2, 5, 10, 11, 50]
      .map((r) => String(pointsFor(level, r)).padStart(5))
      .join(" ");
    console.log(`  L${level}:   ${row}`);
  }

  console.log("\nFormula:");
  check("first place gets +100", bonusFor(1) === 100, bonusFor(1));
  check("second place gets +90", bonusFor(2) === 90, bonusFor(2));
  check("tenth place gets +10", bonusFor(10) === 10, bonusFor(10));
  check("eleventh place gets nothing", bonusFor(11) === 0, bonusFor(11));
  check("far back gets nothing", bonusFor(500) === 0, bonusFor(500));
  check("bonus steps down by 10", [1,2,3,4,5,6,7,8,9,10].every((r) => bonusFor(r) - bonusFor(r + 1) === 10));
  check("first on L1 scores 200", pointsFor(1, 1) === 200, pointsFor(1, 1));
  check("first on L4 scores 500", pointsFor(4, 1) === 500, pointsFor(4, 1));
  check("late finisher gets base only", pointsFor(3, 25) === 300, pointsFor(3, 25));
  check("bad level falls back to L1", baseFor(99) === 100, baseFor(99));

  console.log("\nAwarding:");
  const first = await updateTeamScore("alpha", 1);
  check("first award applies", first.applied === true);
  check("first team ranks 1", first.rank === 1, first.rank);
  check("gains base plus full bonus", first.gained === 200, first.gained);
  check("total matches gain", first.total === 200, first.total);

  const second = await updateTeamScore("bravo", 1);
  check("second team ranks 2", second.rank === 2, second.rank);
  check("second team gains 190", second.gained === 190, second.gained);

  const nextLevel = await updateTeamScore("bravo", 2);
  check("each level races separately", nextLevel.rank === 1, nextLevel.rank);
  check("first on L2 gains 300", nextLevel.gained === 300, nextLevel.gained);
  check("levels stack up", nextLevel.total === 490, nextLevel.total);
  check("stored total agrees", (await getTeamScore("bravo")) === 490, await getTeamScore("bravo"));

  console.log("\nThe bonus ladder, end to end:");
  const ladder = [];
  for (let i = 1; i <= 13; i++) ladder.push(await updateTeamScore(`ladder${i}`, 3));

  check("ranks run 1..13 in order", ladder.every((r, i) => r.rank === i + 1), ladder.map((r) => r.rank).join(","));
  check("top ten step 100 down to 10",
    ladder.slice(0, 10).every((r, i) => r.gained === 300 + (100 - i * 10)),
    ladder.slice(0, 10).map((r) => r.gained).join(","));
  check("outside top ten is base only",
    ladder.slice(10).every((r) => r.gained === 300),
    ladder.slice(10).map((r) => r.gained).join(","));
  check("solve count tracks the level", (await getLevelSolveCount(3)) === 13, await getLevelSolveCount(3));
  check("untouched level has no solves", (await getLevelSolveCount(4)) === 0);

  console.log("\nIdempotency (the important part):");
  const replays = [];
  for (let i = 0; i < 5; i++) replays.push(await updateTeamScore("alpha", 1));

  check("replay reports applied:false", replays.every((r) => !r.applied));
  check("replay returns ORIGINAL points", replays.every((r) => r.gained === 200), replays[0].gained);
  check("replay returns ORIGINAL rank", replays.every((r) => r.rank === 1), replays[0].rank);
  check("replay does not change total", (await getTeamScore("alpha")) === 200, await getTeamScore("alpha"));
  check("replay does not burn a rank", (await getLevelSolveCount(1)) === 2, await getLevelSolveCount(1));

  const solo = await Promise.all(
    Array.from({ length: 20 }, () => updateTeamScore("race", 4))
  );
  check("20 simultaneous calls apply once", solo.filter((r) => r.applied).length === 1);
  check("score reflects a single award", (await getTeamScore("race")) === 500, await getTeamScore("race"));

  console.log("\nRace between different teams:");
  const burst = await Promise.all(
    Array.from({ length: 20 }, (_, i) => updateTeamScore(`burst${i}`, 2))
  );
  check("everyone is awarded", burst.every((r) => r.applied));
  check("no two teams share a rank", new Set(burst.map((r) => r.rank)).size === 20);
  check("exactly ten teams get a bonus", burst.filter((r) => r.gained > 200).length === 10,
    burst.filter((r) => r.gained > 200).length);
  check("bonuses handed out sum to 550",
    burst.reduce((sum, r) => sum + r.gained - 200, 0) === 550,
    burst.reduce((sum, r) => sum + r.gained - 200, 0));
  check("ranks are contiguous 1..20",
    burst.map((r) => r.rank).sort((a, b) => a - b).every((r, i) => r === i + 1));

  console.log("\nReading:");
  check("unknown team scores 0", (await getTeamScore("ghost")) === 0);

  const board = await getAllTeamScores();
  check("every team appears once", new Set(board.map((r) => r.teamId)).size === board.length, board.length);
  check("ranks run 1..N", board.every((r, i) => r.rank === i + 1));
  check("sorted highest first", board.every((r, i) => i === 0 || board[i - 1].points >= r.points));
  check("scores match getTeamScore", (await getTeamScore(board[0].teamId)) === board[0].points);

  console.log("\n  " + board.slice(0, 12).map((r) => `${r.rank}:${r.teamId}=${r.points}`).join("  "));

  await redis.flushdb();
  await redis.quit();

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Test crashed:", err);
  process.exit(1);
});
