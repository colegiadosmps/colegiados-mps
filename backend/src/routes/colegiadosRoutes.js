import { Router } from "express";
import {
  atualizarColegiado,
  criarColegiado,
  excluirColegiado,
  listarColegiados,
  obterColegiadoPorSigla,
} from "../controllers/colegiadosController.js";

const router = Router();

router.get("/", listarColegiados);
router.get("/:sigla", obterColegiadoPorSigla);
router.post("/", criarColegiado);
router.put("/:id", atualizarColegiado);
router.delete("/:id", excluirColegiado);

export default router;
