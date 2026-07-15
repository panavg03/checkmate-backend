import type { Request, Response } from "express";
import { Role } from "../types/auth.types.js";
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  forceDeleteParty,
  forceRemovePartyMember,
} from "../services/admin.service.js";

export async function listUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("listUsers error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.userId);
    if (Number.isNaN(userId)) {
      res.status(400).json({ success: false, error: "Invalid userId" });
      return;
    }

    const user = await getUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("getUser error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function changeUserRole(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.userId);
    if (Number.isNaN(userId)) {
      res.status(400).json({ success: false, error: "Invalid userId" });
      return;
    }

    const { role } = req.body ?? {};

    if (!role || !Object.values(Role).includes(role as Role)) {
      res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${Object.values(Role).join(", ")}`,
      });
      return;
    }

    if (req.user!.userId === userId && (role as Role) !== Role.ADMIN) {
      res.status(400).json({
        success: false,
        error: "You cannot demote yourself",
      });
      return;
    }

    const updated = await updateUserRole(userId, role as Role);
    if (!updated) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("changeUserRole error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function deleteParty(req: Request, res: Response): Promise<void> {
  try {
    const { partyId } = req.params;
    if (!partyId) {
      res.status(400).json({ success: false, error: "partyId is required" });
      return;
    }

    const deleted = await forceDeleteParty(partyId as string);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Party not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Party deleted" });
  } catch (error) {
    console.error("deleteParty error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function kickMember(req: Request, res: Response): Promise<void> {
  try {
    const { partyId } = req.params;
    const userId = Number(req.params.userId);

    if (!partyId || Number.isNaN(userId)) {
      res.status(400).json({ success: false, error: "partyId and userId are required" });
      return;
    }

    const removed = await forceRemovePartyMember(partyId as string, userId);
    if (!removed) {
      res.status(404).json({ success: false, error: "Member not found in party" });
      return;
    }

    res.status(200).json({ success: true, message: "Member removed from party" });
  } catch (error) {
    console.error("kickMember error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}
