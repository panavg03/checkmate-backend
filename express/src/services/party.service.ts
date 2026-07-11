import crypto from "crypto";
import {
    Party,
    PartyMember,
    CreatePartyInput,
    JoinPartyInput,
} from "../models/party";

const parties = new Map<string, Party>();

export class PartyService {

    /**
     * Generate a unique 6-character invite code
     */
    private generateInviteCode(): string {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";

        do {
            code = "";

            for (let i = 0; i < 6; i++) {
                code += chars.charAt(
                    Math.floor(Math.random() * chars.length)
                );
            }

        } while (parties.has(code));

        return code;
    }

    /**
     * Create a new party
     */
    public createParty(input: CreatePartyInput): Party {

        const inviteCode = this.generateInviteCode();

        const leader: PartyMember = {
            userId: input.userId,
            username: input.username,
            joinedAt: new Date(),
            isLeader: true,
            isReady: false,
            isConnected: true,
        };

        const party: Party = {
            id: crypto.randomUUID(),
            inviteCode,
            leaderId: input.userId,
            members: [leader],
            maxPlayers: 4,
            status: "waiting",
            createdAt: new Date(),
        };

        parties.set(inviteCode, party);

        return party;
    }

    /**
     * Get party using invite code
     */
    public getParty(inviteCode: string): Party | undefined {
        return parties.get(inviteCode);
    }

    /**
     * Delete a party
     */
    public deleteParty(inviteCode: string): boolean {
        return parties.delete(inviteCode);
    }

    /**
     * Get all active parties (mainly for debugging)
     */
    public getAllParties(): Party[] {
        return Array.from(parties.values());
    }

    /**
 * Join an existing party using invite code
 */
public joinParty(input: JoinPartyInput): Party {

    const party = parties.get(input.inviteCode);

    if (!party) {
        throw new Error("Party not found.");
    }

    if (party.status !== "waiting") {
        throw new Error("Game has already started.");
    }

    if (party.members.length >= party.maxPlayers) {
        throw new Error("Party is full.");
    }

    const alreadyJoined = party.members.find(
        member => member.userId === input.userId
    );

    if (alreadyJoined) {
        throw new Error("User already joined this party.");
    }

    const newMember: PartyMember = {
        userId: input.userId,
        username: input.username,
        joinedAt: new Date(),
        isLeader: false,
        isReady: false,
        isConnected: true,
    };

    party.members.push(newMember);

    return party;
}
}