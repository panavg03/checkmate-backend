import { redis } from "../../../shared/db/redis.js";
/* --- rules: base points per level, minus 1 point per minute, floor at 40% --- */
const BASE = [100, 200, 300, 400];
const LOSS_PER_MINUTE = 1;
const FLOOR = 0.4;

const BOARD = "lb:board";                            
const awardsKey = (teamId: string) => `lb:awards:${teamId}`; 

const SCRIPT = `
local paid = redis.call('HGET', KEYS[2], ARGV[2])
if paid then
  return { 0, tonumber(paid), math.floor(tonumber(redis.call('ZSCORE', KEYS[1], ARGV[1]))) }
end
redis.call('HSET', KEYS[2], ARGV[2], ARGV[3])
local total = redis.call('ZINCRBY', KEYS[1], ARGV[3], ARGV[1])
return { 1, tonumber(ARGV[3]), math.floor(tonumber(total)) }
`;

type Client = typeof redis & {
  lbUpdate(board: string, awards: string, ...args: string[]): Promise<number[]>;
};

let ready = false;
function client(): Client {
  if (!ready) {
    redis.defineCommand("lbUpdate", { numberOfKeys: 2, lua: SCRIPT });
    ready = true;
  }
  return redis as Client;
}

/** points = base - minutes, never below 40% of base */
export function pointsFor(level: number, minutes: number): number {
  const base = BASE[level - 1] ?? BASE[0];
  return Math.round(Math.max(base * FLOOR, base - LOSS_PER_MINUTE * Math.max(0, minutes)));
}

export async function updateTeamScore(
  teamId: string,
  level: number,
  minutesTaken: number
): Promise<{ applied: boolean; gained: number; total: number }> {
  const points = pointsFor(level, minutesTaken);
  const [applied, gained, total] = await client().lbUpdate(
    BOARD, awardsKey(teamId),
    teamId, String(level), String(points)
  );
  return { applied: applied === 1, gained, total };
}

export async function getTeamScore(teamId: string): Promise<number> {
  const score = await redis.zscore(BOARD, teamId);
  return score === null ? 0 : Number(score);
}

export async function getAllTeamScores(): Promise<
  { rank: number; teamId: string; points: number }[]
> {
  const raw = await redis.zrevrange(BOARD, 0, -1, "WITHSCORES");
  const rows = [];
  for (let i = 0; i < raw.length; i += 2) {
    rows.push({ rank: i / 2 + 1, teamId: raw[i], points: Number(raw[i + 1]) });
  }
  return rows;
}