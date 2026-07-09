import { Router } from "express";
import {
  atualizarColegiado,
  criarColegiado,
  excluirColegiado,
  listarColegiados,
  listarInstanciasPorColegiado,
  listarInstanciasPorUf,
  obterColegiadoPorSigla,
} from "../controllers/colegiadosController.js";
import { requireAdminAuth, requireAdminProfile } from "../middleware/adminAuthMiddleware.js";

const router = Router();

router.get("/", listarColegiados);
router.post("/", requireAdminAuth, requireAdminProfile("ADMIN", "COLABORADOR"), criarColegiado);
router.get("/:sigla/instancias/:uf", listarInstanciasPorUf);
router.get("/:sigla/instancias", listarInstanciasPorColegiado);
router.put(
  "/:sigla",
  requireAdminAuth,
  requireAdminProfile("ADMIN", "COLABORADOR"),
  atualizarColegiado,
);
router.delete(
  "/:sigla",
  requireAdminAuth,
  requireAdminProfile("ADMIN", "COLABORADOR"),
  excluirColegiado,
);
router.get("/:sigla", obterColegiadoPorSigla);

export default router;
