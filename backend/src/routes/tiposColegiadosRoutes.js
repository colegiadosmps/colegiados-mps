import { Router } from "express";
import {
  atualizarTipoColegiado,
  criarTipoColegiado,
  excluirTipoColegiado,
  listarTiposColegiados,
} from "../controllers/tiposColegiadosController.js";
import { requireAdminAuth, requireAdminProfile } from "../middleware/adminAuthMiddleware.js";

const router = Router();

router.get("/", listarTiposColegiados);
router.post("/", requireAdminAuth, requireAdminProfile("ADMIN", "COLABORADOR"), criarTipoColegiado);
router.put(
  "/:id",
  requireAdminAuth,
  requireAdminProfile("ADMIN", "COLABORADOR"),
  atualizarTipoColegiado,
);
router.delete(
  "/:id",
  requireAdminAuth,
  requireAdminProfile("ADMIN", "COLABORADOR"),
  excluirTipoColegiado,
);

export default router;
