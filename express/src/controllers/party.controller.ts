import { Request, Response } from "express";
import { PartyService } from "../services/party.service";

const partyService = new PartyService();

export const createParty = (req: Request, res: Response): void => {
    try {

        const { userId, username } = req.body;

        if (!userId || !username) {
            res.status(400).json({
                success: false,
                message: "userId and username are required"
            });
            return;
        }

        const party = partyService.createParty({
            userId,
            username,
        });

        res.status(201).json({
            success: true,
            message: "Party created successfully",
            data: party,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to create party",
        });

    }
};