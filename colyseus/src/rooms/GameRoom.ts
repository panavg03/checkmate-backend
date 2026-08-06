import { Room, Client, CloseCode, Messages } from "colyseus";
import { GameRoomState, Player } from "./schema/GameRoomState.js";
import { teamRooms } from "../teamRegistry.js";
import {levelFlags, levelCoords}  from "./GameConsts.js";

let tmpCache: Record<string, any> = {};

export class GameRoom extends Room {
    maxClients = 4;
    state = new GameRoomState();
    
    onCreate(options: any) {
        this.setMetadata({ teamId: options.teamId });
        console.log("Room created for team:", options.teamId, "| roomId:", this.roomId);
        tmpCache[options.teamId]=true;
    }

    onDispose() {
        delete tmpCache[this.metadata.teamId];
        console.log("Room disposed for team:", this.metadata?.teamId);
    }

    onJoin(client: Client, options: any) {
        if (options.teamId !== this.metadata.teamId) {
            client.leave(4000);
            return;
        }
        //state syncing spawn
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
        },
        "quest": (client: Client, payload: string) => {
            //syncing flags
            this.state.flags.set(payload, true);
        },
        "start": (client: Client, payload: string) => {
            //syncing flags
            this.state.level = payload;
            // let flags = levelFlags[this.state.level];
            // for(let flag of flags){
            //     this.state.flags.set(flag, false);
            // }
            let [x,y,z] = levelCoords[payload];
            this.state.players.forEach((value: Player, key: any) => {
                value.x = x;
                value.y = y;
                value.z = z;
                this.state.players.set(key, value);
            });

            // afterNextPatch: true delays this broadcast until AFTER the state patch above
            // has actually been flushed to all clients. Without this, clients could receive
            // this message (and call SceneManager.LoadScene) before their room.State.players
            // reflects the new x/y/z, causing the local player to spawn at a stale position
            // and fall out of the map.
            this.broadcast("start", { levelName: payload }, { afterNextPatch: true });
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