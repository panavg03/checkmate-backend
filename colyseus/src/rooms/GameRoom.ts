import { Room, Client, CloseCode, Messages } from "colyseus";
import { GameRoomState, Player } from "./schema/GameRoomState.js";

export class GameRoom extends Room {
    maxClients = 2;
    state = new GameRoomState();
    
    onJoin(client: Client, options: any) {
        const tmp_p = new Player();
        this.state.players.set(client.sessionId, tmp_p);
        console.log("A player joined", client.sessionId, this.state.players);
        client.send("welcome");
    }

    messages = {
        "move": (client: Client, payload:any) => {
            //console.log("player moved", payload);
            const player = this.state.players.get(client.sessionId);
            player.x = payload.x;
            player.y = payload.y;
            player.z = payload.z;
            this.state.players.set(client.sessionId, player);
        }
    }
}
