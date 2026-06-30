import { Router } from "express";
import {
  listarColegiados,
  obterColegiadoPorSigla,
} from "../controllers/colegiadosController.js";

const router = Router();

router.get("/", listarColegiados);
router.get("/:sigla", obterColegiadoPorSigla);

export default router;
