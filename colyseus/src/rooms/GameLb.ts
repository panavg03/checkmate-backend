import { redis } from "../db/redis.js";

const BOARD_KEY = "leaderboard:teams";
const NAMES_KEY = "leaderboard:team-names";
const LEVELS_KEY = "leaderboard:team-levels";
const levelTeamsKey = (level: number) => `leaderboard:level:${level}`;
const levelCountKey = (level: number) => `leaderboard:level:${level}:count`;

const LEVEL_COUNT = 4;
const BASE_POINTS = 100;
const MAX_BONUS = 100;
const LAST_BONUS_RANK = 25;
const BONUS_TIME_LIMIT_SECONDS = 30 * 60;

export type LeaderboardEntry = { teamId: string; teamName: string; score: number };
export type UpdateResult = { applied: boolean; gained: number; total: number; completed: number };

function validLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
}

function bonusFor(rank: number, timeTakenSeconds: number): number {
  if (rank < 1 || rank > LAST_BONUS_RANK) return 0;
  if (rank === 1) return MAX_BONUS;
  const normalizedTime = Math.min(Math.max(timeTakenSeconds, 0) / BONUS_TIME_LIMIT_SECONDS, 1);
  return Math.round(MAX_BONUS * (1 - normalizedTime) ** 2);
}

/** Record one team's completion of one level. */
export async function update(
  teamId: string,
  teamName: string,
  level: number,
  timeTakenSeconds: number,
): Promise<UpdateResult> {
  if (!teamId) throw new Error("teamId is required");
  if (!validLevel(level)) throw new Error("level must be between 1 and 4");

  const completionKey = levelTeamsKey(level);
  const applied = (await redis.sadd(completionKey, teamId)) === 1;
  const currentTotal = Number((await redis.zscore(BOARD_KEY, teamId)) ?? 0);
  const completed = Number((await redis.hget(LEVELS_KEY, teamId)) ?? 0);

  if (!applied) return { applied: false, gained: 0, total: currentTotal, completed };

  // INCR gives every newly-added team a unique finishing position without a
  // Lua script. It is only reached after SADD confirms this is a new solve.
  const rank = await redis.incr(levelCountKey(level));
  const gained = BASE_POINTS + bonusFor(rank, Number(timeTakenSeconds) || 0);
  const total = await redis.zincrby(BOARD_KEY, gained, teamId);
  await redis.hset(NAMES_KEY, teamId, teamName || teamId);
  const newCompleted = await redis.hincrby(LEVELS_KEY, teamId, 1);

  return { applied: true, gained, total: Number(total), completed: newCompleted };
}

/** Return the top ten teams, already shaped for JSON transport. */
export async function getlb(): Promise<LeaderboardEntry[]> {
  const raw = await redis.zrevrange(BOARD_KEY, 0, 9, "WITHSCORES");
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    const teamId = raw[i];
    entries.push({ teamId, teamName: (await redis.hget(NAMES_KEY, teamId)) ?? teamId, score: Number(raw[i + 1]) });
  }
  return entries;
}

/** Return how many of the four levels a team has completed. */
export async function getscore(teamId: string): Promise<number> {
  const completed = Number((await redis.hget(LEVELS_KEY, teamId)) ?? 0);
  return Math.min(Math.max(completed, 0), LEVEL_COUNT);
}
