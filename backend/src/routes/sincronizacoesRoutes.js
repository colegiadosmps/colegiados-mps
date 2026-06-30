import { Router } from "express";
import {
  detalharSincronizacao,
  executarSincronizacaoAgora,
  listarHistoricoSincronizacoes,
} from "../controllers/sincronizacoesController.js";
import { requireAdminAuth } from "../middleware/adminAuthMiddleware.js";

const router = Router();

router.get("/", listarHistoricoSincronizacoes);
router.post("/executar", requireAdminAuth, executarSincronizacaoAgora);
router.get("/:id", detalharSincronizacao);

export default router;
