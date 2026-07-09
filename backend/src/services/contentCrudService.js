import { get, run } from "../database/db.js";
import { UF_ESTADOS } from "./hierarquiaService.js";
import { logChangeEvent, getBrazilDateTime } from "./auditService.js";
import {
  normalizeBooleanStatus,
  normalizeDate,
  normalizeKey,
  normalizeText,
} from "../utils/formatters.js";

const normalizeStatusAtivo = (value) => normalizeBooleanStatus(value || "Sim");
const normalizePublicacaoStatus = (value) => normalizeText(value) || "Ativo";
const normalizeReuniaoStatus = (value) => normalizeText(value) || "Planejada";

const buildColegiadoPayload = (payload = {}) => {
  const sigla = normalizeKey(payload.sigla || payload.sigla_exibicao || payload.nome);
  const siglaExibicao = normalizeText(payload.sigla_exibicao) || sigla;
  const chavePasta =
    normalizeKey(payload.chave_pasta || siglaExibicao || sigla) || sigla;

  return {
    sigla,
    sigla_exibicao: siglaExibicao,
    chave_pasta: chavePasta,
    nome: normalizeText(payload.nome) || siglaExibicao || sigla,
    categoria: normalizeText(payload.categoria) || "Interno",
    tipo: normalizeText(payload.tipo) || "Conselho",
    descricao: normalizeText(payload.descricao),
    competencia: normalizeText(payload.competencia),
    sigla_colegiado_pai: normalizeKey(payload.sigla_colegiado_pai),
    unidade: normalizeText(payload.unidade),
    sigla_unidade_pai: normalizeText(payload.sigla_unidade_pai),
    ato_criacao: normalizeText(payload.ato_criacao),
    data_instituicao: normalizeDate(payload.data_instituicao),
    data_termino: normalizeDate(payload.data_termino),
    qtd_min_reunioes_anuais: normalizeText(payload.qtd_min_reunioes_anuais),
    regra_quorum: normalizeText(payload.regra_quorum),
    observacoes: normalizeText(payload.observacoes),
    orgao: normalizeText(payload.orgao),
    dispositivo_legal: normalizeText(payload.dispositivo_legal),
    ativo: normalizeStatusAtivo(payload.ativo),
    titular: normalizeText(payload.titular),
    suplente: normalizeText(payload.suplente),
    segundo_suplente: normalizeText(payload.segundo_suplente),
    processo_nomeacao: normalizeText(payload.processo_nomeacao),
    municipio: normalizeText(payload.municipio),
    uf: normalizeKey(payload.uf),
    estado:
      normalizeText(payload.estado) ||
      UF_ESTADOS[normalizeKey(payload.uf)] ||
      null,
  };
};

const buildMembroPayload = (payload = {}, user) => {
  const now = getBrazilDateTime();
  return {
    nome_membro: normalizeText(payload.nome_membro || payload.nome),
    sigla_colegiado: normalizeKey(payload.sigla_colegiado),
    sigla_colegiado_pai: normalizeKey(payload.sigla_colegiado_pai),
    unidade: normalizeText(payload.unidade),
    matricula: normalizeText(payload.matricula),
    email_institucional: normalizeText(payload.email_institucional || payload.email),
    telefone_institucional: normalizeText(payload.telefone_institucional || payload.telefone),
    telefone_pessoal: normalizeText(payload.telefone_pessoal),
    tipo_vinculo: normalizeText(payload.tipo_vinculo),
    papel: normalizeText(payload.papel),
    detalhamento_papel: normalizeText(payload.detalhamento_papel || payload.detalhamento),
    inicio_vigencia: normalizeDate(payload.inicio_vigencia || payload.data_inicio),
    fim_vigencia: normalizeDate(payload.fim_vigencia || payload.data_fim),
    ativo: normalizeStatusAtivo(payload.ativo),
    observacao: normalizeText(payload.observacao),
    criado_em_brasilia: now,
    criado_por: user?.email || user?.usuario || "sistema",
    atualizado_em_brasilia: now,
    atualizado_por: user?.email || user?.usuario || "sistema",
  };
};

const buildReuniaoPayload = (payload = {}, user) => {
  const now = getBrazilDateTime();
  return {
    id_reuniao: normalizeText(payload.id_reuniao || payload.reuniao),
    id_colegiado: normalizeText(payload.id_colegiado),
    sigla_colegiado: normalizeKey(payload.sigla_colegiado),
    id_unidade: normalizeText(payload.id_unidade),
    data_reuniao: normalizeDate(payload.data_reuniao),
    hora: normalizeText(payload.hora || payload.horario),
    local: normalizeText(payload.local),
    classificacao_pauta: normalizeText(payload.classificacao_pauta),
    descricao_pauta: normalizeText(payload.descricao_pauta),
    texto_ata: normalizeText(payload.texto_ata),
    status_reuniao: normalizeReuniaoStatus(payload.status_reuniao),
    quorum_registrado: normalizeText(payload.quorum_registrado),
    link_ata: normalizeText(payload.link_ata),
    observacao: normalizeText(payload.observacao),
    criado_em_brasilia: now,
    criado_por: user?.email || user?.usuario || "sistema",
    atualizado_em_brasilia: now,
    atualizado_por: user?.email || user?.usuario || "sistema",
  };
};

const buildPublicacaoPayload = (payload = {}, user) => {
  const now = getBrazilDateTime();
  const tipo = normalizeText(payload.tipo);
  const numero = normalizeText(payload.numero);
  const ano = normalizeText(payload.ano);
  const assunto = normalizeText(payload.assunto);
  const fallbackNome = [tipo, numero, ano].filter(Boolean).join(" ").trim();

  return {
    sigla_colegiado: normalizeKey(payload.sigla_colegiado),
    nome_pasta: normalizeText(payload.nome_pasta || fallbackNome || assunto || "Publicacao"),
    link_pasta: normalizeText(payload.link_pasta || payload.link) || "#",
    drive_folder_id: normalizeText(payload.drive_folder_id),
    tipo,
    numero,
    data_publicacao: normalizeDate(payload.data_publicacao || payload.data),
    ano,
    assunto,
    status: normalizePublicacaoStatus(payload.status),
    ativo: normalizeStatusAtivo(payload.ativo || payload.status || "Sim"),
    observacao: normalizeText(payload.observacao),
    criado_em_brasilia: now,
    criado_por: user?.email || user?.usuario || "sistema",
    atualizado_em_brasilia: now,
    atualizado_por: user?.email || user?.usuario || "sistema",
  };
};

const upsertHierarchyForColegiado = async (colegiado) => {
  await run(`DELETE FROM colegiado_hierarquia WHERE filho_sigla = ?`, [colegiado.sigla]);

  if (!colegiado.sigla_colegiado_pai) {
    return;
  }

  await run(
    `INSERT INTO colegiado_hierarquia (
      pai_sigla,
      filho_sigla,
      filho_chave_pasta,
      tipo_relacao,
      origem,
      municipio,
      uf,
      estado,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      colegiado.sigla_colegiado_pai,
      colegiado.sigla,
      colegiado.chave_pasta,
      "Instancia colegiada",
      "Edicao manual",
      colegiado.municipio,
      colegiado.uf,
      colegiado.estado,
    ],
  );
};

export const createColegiado = async ({ payload, user }) => {
  const normalized = buildColegiadoPayload(payload);

  if (!normalized.sigla || !normalized.nome) {
    throw new Error("Sigla e nome do colegiado sao obrigatorios.");
  }

  await run(
    `INSERT INTO colegiados (
      sigla,
      sigla_exibicao,
      chave_pasta,
      nome,
      categoria,
      tipo,
      descricao,
      competencia,
      sigla_colegiado_pai,
      unidade,
      sigla_unidade_pai,
      ato_criacao,
      data_instituicao,
      data_termino,
      qtd_min_reunioes_anuais,
      regra_quorum,
      observacoes,
      orgao,
      dispositivo_legal,
      ativo,
      titular,
      suplente,
      segundo_suplente,
      processo_nomeacao,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      normalized.sigla,
      normalized.sigla_exibicao,
      normalized.chave_pasta,
      normalized.nome,
      normalized.categoria,
      normalized.tipo,
      normalized.descricao,
      normalized.competencia,
      normalized.sigla_colegiado_pai,
      normalized.unidade,
      normalized.sigla_unidade_pai,
      normalized.ato_criacao,
      normalized.data_instituicao,
      normalized.data_termino,
      normalized.qtd_min_reunioes_anuais,
      normalized.regra_quorum,
      normalized.observacoes,
      normalized.orgao,
      normalized.dispositivo_legal,
      normalized.ativo,
      normalized.titular,
      normalized.suplente,
      normalized.segundo_suplente,
      normalized.processo_nomeacao,
    ],
  );

  await upsertHierarchyForColegiado(normalized);

  const created = await get(`SELECT * FROM colegiados WHERE sigla = ?`, [normalized.sigla]);
  await logChangeEvent({
    acao: "CRIAR_COLEGIADO",
    modulo: normalized.categoria === "Externo" ? "Colegiados Externos" : "Colegiados Internos",
    colegiadoPai: normalized.sigla_colegiado_pai,
    colegiadoAlvo: normalized.sigla,
    tipoRegistro: "Colegiado",
    idRegistroAfetado: created?.id,
    descricaoResumida: `Colegiado ${normalized.sigla} criado manualmente.`,
    dadosNovos: created,
    user,
  });

  return created;
};

export const updateColegiado = async ({ currentSigla, payload, user }) => {
  const existing = await get(`SELECT * FROM colegiados WHERE sigla = ? OR chave_pasta = ?`, [
    normalizeKey(currentSigla),
    normalizeKey(currentSigla),
  ]);

  if (!existing) {
    throw new Error("Colegiado nao localizado.");
  }

  const normalized = {
    ...buildColegiadoPayload({
      ...existing,
      ...payload,
      sigla: existing.sigla,
    }),
    sigla: existing.sigla,
  };

  await run(
    `UPDATE colegiados
     SET sigla_exibicao = ?,
         chave_pasta = ?,
         nome = ?,
         categoria = ?,
         tipo = ?,
         descricao = ?,
         competencia = ?,
         sigla_colegiado_pai = ?,
         unidade = ?,
         sigla_unidade_pai = ?,
         ato_criacao = ?,
         data_instituicao = ?,
         data_termino = ?,
         qtd_min_reunioes_anuais = ?,
         regra_quorum = ?,
         observacoes = ?,
         orgao = ?,
         dispositivo_legal = ?,
         ativo = ?,
         titular = ?,
         suplente = ?,
         segundo_suplente = ?,
         processo_nomeacao = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      normalized.sigla_exibicao,
      normalized.chave_pasta,
      normalized.nome,
      normalized.categoria,
      normalized.tipo,
      normalized.descricao,
      normalized.competencia,
      normalized.sigla_colegiado_pai,
      normalized.unidade,
      normalized.sigla_unidade_pai,
      normalized.ato_criacao,
      normalized.data_instituicao,
      normalized.data_termino,
      normalized.qtd_min_reunioes_anuais,
      normalized.regra_quorum,
      normalized.observacoes,
      normalized.orgao,
      normalized.dispositivo_legal,
      normalized.ativo,
      normalized.titular,
      normalized.suplente,
      normalized.segundo_suplente,
      normalized.processo_nomeacao,
      existing.id,
    ],
  );

  await upsertHierarchyForColegiado(normalized);

  const updated = await get(`SELECT * FROM colegiados WHERE id = ?`, [existing.id]);
  await logChangeEvent({
    acao: "EDITAR_COLEGIADO",
    modulo: updated.categoria === "Externo" ? "Colegiados Externos" : "Colegiados Internos",
    colegiadoPai: updated.sigla_colegiado_pai,
    colegiadoAlvo: updated.sigla,
    tipoRegistro: "Colegiado",
    idRegistroAfetado: updated.id,
    descricaoResumida: `Colegiado ${updated.sigla} atualizado manualmente.`,
    dadosAnteriores: existing,
    dadosNovos: updated,
    user,
  });

  return updated;
};

export const deleteColegiado = async ({ currentSigla, user }) => {
  const existing = await get(`SELECT * FROM colegiados WHERE sigla = ? OR chave_pasta = ?`, [
    normalizeKey(currentSigla),
    normalizeKey(currentSigla),
  ]);

  if (!existing) {
    throw new Error("Colegiado nao localizado.");
  }

  await run(`DELETE FROM membros WHERE sigla_colegiado = ?`, [existing.sigla]);
  await run(`DELETE FROM reunioes WHERE sigla_colegiado = ?`, [existing.sigla]);
  await run(`DELETE FROM pastas_publicacoes WHERE sigla_colegiado = ?`, [existing.sigla]);
  await run(`DELETE FROM colegiado_hierarquia WHERE filho_sigla = ? OR pai_sigla = ?`, [
    existing.sigla,
    existing.sigla,
  ]);
  await run(
    `UPDATE colegiados
     SET sigla_colegiado_pai = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE sigla_colegiado_pai = ?`,
    [existing.sigla],
  );
  await run(`DELETE FROM colegiados WHERE id = ?`, [existing.id]);

  await logChangeEvent({
    acao: "EXCLUIR_COLEGIADO",
    modulo: existing.categoria === "Externo" ? "Colegiados Externos" : "Colegiados Internos",
    colegiadoPai: existing.sigla_colegiado_pai,
    colegiadoAlvo: existing.sigla,
    tipoRegistro: "Colegiado",
    idRegistroAfetado: existing.id,
    descricaoResumida: `Colegiado ${existing.sigla} excluido manualmente.`,
    dadosAnteriores: existing,
    user,
  });

  return existing;
};

export const createMembro = async ({ payload, user }) => {
  const normalized = buildMembroPayload(payload, user);

  if (!normalized.nome_membro || !normalized.sigla_colegiado) {
    throw new Error("Nome e colegiado do membro sao obrigatorios.");
  }

  const result = await run(
    `INSERT INTO membros (
      nome_membro,
      sigla_colegiado,
      sigla_colegiado_pai,
      unidade,
      matricula,
      email_institucional,
      telefone_institucional,
      telefone_pessoal,
      tipo_vinculo,
      papel,
      detalhamento_papel,
      inicio_vigencia,
      fim_vigencia,
      ativo,
      observacao,
      criado_em_brasilia,
      criado_por,
      atualizado_em_brasilia,
      atualizado_por,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      normalized.nome_membro,
      normalized.sigla_colegiado,
      normalized.sigla_colegiado_pai,
      normalized.unidade,
      normalized.matricula,
      normalized.email_institucional,
      normalized.telefone_institucional,
      normalized.telefone_pessoal,
      normalized.tipo_vinculo,
      normalized.papel,
      normalized.detalhamento_papel,
      normalized.inicio_vigencia,
      normalized.fim_vigencia,
      normalized.ativo,
      normalized.observacao,
      normalized.criado_em_brasilia,
      normalized.criado_por,
      normalized.atualizado_em_brasilia,
      normalized.atualizado_por,
    ],
  );

  const created = await get(`SELECT * FROM membros WHERE id = ?`, [result.lastID]);
  await logChangeEvent({
    acao: "CRIAR_MEMBRO",
    modulo: "Membros",
    colegiadoPai: normalized.sigla_colegiado_pai,
    colegiadoAlvo: normalized.sigla_colegiado,
    tipoRegistro: "Membro",
    idRegistroAfetado: created.id,
    descricaoResumida: `Membro ${normalized.nome_membro} criado.`,
    dadosNovos: created,
    user,
  });

  return created;
};

export const updateMembro = async ({ id, payload, user }) => {
  const existing = await get(`SELECT * FROM membros WHERE id = ?`, [id]);
  if (!existing) {
    throw new Error("Membro nao localizado.");
  }

  const normalized = buildMembroPayload({ ...existing, ...payload }, user);
  await run(
    `UPDATE membros
     SET nome_membro = ?,
         sigla_colegiado = ?,
         sigla_colegiado_pai = ?,
         unidade = ?,
         matricula = ?,
         email_institucional = ?,
         telefone_institucional = ?,
         telefone_pessoal = ?,
         tipo_vinculo = ?,
         papel = ?,
         detalhamento_papel = ?,
         inicio_vigencia = ?,
         fim_vigencia = ?,
         ativo = ?,
         observacao = ?,
         atualizado_em_brasilia = ?,
         atualizado_por = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      normalized.nome_membro,
      normalized.sigla_colegiado,
      normalized.sigla_colegiado_pai,
      normalized.unidade,
      normalized.matricula,
      normalized.email_institucional,
      normalized.telefone_institucional,
      normalized.telefone_pessoal,
      normalized.tipo_vinculo,
      normalized.papel,
      normalized.detalhamento_papel,
      normalized.inicio_vigencia,
      normalized.fim_vigencia,
      normalized.ativo,
      normalized.observacao,
      normalized.atualizado_em_brasilia,
      normalized.atualizado_por,
      id,
    ],
  );

  const updated = await get(`SELECT * FROM membros WHERE id = ?`, [id]);
  await logChangeEvent({
    acao: "EDITAR_MEMBRO",
    modulo: "Membros",
    colegiadoPai: updated.sigla_colegiado_pai,
    colegiadoAlvo: updated.sigla_colegiado,
    tipoRegistro: "Membro",
    idRegistroAfetado: updated.id,
    descricaoResumida: `Membro ${updated.nome_membro} atualizado.`,
    dadosAnteriores: existing,
    dadosNovos: updated,
    user,
  });

  return updated;
};

export const deleteMembro = async ({ id, user }) => {
  const existing = await get(`SELECT * FROM membros WHERE id = ?`, [id]);
  if (!existing) {
    throw new Error("Membro nao localizado.");
  }

  await run(`DELETE FROM membros WHERE id = ?`, [id]);

  await logChangeEvent({
    acao: "EXCLUIR_MEMBRO",
    modulo: "Membros",
    colegiadoPai: existing.sigla_colegiado_pai,
    colegiadoAlvo: existing.sigla_colegiado,
    tipoRegistro: "Membro",
    idRegistroAfetado: existing.id,
    descricaoResumida: `Membro ${existing.nome_membro} excluido.`,
    dadosAnteriores: existing,
    user,
  });

  return existing;
};

export const createReuniao = async ({ payload, user }) => {
  const normalized = buildReuniaoPayload(payload, user);
  if (!normalized.sigla_colegiado || !normalized.id_reuniao) {
    throw new Error("Colegiado e identificacao da reuniao sao obrigatorios.");
  }

  const result = await run(
    `INSERT INTO reunioes (
      id_reuniao,
      id_colegiado,
      sigla_colegiado,
      id_unidade,
      data_reuniao,
      hora,
      local,
      classificacao_pauta,
      descricao_pauta,
      texto_ata,
      status_reuniao,
      quorum_registrado,
      link_ata,
      observacao,
      criado_em_brasilia,
      criado_por,
      atualizado_em_brasilia,
      atualizado_por,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      normalized.id_reuniao,
      normalized.id_colegiado,
      normalized.sigla_colegiado,
      normalized.id_unidade,
      normalized.data_reuniao,
      normalized.hora,
      normalized.local,
      normalized.classificacao_pauta,
      normalized.descricao_pauta,
      normalized.texto_ata,
      normalized.status_reuniao,
      normalized.quorum_registrado,
      normalized.link_ata,
      normalized.observacao,
      normalized.criado_em_brasilia,
      normalized.criado_por,
      normalized.atualizado_em_brasilia,
      normalized.atualizado_por,
    ],
  );

  const created = await get(`SELECT * FROM reunioes WHERE id = ?`, [result.lastID]);
  await logChangeEvent({
    acao: "CRIAR_REUNIAO",
    modulo: "Calendario de Reunioes",
    colegiadoAlvo: created.sigla_colegiado,
    tipoRegistro: "Reuniao",
    idRegistroAfetado: created.id,
    descricaoResumida: `Reuniao ${created.id_reuniao} criada.`,
    dadosNovos: created,
    user,
  });
  return created;
};

export const updateReuniao = async ({ id, payload, user }) => {
  const existing = await get(`SELECT * FROM reunioes WHERE id = ?`, [id]);
  if (!existing) {
    throw new Error("Reuniao nao localizada.");
  }

  const normalized = buildReuniaoPayload({ ...existing, ...payload }, user);
  await run(
    `UPDATE reunioes
     SET id_reuniao = ?,
         id_colegiado = ?,
         sigla_colegiado = ?,
         id_unidade = ?,
         data_reuniao = ?,
         hora = ?,
         local = ?,
         classificacao_pauta = ?,
         descricao_pauta = ?,
         texto_ata = ?,
         status_reuniao = ?,
         quorum_registrado = ?,
         link_ata = ?,
         observacao = ?,
         atualizado_em_brasilia = ?,
         atualizado_por = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      normalized.id_reuniao,
      normalized.id_colegiado,
      normalized.sigla_colegiado,
      normalized.id_unidade,
      normalized.data_reuniao,
      normalized.hora,
      normalized.local,
      normalized.classificacao_pauta,
      normalized.descricao_pauta,
      normalized.texto_ata,
      normalized.status_reuniao,
      normalized.quorum_registrado,
      normalized.link_ata,
      normalized.observacao,
      normalized.atualizado_em_brasilia,
      normalized.atualizado_por,
      id,
    ],
  );

  const updated = await get(`SELECT * FROM reunioes WHERE id = ?`, [id]);
  await logChangeEvent({
    acao: "EDITAR_REUNIAO",
    modulo: "Calendario de Reunioes",
    colegiadoAlvo: updated.sigla_colegiado,
    tipoRegistro: "Reuniao",
    idRegistroAfetado: updated.id,
    descricaoResumida: `Reuniao ${updated.id_reuniao} atualizada.`,
    dadosAnteriores: existing,
    dadosNovos: updated,
    user,
  });
  return updated;
};

export const deleteReuniao = async ({ id, user }) => {
  const existing = await get(`SELECT * FROM reunioes WHERE id = ?`, [id]);
  if (!existing) {
    throw new Error("Reuniao nao localizada.");
  }

  await run(`DELETE FROM reunioes WHERE id = ?`, [id]);

  await logChangeEvent({
    acao: "EXCLUIR_REUNIAO",
    modulo: "Calendario de Reunioes",
    colegiadoAlvo: existing.sigla_colegiado,
    tipoRegistro: "Reuniao",
    idRegistroAfetado: existing.id,
    descricaoResumida: `Reuniao ${existing.id_reuniao} excluida.`,
    dadosAnteriores: existing,
    user,
  });

  return existing;
};

export const createPublicacao = async ({ payload, user }) => {
  const normalized = buildPublicacaoPayload(payload, user);
  if (!normalized.sigla_colegiado || !normalized.nome_pasta) {
    throw new Error("Colegiado e titulo da publicacao sao obrigatorios.");
  }

  const result = await run(
    `INSERT INTO pastas_publicacoes (
      sigla_colegiado,
      nome_pasta,
      link_pasta,
      drive_folder_id,
      tipo,
      numero,
      data_publicacao,
      ano,
      assunto,
      status,
      observacao,
      ativo,
      criado_em_brasilia,
      criado_por,
      atualizado_em_brasilia,
      atualizado_por,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      normalized.sigla_colegiado,
      normalized.nome_pasta,
      normalized.link_pasta,
      normalized.drive_folder_id,
      normalized.tipo,
      normalized.numero,
      normalized.data_publicacao,
      normalized.ano,
      normalized.assunto,
      normalized.status,
      normalized.observacao,
      normalized.ativo,
      normalized.criado_em_brasilia,
      normalized.criado_por,
      normalized.atualizado_em_brasilia,
      normalized.atualizado_por,
    ],
  );

  const created = await get(`SELECT * FROM pastas_publicacoes WHERE id = ?`, [result.lastID]);
  await logChangeEvent({
    acao: "CRIAR_PUBLICACAO",
    modulo: "Publicacoes",
    colegiadoAlvo: created.sigla_colegiado,
    tipoRegistro: "Publicacao",
    idRegistroAfetado: created.id,
    descricaoResumida: `Publicacao ${created.nome_pasta} criada.`,
    dadosNovos: created,
    user,
  });

  return created;
};

export const updatePublicacao = async ({ id, payload, user }) => {
  const existing = await get(`SELECT * FROM pastas_publicacoes WHERE id = ?`, [id]);
  if (!existing) {
    throw new Error("Publicacao nao localizada.");
  }

  const normalized = buildPublicacaoPayload({ ...existing, ...payload }, user);
  await run(
    `UPDATE pastas_publicacoes
     SET sigla_colegiado = ?,
         nome_pasta = ?,
         link_pasta = ?,
         drive_folder_id = ?,
         tipo = ?,
         numero = ?,
         data_publicacao = ?,
         ano = ?,
         assunto = ?,
         status = ?,
         observacao = ?,
         ativo = ?,
         atualizado_em_brasilia = ?,
         atualizado_por = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      normalized.sigla_colegiado,
      normalized.nome_pasta,
      normalized.link_pasta,
      normalized.drive_folder_id,
      normalized.tipo,
      normalized.numero,
      normalized.data_publicacao,
      normalized.ano,
      normalized.assunto,
      normalized.status,
      normalized.observacao,
      normalized.ativo,
      normalized.atualizado_em_brasilia,
      normalized.atualizado_por,
      id,
    ],
  );

  const updated = await get(`SELECT * FROM pastas_publicacoes WHERE id = ?`, [id]);
  await logChangeEvent({
    acao: "EDITAR_PUBLICACAO",
    modulo: "Publicacoes",
    colegiadoAlvo: updated.sigla_colegiado,
    tipoRegistro: "Publicacao",
    idRegistroAfetado: updated.id,
    descricaoResumida: `Publicacao ${updated.nome_pasta} atualizada.`,
    dadosAnteriores: existing,
    dadosNovos: updated,
    user,
  });
  return updated;
};

export const deletePublicacao = async ({ id, user }) => {
  const existing = await get(`SELECT * FROM pastas_publicacoes WHERE id = ?`, [id]);
  if (!existing) {
    throw new Error("Publicacao nao localizada.");
  }

  await run(`DELETE FROM pastas_publicacoes WHERE id = ?`, [id]);

  await logChangeEvent({
    acao: "EXCLUIR_PUBLICACAO",
    modulo: "Publicacoes",
    colegiadoAlvo: existing.sigla_colegiado,
    tipoRegistro: "Publicacao",
    idRegistroAfetado: existing.id,
    descricaoResumida: `Publicacao ${existing.nome_pasta} excluida.`,
    dadosAnteriores: existing,
    user,
  });

  return existing;
};
