import { Router } from "express";
import { createParty, joinParty,leaveParty,getParty,kickPlayer} from "../controllers/party.controller";

const router = Router();

router.post("/create", createParty);
router.post("/join", joinParty);
router.post("/leave", leaveParty);
router.get("/:inviteCode", getParty);
router.post("/kick", kickPlayer);

export default router;