import { Request, Response } from "express";
import { PartyService } from "../services/party.service";

const partyService = new PartyService();

// Create party controller
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
//join party controller

export const joinParty = (req: Request, res: Response): void => {

    try {

        const { inviteCode, userId, username } = req.body;

        if (!inviteCode || !userId || !username) {

            res.status(400).json({
                success: false,
                message: "inviteCode, userId and username are required",
            });

            return;
        }

        const party = partyService.joinParty({
            inviteCode,
            userId,
            username,
        });

        res.status(200).json({
            success: true,
            message: "Joined party successfully",
            data: party,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to join party",
        });
    }
};

//leave party controller
export const leaveParty = (req: Request, res: Response): void => {

    try {

        const { inviteCode, userId } = req.body;

        if (!inviteCode || !userId) {

            res.status(400).json({
                success: false,
                message: "inviteCode and userId are required",
            });

            return;
        }

        const party = partyService.leaveParty({
            inviteCode,
            userId,
        });

        if (!party) {

            res.status(200).json({
                success: true,
                message: "Party deleted because all members left.",
            });

            return;
        }

        res.status(200).json({
            success: true,
            message: "Left party successfully",
            data: party,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to leave party",
        });
    }
};

//get party controller
export const getParty = (req: Request, res: Response): void => {

    try {

        const { inviteCode } = req.params;

        const party = partyService.getParty(inviteCode);

        res.status(200).json({
            success: true,
            data: party,
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch party",
        });
    }
};