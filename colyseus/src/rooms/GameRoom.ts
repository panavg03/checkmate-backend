import { Room, Client, CloseCode, Messages } from "colyseus";
import { GameRoomState, Player } from "./schema/GameRoomState.js";
import { teamRooms } from "../teamRegistry.js";
import {levelFlags, levelCoords, levelNames}  from "./GameConsts.js";
import { getscore, update } from "./GameLb.js";
import { validateTeamCreation, validateTeamJoin } from "./GameDb.js";
import { dbGetParty } from "../db/party.js";

let tmpCache: Record<string, any> = {};

export class GameRoom extends Room {
    maxClients = 4;
    state = new GameRoomState();
    private levelStartedAt = Date.now();
    
    async onCreate(options: any) {
        /*const validTeam = await validateTeamCreation(options.email);
        if(!validTeam){
            return;
        }*/

        //const party = await dbGetParty(options.teamId);
        this.setMetadata({ teamId: options.teamId, teamName: options.teamName ??  options.teamId });
        console.log("Room created for team:", options.teamId, "| roomId:", this.roomId);
        tmpCache[options.teamId]=true;

        for(let levelName of levelNames){
            this.state.completed.set(levelName, false);
        }

        this.state.level = "Level1";
    }

    onDispose() {
        delete tmpCache[this.metadata.teamId];
        console.log("Room disposed for team:", this.metadata?.teamId);
    }

    async onJoin(client: Client, options: any) {
        console.log("JOIN ATTEMPT");
        console.log("session:", client.sessionId);
        console.log("options:", options);
        console.log("room team:", this.metadata.teamId);
        /*if (options.teamId !== this.metadata.teamId) {
            client.leave(4000);
            return;
        }*/

        /*const validJoin = await validateTeamJoin(options.email, options.teamId);
        if(!validJoin){
            console.log("INVALID JOIN ATTEMPT")
            client.leave(4000);
            return;
        }*/
        //state syncing spawn

        const player = new Player();
        //setup to current levels spawn
        const levelSpawnCoords = levelCoords[this.state.level];
        player.x = levelSpawnCoords[0];
        player.y = levelSpawnCoords[1];
        player.z = levelSpawnCoords[2];
        this.state.players.set(client.sessionId, player);
        //change scene to current level
        client.send("start", { levelName: this.state.level });
        //setup flags
        this.state.flags.forEach((_, key)=>{
            client.send("quest", {flagName: key});
        })
        //setup despawns
        this.state.flags.forEach((_, key)=>{
            client.send("despawn", {itemName: key});
        })
        console.log(JSON.stringify(this.state));
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

                this.state.flags.forEach((_, key) => {
                    this.state.flags.delete(key);
                });
                this.state.despawns.forEach((_, key) => {
                    this.state.despawns.delete(key);
                });

                this.state.level = payload;
                this.levelStartedAt = Date.now();

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
            }else if(this.state.completed.get(payload)!=true){ 
                console.log("Level request", payload);

                this.state.level = payload;
                this.levelStartedAt = Date.now();

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
        "getscore": async (client: Client) => {
            client.send("score_result", { score: await getscore(this.metadata.teamId) });
        },
        "finish": async (client: Client, payload: string) => {
            const levelNum = levelNames.indexOf(payload) + 1;

            if (levelNum < 1 || levelNum > 4) {
                client.send("finish_result", {
                    success: false,
                    error: "payload must be one of Level1, Level2, Level3, or Level4",
                });
                return;
            }

            const result = await update(
                this.metadata.teamId,
                this.metadata.teamName,
                levelNum,
                (Date.now() - this.levelStartedAt) / 1000,
            );

            this.state.completed.set(payload, true);
        }
    }
}
