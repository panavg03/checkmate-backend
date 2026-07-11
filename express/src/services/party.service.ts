import crypto from "crypto";
import { CreatePartyInput, JoinPartyInput, Party, PartyMember } from "../models/party";
import {
    dbCreateParty,
    dbGetParty,
    dbGetPartyMembers,
    dbAddMember,
    dbRemoveMember,
    dbDeleteParty,
    dbUpdateLeader,
} from "../../../shared/db/party";

const MAX_PLAYERS = 4;

function generateInviteCode(): string {
    return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const check = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === check;
}

function httpError(message: string, status: number): Error {
    const err = new Error(message);
    (err as any).status = status;
    return err;
}

export interface PartyDetails extends Party {
    members: PartyMember[];
}

export class PartyService {
    static async createParty(input: CreatePartyInput): Promise<Party> {
        const maxPlayers = input.maxPlayers ?? MAX_PLAYERS;
        if (maxPlayers < 1 || maxPlayers > MAX_PLAYERS) {
            throw httpError(`maxPlayers must be between 1 and ${MAX_PLAYERS}`, 400);
        }

        const name = input.name?.trim() || "Team";
        const passwordHash =
            input.password && input.password.trim() !== "" ? hashPassword(input.password) : null;

        let id = generateInviteCode();
        while (await dbGetParty(id)) {
            id = generateInviteCode();
        }

        await dbCreateParty({ id, name, passwordHash, leaderId: input.leaderId, maxPlayers });

        return {
            id,
            name,
            leaderId: input.leaderId,
            maxPlayers,
            hasPassword: passwordHash !== null,
            createdAt: new Date(),
        };
    }

    static async joinParty(input: JoinPartyInput): Promise<void> {
        const party = await dbGetParty(input.partyId);
        if (!party) throw httpError("Party not found", 404);

        const members = await dbGetPartyMembers(input.partyId);
        if (members.some((m) => m.userId === input.userId)) return;

        if (members.length >= party.maxPlayers) throw httpError("Party is full", 400);

        if (party.passwordHash) {
            if (!input.password || !verifyPassword(input.password, party.passwordHash)) {
                throw httpError("Incorrect password", 401);
            }
        }

        await dbAddMember(input.partyId, input.userId);
    }

    static async leaveParty(partyId: string, userId: string): Promise<void> {
        const party = await dbGetParty(partyId);
        if (!party) throw httpError("Party not found", 404);

        const members = await dbGetPartyMembers(partyId);
        if (!members.some((m) => m.userId === userId)) return;

        await dbRemoveMember(partyId, userId);

        const remaining = members.filter((m) => m.userId !== userId);
        if (remaining.length === 0) {
            await dbDeleteParty(partyId);
        } else if (party.leaderId === userId) {
            await dbUpdateLeader(partyId, remaining[0].userId);
        }
    }

    static async kickPlayer(partyId: string, leaderId: string, targetUserId: string): Promise<void> {
        const party = await dbGetParty(partyId);
        if (!party) throw httpError("Party not found", 404);

        if (party.leaderId !== leaderId) throw httpError("Only the leader can kick players", 403);
        if (leaderId === targetUserId) throw httpError("Leader cannot kick themselves", 400);

        const members = await dbGetPartyMembers(partyId);
        if (!members.some((m) => m.userId === targetUserId)) {
            throw httpError("Player is not in the party", 404);
        }

        await dbRemoveMember(partyId, targetUserId);
    }

    static async getPartyDetails(partyId: string): Promise<PartyDetails> {
        const party = await dbGetParty(partyId);
        if (!party) throw httpError("Party not found", 404);

        const members = await dbGetPartyMembers(partyId);
        return {
            id: party.id,
            name: party.name,
            leaderId: party.leaderId,
            maxPlayers: party.maxPlayers,
            hasPassword: party.passwordHash !== null,
            createdAt: party.createdAt,
            members: members.map((m) => ({
                userId: m.userId,
                username: m.username,
                joinedAt: m.joinedAt,
            })),
        };
    }
}
