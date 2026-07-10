import { Router } from "express";
import { PartyController } from "../controllers/party.controller";

const router = Router();

router.post("/", PartyController.createParty);
router.post("/join", PartyController.joinParty);
router.post("/leave/:partyId", PartyController.leaveParty);
router.get("/:partyId", PartyController.getParty);

export default router;
