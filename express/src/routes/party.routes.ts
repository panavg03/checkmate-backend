import { Router } from "express";
import { PartyController } from "../controllers/party.controller";

const router = Router();

router.post("/create", PartyController.createParty);
router.post("/join", PartyController.joinParty);
router.post("/leave/:partyId", PartyController.leaveParty);
router.post("/kick", PartyController.kickPlayer);
router.get("/:partyId", PartyController.getParty);

export default router;
