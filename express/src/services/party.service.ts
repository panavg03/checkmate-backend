import crypto from "crypto";
import { CreatePartyInput, JoinPartyInput, Party } from "../models/party";
import {
    dbCreateParty,
    dbGetParty,
    dbGetPartyMembers,
    dbAddMember,
    dbRemoveMember,
    dbDeleteParty,
    dbUpdateLeader
} from "../../../shared/db/party";

function generateShortId(): string {
    return crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 characters
}

function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(":");
    const salt = parts[0];
    const hash = parts[1];
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === verifyHash;
}

export class PartyService {
    static async createParty(input: CreatePartyInput): Promise<Omit<Party, 'passwordHash'> & { hasPassword: boolean }> {
        if (!input.name || input.name.trim() === "") {
            throw new Error("Party name is required");
        }

        const partyId = generateShortId();
        let passwordHash: string | null = null;
        if (input.password && input.password.trim() !== "") {
            passwordHash = hashPassword(input.password);
        }

        const maxPlayers = input.maxPlayers ?? 4;
        if (maxPlayers < 1) {
            throw new Error("maxPlayers must be at least 1");
        }

        await dbCreateParty({
            id: partyId,
            name: input.name,
            passwordHash,
            leaderId: input.leaderId,
            maxPlayers
        });

        return {
            id: partyId,
            name: input.name,
            leaderId: input.leaderId,
            maxPlayers,
            createdAt: new Date(),
            hasPassword: passwordHash !== null
        };
    }

    static async joinParty(input: JoinPartyInput): Promise<void> {
        const party = await dbGetParty(input.partyId);
        if (!party) {
            const error = new Error("Party not found");
            (error as any).status = 404;
            throw error;
        }

        const members = await dbGetPartyMembers(input.partyId);
        
        // Check if user is already in the party
        const isAlreadyMember = members.some(m => m.userId === input.userId);
        if (isAlreadyMember) {
            return; // Already joined
        }

        // Check capacity
        if (members.length >= party.maxPlayers) {
            const error = new Error("Party is full");
            (error as any).status = 400;
            throw error;
        }

        // Check password
        if (party.passwordHash) {
            if (!input.password || !verifyPassword(input.password, party.passwordHash)) {
                const error = new Error("Incorrect password");
                (error as any).status = 401;
                throw error;
            }
        }

        await dbAddMember(input.partyId, input.userId);
    }

    static async leaveParty(partyId: string, userId: number): Promise<void> {
        const party = await dbGetParty(partyId);
        if (!party) {
            const error = new Error("Party not found");
            (error as any).status = 404;
            throw error;
        }

        const members = await dbGetPartyMembers(partyId);
        const isMember = members.some(m => m.userId === userId);
        if (!isMember) {
            return; // Not in party anyway
        }

        // Remove from members
        await dbRemoveMember(partyId, userId);

        const remainingMembers = members.filter(m => m.userId !== userId);
        if (remainingMembers.length === 0) {
            // Delete party if empty
            await dbDeleteParty(partyId);
        } else if (party.leaderId === userId) {
            // If leader left, transfer leadership to the next oldest member
            const nextLeader = remainingMembers[0];
            if (nextLeader) {
                await dbUpdateLeader(partyId, nextLeader.userId);
            }
        }
    }

    static async getPartyDetails(partyId: string) {
        const party = await dbGetParty(partyId);
        if (!party) {
            const error = new Error("Party not found");
            (error as any).status = 404;
            throw error;
        }

        const members = await dbGetPartyMembers(partyId);
        
        return {
            id: party.id,
            name: party.name,
            leaderId: party.leaderId,
            maxPlayers: party.maxPlayers,
            createdAt: party.createdAt,
            hasPassword: party.passwordHash !== null,
            members: members.map(m => ({
                userId: m.userId,
                username: m.username,
                joinedAt: m.joinedAt
            }))
        };
    }
}
