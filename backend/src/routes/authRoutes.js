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
import {
  requireAdminAuth,
  requireAdminProfile,
} from "../middleware/adminAuthMiddleware.js";

const router = Router();

router.post("/admin", autenticarAdmin);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAdminAuth, me);
router.post("/esqueci-senha", forgotPassword);
router.post("/trocar-senha", requireAdminAuth, changePassword);
router.get("/usuarios", requireAdminAuth, requireAdminProfile("ADMIN"), listUsers);
router.post("/usuarios", requireAdminAuth, requireAdminProfile("ADMIN"), createCollaborator);
router.post(
  "/usuarios/:id/redefinir-senha",
  requireAdminAuth,
  requireAdminProfile("ADMIN"),
  resetUserPassword,
);

export default router;
