import path from "node:path";
import fs from "node:fs";
import { Router } from "express";
import multer from "multer";
import {
  obterStatusGoogleDrive,
  listarImportacoes,
  sincronizarGoogleDrive,
  uploadImportacao,
} from "../controllers/importacoesController.js";

const uploadsDirectory = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadsDirectory);
  },
  filename: (_request, file, callback) => {
    callback(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
const router = Router();

router.get("/", listarImportacoes);
router.get("/google-drive/status", obterStatusGoogleDrive);
router.post("/google-drive/sync", sincronizarGoogleDrive);
router.post("/upload", upload.single("arquivo"), uploadImportacao);

export default router;
