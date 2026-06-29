import { Router } from "express";
import {
  atualizarPublicacao,
  criarPublicacao,
  excluirPublicacao,
  listarPublicacoes,
} from "../controllers/publicacoesController.js";

const router = Router();

router.get("/", listarPublicacoes);
router.post("/", criarPublicacao);
router.put("/:id", atualizarPublicacao);
router.delete("/:id", excluirPublicacao);

export default router;
