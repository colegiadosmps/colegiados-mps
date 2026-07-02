const BRAZIL_TIMEZONE = "America/Sao_Paulo";

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const dateTimePattern = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/;
const timeOnlyPattern = /^(\d{2}):(\d{2})(?::\d{2})?$/;

const formatDateParts = (year, month, day) => `${day}/${month}/${year}`;
const formatTimeParts = (hours, minutes) => `${hours}:${minutes}`;
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
