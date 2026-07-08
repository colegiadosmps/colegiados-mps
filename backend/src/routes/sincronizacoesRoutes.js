import { Router } from "express";
import {
  detalharSincronizacao,
  executarSincronizacaoAgora,
  listarHistoricoSincronizacoes,
} from "../controllers/sincronizacoesController.js";
import {
  requireAdminAuth,
  requireAdminProfile,
} from "../middleware/adminAuthMiddleware.js";

const router = Router();

router.get("/", listarHistoricoSincronizacoes);
router.post(
  "/executar",
  requireAdminAuth,
  requireAdminProfile("ADMIN"),
  executarSincronizacaoAgora,
);
router.get("/:id", requireAdminAuth, requireAdminProfile("ADMIN"), detalharSincronizacao);

export default router;
