import { defineServer, defineRoom } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { GameRoom } from "./rooms/GameRoom.js";
 
const server = defineServer({
    transport: new WebSocketTransport(),
    rooms: {
        gameroom: defineRoom(GameRoom),
    },
    express: (app) => {
        app.get("/", (req, res) => {
            res.send("running colyseus server");
        });
    }
});

export default server;