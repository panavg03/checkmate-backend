import { Router } from "express";
import { createParty } from "../controllers/party.controller";

const router = Router();

router.post("/create", createParty);

export default router;