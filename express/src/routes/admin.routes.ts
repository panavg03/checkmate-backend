import { Router } from "express";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { requireAdmin } from "../middleware/authorize.js";
import {
  listUsers,
  getUser,
  changeUserRole,
  deleteParty,
  kickMember,
} from "../controllers/admin.controller.js";

const router = Router();

router.use(authenticateUser, requireAdmin);

router.get("/users", listUsers);
router.get("/users/:userId", getUser);
router.patch("/users/:userId/role", changeUserRole);

router.delete("/parties/:partyId", deleteParty);
router.delete("/parties/:partyId/members/:userId", kickMember);

export default router;
