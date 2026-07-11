import { Request, Response } from "express";
import { PartyService } from "../services/party.service";

function fail(res: Response, error: any, fallback: string) {
    return res
        .status(error?.status || 500)
        .json({ success: false, message: error?.message || fallback });
}

export class PartyController {
    static async createParty(req: Request, res: Response) {
        try {
            const leaderId = req.user!.userId;
            const { name, password, maxPlayers } = req.body ?? {};

            const party = await PartyService.createParty({ leaderId, name, password, maxPlayers });

            return res.status(201).json({ success: true, data: party });
        } catch (error) {
            return fail(res, error, "Failed to create party");
        }
    }

    static async joinParty(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { partyId, inviteCode, password } = req.body ?? {};
            const id = partyId || inviteCode;

            if (!id) {
                return res.status(400).json({ success: false, message: "partyId is required" });
            }

            await PartyService.joinParty({ partyId: id, userId, password });
            const data = await PartyService.getPartyDetails(id);

            return res.status(200).json({ success: true, data });
        } catch (error) {
            return fail(res, error, "Failed to join party");
        }
    }

    static async leaveParty(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { partyId } = req.params;

            if (!partyId) {
                return res.status(400).json({ success: false, message: "partyId is required" });
            }

            await PartyService.leaveParty(partyId, userId);

            return res.status(200).json({ success: true, message: "Left party" });
        } catch (error) {
            return fail(res, error, "Failed to leave party");
        }
    }

    static async kickPlayer(req: Request, res: Response) {
        try {
            const leaderId = req.user!.userId;
            const { partyId, targetUserId } = req.body ?? {};

            if (!partyId || !targetUserId) {
                return res
                    .status(400)
                    .json({ success: false, message: "partyId and targetUserId are required" });
            }

            await PartyService.kickPlayer(partyId, leaderId, targetUserId);
            const data = await PartyService.getPartyDetails(partyId);

            return res.status(200).json({ success: true, data });
        } catch (error) {
            return fail(res, error, "Failed to kick player");
        }
    }

    static async getParty(req: Request, res: Response) {
        try {
            const { partyId } = req.params;
            const data = await PartyService.getPartyDetails(partyId);

            return res.status(200).json({ success: true, data });
        } catch (error) {
            return fail(res, error, "Failed to fetch party");
        }
    }
}
