import { Router } from "express";
import {
  atualizarPublicacao,
  criarPublicacao,
  excluirPublicacao,
  listarPublicacoes,
} from "../controllers/publicacoesController.js";
import { requireAdminAuth, requireAdminProfile } from "../middleware/adminAuthMiddleware.js";

const router = Router();

router.get("/", listarPublicacoes);
router.post("/", requireAdminAuth, requireAdminProfile("ADMIN", "COLABORADOR"), criarPublicacao);
router.put(
  "/:id",
  requireAdminAuth,
  requireAdminProfile("ADMIN", "COLABORADOR"),
  atualizarPublicacao,
);
router.delete(
  "/:id",
  requireAdminAuth,
  requireAdminProfile("ADMIN", "COLABORADOR"),
  excluirPublicacao,
);

export default router;
