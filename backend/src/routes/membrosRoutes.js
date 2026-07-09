import { Router } from "express";
import {
  atualizarMembro,
  criarMembro,
  excluirMembro,
  listarMembros,
} from "../controllers/membrosController.js";
import { requireAdminAuth, requireAdminProfile } from "../middleware/adminAuthMiddleware.js";

const router = Router();

router.get("/", listarMembros);
router.post("/", requireAdminAuth, requireAdminProfile("ADMIN", "COLABORADOR"), criarMembro);
router.put("/:id", requireAdminAuth, requireAdminProfile("ADMIN", "COLABORADOR"), atualizarMembro);
router.delete("/:id", requireAdminAuth, requireAdminProfile("ADMIN", "COLABORADOR"), excluirMembro);

export default router;
