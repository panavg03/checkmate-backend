import { redis } from "../../../shared/db/redis.js";


const BASE = [100, 200, 300, 400];
const BONUS_RANKS = 10;   
const BONUS_STEP = 10;  

const BOARD = "lb:board";
const awardsKey = (teamId: string) => `lb:awards:${teamId}`;
const solvesKey = (level: number) => `lb:solves:${level}`;


const SCRIPT = `
local paid = redis.call('HGET', KEYS[2], ARGV[2])
if paid then
  local total = redis.call('ZSCORE', KEYS[1], ARGV[1])
  local prevRank = redis.call('HGET', KEYS[2], ARGV[2] .. ':rank')
  return { 0, tonumber(paid), math.floor(tonumber(total)), tonumber(prevRank) }
end

local rank = redis.call('INCR', KEYS[3])
local ranks = tonumber(ARGV[4])
local bonus = 0
if rank <= ranks then
  bonus = (ranks + 1 - rank) * tonumber(ARGV[5])
end

local points = tonumber(ARGV[3]) + bonus
redis.call('HSET', KEYS[2], ARGV[2], points, ARGV[2] .. ':rank', rank)
local total = redis.call('ZINCRBY', KEYS[1], points, ARGV[1])
return { 1, points, math.floor(tonumber(total)), rank }
`;

type Client = typeof redis & {
  lbUpdate(board: string, awards: string, solves: string, ...args: string[]): Promise<number[]>;
};

let ready = false;
function client(): Client {
  if (!ready) {
    redis.defineCommand("lbUpdate", { numberOfKeys: 3, lua: SCRIPT });
    ready = true;
  }
  return redis as Client;
}

export function baseFor(level: number): number {
  return BASE[level - 1] ?? BASE[0];
}

export function bonusFor(rank: number): number {
  if (!Number.isFinite(rank) || rank < 1 || rank > BONUS_RANKS) return 0;
  return (BONUS_RANKS + 1 - Math.floor(rank)) * BONUS_STEP;
}

export function pointsFor(level: number, rank: number): number {
  return baseFor(level) + bonusFor(rank);
}

export async function updateTeamScore(
  teamId: string,
  level: number
): Promise<{ applied: boolean; gained: number; total: number; rank: number }> {
  const [applied, gained, total, rank] = await client().lbUpdate(
    BOARD, awardsKey(teamId), solvesKey(level),
    teamId, String(level), String(baseFor(level)),
    String(BONUS_RANKS), String(BONUS_STEP)
  );
  return { applied: applied === 1, gained, total, rank };
}

export async function getLevelSolveCount(level: number): Promise<number> {
  const n = await redis.get(solvesKey(level));
  return n === null ? 0 : Number(n);
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