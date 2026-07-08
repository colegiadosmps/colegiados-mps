import { normalizeKey } from "../utils/formatters.js";

const normalizeFileNameInput = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const datedFilePattern =
  /^(?<sigla>.+?)_(?<tipo>Membros|Reunioes|Reuniao)_(?<day>\d{2})_(?<month>\d{2})_(?<year>\d{4})(?:\.csv)?$/i;
const undatedFilePattern =
  /^(?<sigla>.+?)_(?<tipo>Membros|Reunioes|Reuniao|Publicacoes)(?:\.csv)?$/i;

const normalizeFileType = (value) => {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "membros") {
    return "Membros";
  }

  return "Reunioes";
};

export const parseFileName = (fileName) => {
  const classification = classifyColegiadoCsvFile(fileName);

  if (!classification.valid || !classification.importable) {
    throw new Error(
      "Nome de arquivo invalido. Use o padrao aceito para arquivos de conteudo do colegiado.",
    );
  }

  return {
    siglaColegiado: classification.siglaColegiado,
    tipo: classification.tipo,
    dataBase: classification.dataBase,
  };
};

export const classifyColegiadoCsvFile = (fileName) => {
  const normalizedFileName = normalizeFileNameInput(fileName);
  const datedMatch = normalizedFileName.match(datedFilePattern);

  if (datedMatch?.groups) {
    const { sigla, tipo, day, month, year } = datedMatch.groups;

    return {
      valid: true,
      importable: true,
      siglaColegiado: normalizeKey(sigla),
      tipo: normalizeFileType(tipo),
      dataBase: `${year}-${month}-${day}`,
    };
  }

  const undatedMatch = normalizedFileName.match(undatedFilePattern);

  if (undatedMatch?.groups) {
    const { sigla, tipo } = undatedMatch.groups;
    const normalizedTipo = String(tipo || "").toLowerCase();

    return {
      valid: true,
      importable: normalizedTipo !== "publicacoes",
      siglaColegiado: normalizeKey(sigla),
      tipo:
        normalizedTipo === "publicacoes"
          ? "Publicacoes"
          : normalizeFileType(tipo),
      dataBase: null,
    };
  }

  return {
    valid: false,
    importable: false,
    siglaColegiado: null,
    tipo: null,
    dataBase: null,
  };
};
