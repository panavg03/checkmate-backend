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