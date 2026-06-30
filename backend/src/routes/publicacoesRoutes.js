import { Router } from "express";
import { listarPublicacoes } from "../controllers/publicacoesController.js";

const router = Router();

router.get("/", listarPublicacoes);

export default router;
