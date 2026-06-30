import { Router } from "express";
import { autenticarAdmin } from "../controllers/authController.js";

const router = Router();

router.post("/admin", autenticarAdmin);

export default router;
