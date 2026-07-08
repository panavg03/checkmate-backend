export interface Party {
    id: string;
    name: string;
    passwordHash: string;
    leaderId: number;
    maxPlayers: number;
    createdAt: Date;
}

export interface CreatePartyInput {
    name: string;
    password?: string;
    maxPlayers?: number;
    leaderId: number;
}

export interface JoinPartyInput {
    partyId: string;
    userId: number;
    password?: string;
}
