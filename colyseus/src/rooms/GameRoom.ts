import { Room, Client, CloseCode, Messages } from "colyseus";
import { GameRoomState, Player } from "./schema/GameRoomState.js";

export class GameRoom extends Room {
    maxClients = 2;
    state = new GameRoomState();
    
    onJoin(client: Client, options: any) {
        //state syncing spawn
        const tmp_p = new Player();
        this.state.players.set(client.sessionId, tmp_p);
        console.log("A player joined", client.sessionId, this.state.players);
        client.send("welcome");
    }

    onDrop(client: Client, code: number){
        //10 seconds for testing purposes
        this.allowReconnection(client, 10);
        //autosave state
        console.log(client.sessionId, " connection dropped");
    }

    onReconnect(client: Client){
        //reconnection handling code
        console.log(client.sessionId, " reconnected");
    }

    onLeave(client: Client, code:number){
        //state syncing despawn
        this.state.players.delete(client.sessionId);
    }

    messages = {
        "move": (client: Client, payload:any) => {
            //syncing movements
            //console.log("player moved", payload);
            const player = this.state.players.get(client.sessionId);
            player.x = payload.x;
            player.y = payload.y;
            player.z = payload.z;
            player.yaw = payload.yaw;
            //this.state.players.set(client.sessionId, player);
        }
    }
}
