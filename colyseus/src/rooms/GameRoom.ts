import { Room, Client, CloseCode } from "colyseus";
import { GameRoomState } from "./schema/GameRoomState.js";

export class GameRoom extends Room {
    maxClients = 2;
    state = new GameRoomState();
    
    onJoin(client: Client, options: any) {
        console.log("player joined");
        client.send("welcome");
    }
}
