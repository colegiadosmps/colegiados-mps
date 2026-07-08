import { Router } from "express";
import {
  atualizarMembro,
  criarMembro,
  listarMembros,
} from "../controllers/membrosController.js";
import { requireAdminAuth, requireAdminProfile } from "../middleware/adminAuthMiddleware.js";

const router = Router();

router.get("/", listarMembros);
router.post("/", requireAdminAuth, requireAdminProfile("ADMIN", "COLABORADOR"), criarMembro);
router.put("/:id", requireAdminAuth, requireAdminProfile("ADMIN", "COLABORADOR"), atualizarMembro);

export default router;
