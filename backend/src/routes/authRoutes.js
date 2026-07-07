import { Router } from "express";
import {
  autenticarAdmin,
  forgotPassword,
  login,
  logout,
  me,
} from "../controllers/authController.js";

const router = Router();

router.post("/admin", autenticarAdmin);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", me);
router.post("/esqueci-senha", forgotPassword);

export default router;
