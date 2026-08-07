import { Room, Client, CloseCode, Messages } from "colyseus";
import { GameRoomState, Player } from "./schema/GameRoomState.js";
import { teamRooms } from "../teamRegistry.js";
import {levelFlags, levelCoords}  from "./GameConsts.js";
import { updateTeamScore, getTeamScore, getAllTeamScores } from "./GameLb.js";

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
        "quest": (client: Client, payload: any) => {
            //syncing flags
            this.state.flags.set(payload.flag, payload.value);
        },
        "start": (client: Client, payload: string) => {
            if(this.state.level != "lobby" && payload == "lobby") updateTeamScore(this.metadata.teamId);
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

            this.broadcast("start", { levelName: payload }, { afterNextPatch: true });
        },
        "despawn": (client: Client, itemName: string) => {
            this.broadcast("despawn", {itemName: itemName}, {afterNextPatch: true});
        },
        "complete": (client: Client) => {
            //reset flags to lobby flags
            this.state.flags.forEach((_, key) => {
                this.state.flags.delete(key);
            });
            //change coordinates to lobby spawn
        },
        "getlb": (client: Client) => {
            client.send("lb_result", {lb: getAllTeamScores()});
        },
        "getscore": (client: Client) => {
            client.send("score_res", {score: getTeamScore(this.metadata.teamId)});
        }
    }
}