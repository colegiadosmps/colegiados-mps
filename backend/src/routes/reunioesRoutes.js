import { Router } from "express";
import {
  atualizarReuniao,
  criarReuniao,
  excluirReuniao,
  listarReunioes,
} from "../controllers/reunioesController.js";
import { requireAdminAuth, requireAdminProfile } from "../middleware/adminAuthMiddleware.js";

const router = Router();

router.get("/", listarReunioes);
router.post("/", requireAdminAuth, requireAdminProfile("ADMIN", "COLABORADOR"), criarReuniao);
router.put("/:id", requireAdminAuth, requireAdminProfile("ADMIN", "COLABORADOR"), atualizarReuniao);
router.delete("/:id", requireAdminAuth, requireAdminProfile("ADMIN", "COLABORADOR"), excluirReuniao);

export default router;
