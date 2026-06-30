import fs from "node:fs";
import { importCsvFile, listImportacoes } from "../services/importacaoService.js";
import {
  getGoogleDriveStatus,
  syncGoogleDrive,
} from "../services/googleDriveService.js";

export const listarImportacoes = async (_request, response) => {
  try {
    const importacoes = await listImportacoes();
    response.json(importacoes);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const uploadImportacao = async (request, response) => {
  if (!request.file) {
    response.status(400).json({ message: "Envie um arquivo CSV." });
    return;
  }

  try {
    const result = await importCsvFile(request.file.path, request.file.originalname);
    response.status(201).json(result);
  } catch (error) {
    response.status(400).json({ message: error.message });
  } finally {
    if (request.file?.path && fs.existsSync(request.file.path)) {
      fs.unlinkSync(request.file.path);
    }
  }
};

export const obterStatusGoogleDrive = (_request, response) => {
  response.json(getGoogleDriveStatus());
};

export const sincronizarGoogleDrive = async (_request, response) => {
  try {
    const result = await syncGoogleDrive();
    response.json(result);
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
};
