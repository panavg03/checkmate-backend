import { Router } from "express";
import { createParty, joinParty} from "../controllers/party.controller";

const router = Router();

router.post("/create", createParty);
router.post("/join", joinParty);

export default router;