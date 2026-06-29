const filePattern =
  /^(?<sigla>[A-Za-z0-9]+)_(?<tipo>Membros|Reunioes)_(?<day>\d{2})_(?<month>\d{2})_(?<year>\d{4})\.csv$/i;

export const parseFileName = (fileName) => {
  const match = fileName.match(filePattern);

  if (!match?.groups) {
    throw new Error(
      "Nome de arquivo invalido. Use o padrao SIGLA_TIPO_DD_MM_AAAA.csv.",
    );
  }

  const { sigla, tipo, day, month, year } = match.groups;

  return {
    siglaColegiado: sigla.toUpperCase(),
    tipo: tipo[0].toUpperCase() + tipo.slice(1).toLowerCase(),
    dataBase: `${year}-${month}-${day}`,
  };
};
