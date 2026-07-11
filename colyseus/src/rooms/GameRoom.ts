import { Room, Client } from "colyseus";
import { GameRoomState, Player } from "./schema/GameRoomState.js";
import { teamRooms } from "../teamRegistry.js";

export class GameRoom extends Room {
    maxClients = 4;
    state = new GameRoomState();

    onCreate(options: any) {
        this.setMetadata({ teamId: options.teamId });
        teamRooms.set(options.teamId, this.roomId);
        console.log("Room created for team:", options.teamId, "| roomId:", this.roomId);
    }

    onDispose() {
        teamRooms.delete(this.metadata?.teamId);
        console.log("Room disposed for team:", this.metadata?.teamId);
    }
    
    onJoin(client: Client, options: any) {
        
        if (options.teamId !== this.metadata.teamId) {
            client.leave(4000);
            return;
        }
        const player = new Player();
        
        this.state.players.set(client.sessionId, player);

        console.log("A player joined", client.sessionId, this.state.players);
        client.send("welcome");
    }

    onDrop(client: Client, code: number){
        //10 seconds for testing purposes
        // 4000 is Consented drop 
        if(code !== 4000) this.allowReconnection(client, 10);
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
