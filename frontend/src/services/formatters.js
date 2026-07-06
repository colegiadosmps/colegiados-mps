const BRAZIL_TIMEZONE = "America/Sao_Paulo";

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const dateTimePattern = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/;
const timeOnlyPattern = /^(\d{2}):(\d{2})(?::\d{2})?$/;
const displayOverrides = {
  GTGD_MPS: "GTGD - MPS",
  CPS_SANTOS_SP: "CPS - Santos/SP",
  CPS_SAO_PAULO_SP: "CPS - São Paulo/SP",
  CPS_TAUBATE_SP: "CPS - Taubaté/SP",
  CPS_ANAPOLIS_GO: "CPS - Anápolis/GO",
  CPS_ARACAJU_SE: "CPS - Aracaju/SE",
  CPS_BELO_HORIZONTE_MG: "CPS - Belo Horizonte/MG",
  CONAPREV_ATUARIA: "Atuaria",
  CONAPREV_COPAJURE: "COPAJURE",
};
const UF_TO_ESTADO = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapa",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceara",
  DF: "Distrito Federal",
  ES: "Espirito Santo",
  GO: "Goias",
  MA: "Maranhao",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Para",
  PB: "Paraiba",
  PR: "Parana",
  PE: "Pernambuco",
  PI: "Piaui",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondonia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "Sao Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};
const UF_TO_REGIAO = {
  AC: "Regiao Norte",
  AL: "Regiao Nordeste",
  AP: "Regiao Norte",
  AM: "Regiao Norte",
  BA: "Regiao Nordeste",
  CE: "Regiao Nordeste",
  DF: "Regiao Centro-Oeste",
  ES: "Regiao Sudeste",
  GO: "Regiao Centro-Oeste",
  MA: "Regiao Nordeste",
  MT: "Regiao Centro-Oeste",
  MS: "Regiao Centro-Oeste",
  MG: "Regiao Sudeste",
  PA: "Regiao Norte",
  PB: "Regiao Nordeste",
  PR: "Regiao Sul",
  PE: "Regiao Nordeste",
  PI: "Regiao Nordeste",
  RJ: "Regiao Sudeste",
  RN: "Regiao Nordeste",
  RS: "Regiao Sul",
  RO: "Regiao Norte",
  RR: "Regiao Norte",
  SC: "Regiao Sul",
  SP: "Regiao Sudeste",
  SE: "Regiao Nordeste",
  TO: "Regiao Norte",
};
const REGION_ORDER = [
  "Regiao Norte",
  "Regiao Nordeste",
  "Regiao Centro-Oeste",
  "Regiao Sudeste",
  "Regiao Sul",
];

const formatDateParts = (year, month, day) => `${day}/${month}/${year}`;
const formatTimeParts = (hours, minutes) => `${hours}:${minutes}`;
const normalizeKey = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

const toTitleCase = (value) =>
  String(value || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatBooleanStatus = (value) => {
  if (!value) {
    return "Nao informado";
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "sim" || normalized === "ativo") {
    return "Ativo";
  }
  if (normalized === "nao" || normalized === "não" || normalized === "inativo") {
    return "Inativo";
  }
  return value;
};

export const formatColegiadoDisplayName = (value) => {
  const cleaned = String(value || "").trim();
  if (!cleaned) {
    return "-";
  }

  const normalized = normalizeKey(cleaned);
  if (displayOverrides[normalized]) {
    return displayOverrides[normalized];
  }

  if (normalized.startsWith("CPS_")) {
    const parts = normalized.split("_").filter(Boolean);
    if (parts.length >= 3) {
      const uf = parts[parts.length - 1];
      const city = parts
        .slice(1, -1)
        .map((chunk) => toTitleCase(chunk))
        .join(" ");
      return `CPS - ${city}/${uf}`;
    }
  }

  if (cleaned.includes("_")) {
    return cleaned
      .split("_")
      .filter(Boolean)
      .map((chunk, index) => {
        if (index === 0 || chunk.length <= 3) {
          return chunk.toUpperCase();
        }
        return toTitleCase(chunk);
      })
      .join(" - ");
  }

  return cleaned;
};

export const extractCpsLocation = (value) => {
  const normalized = normalizeKey(value);

  if (!normalized.startsWith("CPS_")) {
    return {
      municipio: null,
      uf: null,
      estado: null,
    };
  }

  const parts = normalized.split("_").filter(Boolean);

  if (parts.length < 3) {
    return {
      municipio: null,
      uf: null,
      estado: null,
    };
  }

  const uf = parts[parts.length - 1];
  const municipio = parts
    .slice(1, -1)
    .map((chunk) => toTitleCase(chunk))
    .join(" ");

  return {
    municipio: municipio || null,
    uf: UF_TO_ESTADO[uf] ? uf : null,
    estado: UF_TO_ESTADO[uf] || null,
    regiao: UF_TO_REGIAO[uf] || null,
  };
};

export const getUfInfo = (value) => {
  const uf = normalizeKey(value);

  if (!UF_TO_ESTADO[uf]) {
    return {
      uf: null,
      estado: null,
      regiao: null,
    };
  }

  return {
    uf,
    estado: UF_TO_ESTADO[uf],
    regiao: UF_TO_REGIAO[uf] || null,
  };
};

export const getRegionOrder = () => REGION_ORDER.slice();

export const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const stringValue = String(value).trim();
  const dateOnlyMatch = stringValue.match(dateOnlyPattern);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return formatDateParts(year, month, day);
  }

  const dateTimeMatch = stringValue.match(dateTimePattern);
  if (dateTimeMatch) {
    const [, year, month, day] = dateTimeMatch;
    return formatDateParts(year, month, day);
  }

  const parsedDate = new Date(stringValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return stringValue;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
  }).format(parsedDate);
};

export const formatTime = (value) => {
  if (!value) {
    return "-";
  }

  const stringValue = String(value).trim();
  const timeOnlyMatch = stringValue.match(timeOnlyPattern);
  if (timeOnlyMatch) {
    const [, hours, minutes] = timeOnlyMatch;
    return formatTimeParts(hours, minutes);
  }

  const dateTimeMatch = stringValue.match(dateTimePattern);
  if (dateTimeMatch) {
    const [, , , , hours, minutes] = dateTimeMatch;
    return formatTimeParts(hours, minutes);
  }

  const parsedDate = new Date(stringValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return stringValue;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BRAZIL_TIMEZONE,
  }).format(parsedDate);
};

export const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const stringValue = String(value).trim();
  const dateTimeMatch = stringValue.match(dateTimePattern);
  if (dateTimeMatch) {
    const [, year, month, day, hours, minutes] = dateTimeMatch;
    return `${formatDateParts(year, month, day)} ${formatTimeParts(hours, minutes)}`;
  }

  const dateOnlyMatch = stringValue.match(dateOnlyPattern);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return formatDateParts(year, month, day);
  }

  const parsedDate = new Date(stringValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return stringValue;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BRAZIL_TIMEZONE,
  }).format(parsedDate);
};

export const formatMonthYear = (value) => {
  if (!value) {
    return "Sem data";
  }

  const stringValue = String(value).trim();
  const match = stringValue.match(/^(\d{4})-(\d{2})/);
  if (!match) {
    return stringValue;
  }

  const [, year, month] = match;
  return `${month}/${year}`;
};

export const formatValueByKey = (key, value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (key === "data_sincronizacao") {
    return formatDateTime(value);
  }

  if (key === "hora" || key === "horario") {
    return formatTime(value);
  }

  if (
    key === "data_base" ||
    key === "data_reuniao" ||
    key === "data_instituicao" ||
    key === "data_termino" ||
    key === "inicio" ||
    key === "fim" ||
    key === "inicio_vigencia" ||
    key === "fim_vigencia"
  ) {
    return formatDate(value);
  }

  return value;
};
