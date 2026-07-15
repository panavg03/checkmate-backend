export enum Role {
  PLAYER = "PLAYER",
  ADMIN = "ADMIN",
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: Role;
}

export interface UserAuthRecord {
  userid: number;
  googleid: string;
  email: string;
  username: string;
  createdat: Date;
  lastlogin: Date | null;
  role: string;
}

export interface GoogleProfilePayload {
  googleId: string;
  email: string;
  displayName: string;
}
