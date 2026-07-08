import { Router } from "express";
import {
  autenticarAdmin,
  changePassword,
  createCollaborator,
  forgotPassword,
  login,
  listUsers,
  logout,
  me,
  resetUserPassword,
} from "../controllers/authController.js";
import { requireAdminAuth } from "../middleware/adminAuthMiddleware.js";

const router = Router();

router.post("/admin", autenticarAdmin);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", me);
router.post("/esqueci-senha", forgotPassword);
router.post("/trocar-senha", changePassword);
router.get("/usuarios", requireAdminAuth, listUsers);
router.post("/usuarios", requireAdminAuth, createCollaborator);
router.post("/usuarios/:id/redefinir-senha", requireAdminAuth, resetUserPassword);

export default router;
