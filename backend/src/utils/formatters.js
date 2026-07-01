export const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const cleaned = String(value).trim();
  return cleaned === "" ? null : cleaned;
};

export const normalizeKey = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

export const normalizeDate = (value) => {
  const cleaned = normalizeText(value);

  if (!cleaned) {
    return null;
  }

  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (isoPattern.test(cleaned)) {
    return cleaned;
  }

  const brPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = cleaned.match(brPattern);

  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }

  return cleaned;
};

export const normalizeBooleanStatus = (value) => {
  const cleaned = normalizeText(value);

  if (!cleaned) {
    return "Nao informado";
  }

  const lower = cleaned.toLowerCase();

  if (["sim", "s", "true", "1", "ativo"].includes(lower)) {
    return "Sim";
  }

  if (["nao", "não", "n", "false", "0", "inativo"].includes(lower)) {
    return "Nao";
  }

  return cleaned;
};

export const toDisplayStatus = (value) => {
  const normalized = normalizeBooleanStatus(value);

  if (normalized === "Sim") {
    return "Ativo";
  }

  if (normalized === "Nao") {
    return "Inativo";
  }

  return "Nao informado";
};

export const formatDateTime = (value) => {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
};
