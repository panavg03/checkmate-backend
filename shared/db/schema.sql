/* 
            DATABASE NAME:  ctf_db
            
            Agar nahi bana toh run this:
            CREATE DATABASE ctf_db;

            Then connect karlo:
            \c ctf_db;
*/


CREATE TABLE IF NOT EXISTS user_auth (
    userId INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    googleId TEXT UNIQUE NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    username VARCHAR(50) UNIQUE NOT NULL,

    createdAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    lastLogin TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS parties (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    passwordHash VARCHAR(255),
    leaderId INT NOT NULL REFERENCES user_auth(userId) ON DELETE CASCADE,
    maxPlayers INT NOT NULL DEFAULT 4,
    createdAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS party_members (
    partyId VARCHAR(36) NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    userId INT NOT NULL REFERENCES user_auth(userId) ON DELETE CASCADE,
    joinedAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (partyId, userId)
);