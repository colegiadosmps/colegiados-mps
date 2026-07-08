import { Router } from "express";
import {
  autenticarAdmin,
  changePassword,
  createCollaborator,
  forgotPassword,
  login,
  logout,
  me,
} from "../controllers/authController.js";
import { requireAdminAuth } from "../middleware/adminAuthMiddleware.js";

const router = Router();

router.post("/admin", autenticarAdmin);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", me);
router.post("/esqueci-senha", forgotPassword);
router.post("/trocar-senha", changePassword);
router.post("/usuarios", requireAdminAuth, createCollaborator);

export default router;
