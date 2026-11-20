import { defineServer, defineRoom } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { GameRoom } from "./rooms/GameRoom.js"
import { teamRooms } from "./teamRegistry.js";
import { validateTeamCreation } from "./rooms/GameDb.js";
import pool from "./db/pg.js";
import { redis } from "./db/redis.js";
 
const server = defineServer({
    transport: new WebSocketTransport(),
    rooms: {
        gameroom: defineRoom(GameRoom).filterBy(['teamId']),  
    },
    express: (app) => {
        app.get("/health", async (_req, res) => {
            try {
                await Promise.all([
                    pool.query("SELECT 1"),
                    redis.ping(),
                ]);

                res.status(200).json({
                    status: "ok",
                    postgres: "ok",
                    redis: "ok",
                });
            } catch (error) {
                console.error("Health check failed:", error);
                res.status(503).json({
                    status: "error",
                    postgres: "unknown",
                    redis: "unknown",
                });
            }
        });

        app.get("/", (req, res) => {
            res.send(validateTeamCreation("1234"));
            /*console.log({
                host: process.env.DATABASE_HOST,
                port: Number(process.env.DATABASE_PORT),
                user: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
            })*/
        });

        /*app.get("/join-create-room", (req, res) => {
            const teamId = req.query.teamId as string;

            if (!teamId) {
                res.status(400).json({ error: "teamId is required" });
                return;
            }

            const roomId = teamRooms.get(teamId);

            if (!roomId) {
                res.json({ status: "not_found" });
                return;
            }

            res.json({ status: "found", roomId });
        });*/
    }
});

export default server;
