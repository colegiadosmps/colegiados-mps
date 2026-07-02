import { normalizeKey } from "../utils/formatters.js";

const filePattern =
  /^(?<sigla>.+?)_(?<tipo>Membros|Reunioes|Reuniao|Reuniões|Reunião)_(?<day>\d{2})_(?<month>\d{2})_(?<year>\d{4})(?:\.csv)?$/i;

const normalizeFileType = (value) => {
  const normalized = value.toLowerCase();

  if (normalized === "membros") {
    return "Membros";
  }

  return "Reunioes";
};

export const parseFileName = (fileName) => {
  const match = fileName.match(filePattern);

  if (!match?.groups) {
    throw new Error(
      "Nome de arquivo invalido. Use o padrao SIGLA_TIPO_DD_MM_AAAA.csv.",
    );
  }

  const { sigla, tipo, day, month, year } = match.groups;

  return {
    siglaColegiado: normalizeKey(sigla),
    tipo: normalizeFileType(tipo),
    dataBase: `${year}-${month}-${day}`,
  };
};
