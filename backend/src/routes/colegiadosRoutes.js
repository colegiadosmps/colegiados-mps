import { Router } from "express";
import {
  listarColegiados,
  listarInstanciasPorColegiado,
  listarInstanciasPorUf,
  obterColegiadoPorSigla,
} from "../controllers/colegiadosController.js";

const router = Router();

router.get("/", listarColegiados);
router.get("/:sigla/instancias/:uf", listarInstanciasPorUf);
router.get("/:sigla/instancias", listarInstanciasPorColegiado);
router.get("/:sigla", obterColegiadoPorSigla);

export default router;
