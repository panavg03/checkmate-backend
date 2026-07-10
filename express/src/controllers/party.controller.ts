import { Request, Response } from "express";
import { PartyService } from "../services/party.service";

export class PartyController {
    static async createParty(req: Request, res: Response) {
        try {
            const { name, password, maxPlayers, leaderId } = req.body;
            
            if (!leaderId) {
                return res.status(400).json({ error: "leaderId is required" });
            }

            const party = await PartyService.createParty({
                name,
                password,
                maxPlayers,
                leaderId: Number(leaderId)
            });

            return res.status(201).json(party);
        } catch (error: any) {
            console.error("Controller error in createParty:", error);
            return res.status(error.status || 500).json({ error: error.message || "Internal server error" });
        }
    }

    static async joinParty(req: Request, res: Response) {
        try {
            const { partyId, userId, password } = req.body;

            if (!partyId) {
                return res.status(400).json({ error: "partyId is required" });
            }
            if (!userId) {
                return res.status(400).json({ error: "userId is required" });
            }

            await PartyService.joinParty({
                partyId,
                userId: Number(userId),
                password
            });

            return res.status(200).json({ ok: true, message: "Successfully joined party" });
        } catch (error: any) {
            console.error("Controller error in joinParty:", error);
            return res.status(error.status || 500).json({ error: error.message || "Internal server error" });
        }
    }

    static async leaveParty(req: Request, res: Response) {
        try {
            const { partyId } = req.params;
            const { userId } = req.body;

            if (!partyId) {
                return res.status(400).json({ error: "partyId parameter is required" });
            }
            if (!userId) {
                return res.status(400).json({ error: "userId is required to leave party" });
            }

            await PartyService.leaveParty(partyId as string, Number(userId));

            return res.status(200).json({ ok: true, message: "Successfully left party" });
        } catch (error: any) {
            console.error("Controller error in leaveParty:", error);
            return res.status(error.status || 500).json({ error: error.message || "Internal server error" });
        }
    }

    static async getParty(req: Request, res: Response) {
        try {
            const { partyId } = req.params;

            if (!partyId) {
                return res.status(400).json({ error: "partyId parameter is required" });
            }

            const partyDetails = await PartyService.getPartyDetails(partyId as string);
            return res.status(200).json(partyDetails);
        } catch (error: any) {
            console.error("Controller error in getParty:", error);
            return res.status(error.status || 500).json({ error: error.message || "Internal server error" });
        }
    }
}
