import { run } from "../database/db.js";

const BRAZIL_TIMEZONE = "America/Sao_Paulo";

const formatBrazilDateTime = (value = new Date()) => {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return formatter.format(value);
};

const serializePayload = (payload) => {
  if (!payload) {
    return null;
  }

  try {
    return JSON.stringify(payload);
  } catch (_error) {
    return null;
  }
};

export const getBrazilDateTime = () => formatBrazilDateTime(new Date());

export const logAccessEvent = async ({
  evento,
  observacao = null,
  origem = "WEB",
  status = "OK",
  user = null,
}) => {
  await run(
    `INSERT INTO auditoria_acessos (
      data_hora_brasilia,
      usuario_id,
      usuario_nome,
      usuario_email,
      perfil,
      evento,
      origem,
      status,
      observacao
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      getBrazilDateTime(),
      user?.id ? String(user.id) : null,
      user?.nome || null,
      user?.email || null,
      user?.perfil || null,
      evento,
      origem,
      status,
      observacao,
    ],
  );
};

export const logChangeEvent = async ({
  acao,
  modulo,
  colegiadoPai = null,
  colegiadoAlvo = null,
  tipoRegistro = null,
  idRegistroAfetado = null,
  descricaoResumida = null,
  dadosAnteriores = null,
  dadosNovos = null,
  origem = "WEB",
  status = "OK",
  observacao = null,
  user = null,
}) => {
  await run(
    `INSERT INTO auditoria_alteracoes (
      data_hora_brasilia,
      usuario_id,
      usuario_nome,
      usuario_email,
      perfil,
      acao,
      modulo,
      colegiado_pai,
      colegiado_alvo,
      tipo_registro,
      id_registro_afetado,
      descricao_resumida,
      dados_anteriores,
      dados_novos,
      origem,
      status,
      observacao
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      getBrazilDateTime(),
      user?.id ? String(user.id) : null,
      user?.nome || null,
      user?.email || null,
      user?.perfil || null,
      acao,
      modulo,
      colegiadoPai,
      colegiadoAlvo,
      tipoRegistro,
      idRegistroAfetado ? String(idRegistroAfetado) : null,
      descricaoResumida,
      serializePayload(dadosAnteriores),
      serializePayload(dadosNovos),
      origem,
      status,
      observacao,
    ],
  );
};
