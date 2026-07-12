export interface PartyMember {
    userId: string;
    username: string;
    joinedAt: Date;
}

export interface Party {
    id: string;
    name: string;
    leaderId: string;
    maxPlayers: number;
    hasPassword: boolean;
    createdAt: Date;
}

export interface CreatePartyInput {
    leaderId: string;
    name?: string;
    password?: string;
    maxPlayers?: number;
}

export interface JoinPartyInput {
    partyId: string;
    userId: string;
    password?: string;
}
