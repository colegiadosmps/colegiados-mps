import { Router } from "express";
import {
  atualizarPublicacao,
  criarPublicacao,
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

export default router;
