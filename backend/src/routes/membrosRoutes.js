import { Router } from "express";
import { listarMembros } from "../controllers/membrosController.js";

const router = Router();

router.get("/", listarMembros);

export default router;
