import { MapSchema, Schema, type } from "@colyseus/schema";

export class Player extends Schema{
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") z: number = 0;
    @type("number") yaw: number = 0;
}

export class Item extends Schema{
    @type("string") status: string = "DROPPED";
    @type("string") holder: string = "NONE";
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") z: number = 0;
}

export class DoraRoomState extends Schema {
    @type({map: Player}) players = new MapSchema<Player>();
    @type({map: Item}) items = new MapSchema<Player>();
    @type({map: "boolean"}) flags = new MapSchema<boolean>();
}