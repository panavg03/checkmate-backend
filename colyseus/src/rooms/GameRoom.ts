import { Room, Client, CloseCode, Messages } from "colyseus";
import { GameRoomState, Player } from "./schema/GameRoomState.js";

const levelFlags: Record<string, string[]> = {
    "dora": ["TRANSLATE", "LOCKER_OPEN", "BIGLIGHT", "LARGE_DOOR"]
}

export class GameRoom extends Room {
    maxClients = 4;
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
        },
        "quest": (client: Client, payload: string) => {
            //syncing flags
            this.state.flags.set(payload, true);
        },
        "start": (client: Client, payload: string) => {
            //syncing flags
            this.state.level = payload;
            let flags = levelFlags[this.state.level];
            for(let flag of flags){
                this.state.flags.set(flag, false);
            }
            //change coordinates to level spawn
        },
        "complete": (client: Client) => {
            //reset flags to lobby flags
            this.state.flags.forEach((_, key) => {
                this.state.flags.delete(key);
            });
            //change coordinates to lobby spawn
        }
    }
}
