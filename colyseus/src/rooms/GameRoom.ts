import { Room, Client, CloseCode, Messages } from "colyseus";
import { GameRoomState, Player } from "./schema/GameRoomState.js";
import { teamRooms } from "../teamRegistry.js";
import {levelFlags, levelCoords, levelNames}  from "./GameConsts.js";
//import { updateTeamScore, getTeamScore, getAllTeamScores } from "./GameLb.js";
import { validateTeamCreation, validateTeamJoin } from "./GameDb.js";

let tmpCache: Record<string, any> = {};

export class GameRoom extends Room {
    maxClients = 4;
    state = new GameRoomState();
    
    async onCreate(options: any) {
        const validTeam = await validateTeamCreation(options.email);
        if(!validTeam){
            this.disconnect();
            return;
        }

        this.setMetadata({ teamId: options.teamId });
        console.log("Room created for team:", options.teamId, "| roomId:", this.roomId);
        tmpCache[options.teamId]=true;

        for(let levelName of levelNames){
            this.state.completed.set(levelName, false);
        }
    }

    onDispose() {
        delete tmpCache[this.metadata.teamId];
        console.log("Room disposed for team:", this.metadata?.teamId);
    }

    async onJoin(client: Client, options: any) {

        if (options.teamId !== this.metadata.teamId) {
            client.leave(4000);
            return;
        }

        const validJoin = await validateTeamJoin(options.teamId, options.email);
        if(!validJoin){
            client.leave(4000);
            return;
        }
        //state syncing spawn

        const player = new Player();
        //setup to current levels spawn
        const levelSpawnCoords = levelCoords[this.state.level];
        player.x = levelSpawnCoords[0];
        player.y = levelSpawnCoords[1];
        player.z = levelSpawnCoords[2];
        this.state.players.set(client.sessionId, player);
        //change scene to current level
        if(this.state.level!="Lobby") client.send("start", { levelName: this.state.level });
        //setup flags
        this.state.flags.forEach((_, key)=>{
            client.send("quest", {flagName: key});
        })
        //setup despawns
        this.state.flags.forEach((_, key)=>{
            client.send("despawn", {itemName: key});
        })

        console.log("A player joined", client.sessionId, this.state.players);
        client.send("welcome");
    }

    onDrop(client: Client, code: number){
        //10 seconds for testing purposes
        // 4000 is Consented drop 
        //autosave state
        console.log(client.sessionId, " connection dropped");
    }

    onLeave(client: Client, code:number){
        //state syncing despawn
        this.state.players.delete(client.sessionId);
    }

    messages = {
        "move": (client: Client, payload:any) => {
            //syncing movements
            const player = this.state.players.get(client.sessionId);
            player.x = payload.x;
            player.y = payload.y;
            player.z = payload.z;
            player.yaw = payload.yaw;
        },
        "quest": (client: Client, payload: any) => {
            //syncing flags
            this.state.flags.set(payload, true);
            this.broadcast("quest", {flagName: payload}, {afterNextPatch: true});
        },
        "start": async (client: Client, payload: string) => {
            if(payload=="Lobby"){
                //completed code
                this.state.completed.set(this.state.level, true);
                //const levelNum = levelNames.indexOf(this.state.level);
                //await updateTeamScore(this.metadata.teamId, levelNum+1, 10);
                this.state.flags.forEach((_, key) => {
                    this.state.flags.delete(key);
                });
                this.state.despawns.forEach((_, key) => {
                    this.state.despawns.delete(key);
                });

                this.state.level = payload;

                let [x, y, z] = levelCoords[payload];

                let index = 0;
                const total = this.state.players.size;
                this.state.players.forEach((value: Player, key: any) => {
                    const angle = (index / total) * Math.PI * 2;
                    const radius = 1.5;
                    value.x = x + Math.cos(angle) * radius;
                    value.y = y;
                    value.z = z + Math.sin(angle) * radius;
                    this.state.players.set(key, value);
                    index++;
                });

                this.broadcast("start", { levelName: payload }, { afterNextPatch: true });
            }else if(this.state.completed.get(payload)==false){ 
                this.state.level = payload;

                let [x, y, z] = levelCoords[payload];

                let index = 0;
                const total = this.state.players.size;
                this.state.players.forEach((value: Player, key: any) => {
                    const angle = (index / total) * Math.PI * 2;
                    const radius = 1.5;
                    value.x = x + Math.cos(angle) * radius;
                    value.y = y;
                    value.z = z + Math.sin(angle) * radius;
                    this.state.players.set(key, value);
                    index++;
                });

                this.broadcast("start", { levelName: payload }, { afterNextPatch: true });
            }
        },
        "despawn": (client: Client, itemName: string) => {
            this.state.despawns.set(itemName, true);
            this.broadcast("despawn", {itemName: itemName}, {afterNextPatch: true});
        },
        "getlb": async (client: Client) => {
            //const res = await getAllTeamScores();
            //client.send("lb_result", {lb: res)});
        },
        "getscore": async (client: Client) => {
            //const res = await getTeamScore(this.metadata.teamId);
            //this.broadcast("score_res", {score: res)});
        }
    }
}