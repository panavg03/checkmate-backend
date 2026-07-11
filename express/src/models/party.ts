export interface PartyMember {
    userId: string;
    username: string;
    joinedAt: Date;
    isLeader: boolean;
    isReady: boolean;
    isConnected: boolean;
}

export interface Party {
    id: string;
    inviteCode: string;
    leaderId: string;
    members: PartyMember[];
    maxPlayers: number;
    status: "waiting" | "starting" | "playing" | "finished";
    createdAt: Date;
}

export interface CreatePartyInput {
    userId: string;
    username: string;
}

export interface JoinPartyInput {
    inviteCode: string;
    userId: string;
    username: string;
}

export interface LeavePartyInput {
    inviteCode: string;
    userId: string;
}

export interface KickPlayerInput {
    inviteCode: string;
    leaderId: string;
    targetUserId: string;
}