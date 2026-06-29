import { Router } from "express";
import { listarReunioes } from "../controllers/reunioesController.js";

const router = Router();

router.get("/", listarReunioes);

export default router;
