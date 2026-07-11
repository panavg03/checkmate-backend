import { Router } from "express";
import { createParty, joinParty,leaveParty} from "../controllers/party.controller";

const router = Router();

router.post("/create", createParty);
router.post("/join", joinParty);
router.post("/leave", leaveParty);

export default router;