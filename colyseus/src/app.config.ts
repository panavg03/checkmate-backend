import { defineServer, defineRoom } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { GameRoom } from "./rooms/GameRoom.js"
import { teamRooms } from "./teamRegistry.js";
 
const server = defineServer({
    transport: new WebSocketTransport(),
    rooms: {
        gameroom: defineRoom(GameRoom),  
    },
    express: (app) => {
        app.get("/", (req, res) => {
            res.send("running colyseus server");
        });

        /**
         * GET /find-room?teamId=xxx
         * Returns:
         *   { status: "not_found" }              → no room yet, client should create
         *   { status: "found", roomId: "..." }   → room exists, client should joinById
         *   { status: "full" }                   → room exists but is full (4/4)
         */
        app.get("/find-room", (req, res) => {
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
        });
    }
});

export default server;
