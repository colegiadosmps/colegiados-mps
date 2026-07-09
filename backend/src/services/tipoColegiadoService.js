import { all, get, run } from "../database/db.js";
import { logChangeEvent } from "./auditService.js";
import { normalizeText } from "../utils/formatters.js";

const DEFAULT_TIPOS = [
  {
    categoria: "Interno",
    nome: "Camara",
    nome_exibicao: "Camara",
    slug: "camara",
    descricao: "Camaras vinculadas a colegiados e estruturas tematicas da base.",
    ordem_exibicao: 1,
  },
  {
    categoria: "Interno",
    nome: "Comite",
    nome_exibicao: "Comite",
    slug: "comite",
    descricao: "Comites permanentes e tecnicos vinculados ao sistema.",
    ordem_exibicao: 2,
  },
  {
    categoria: "Interno",
    nome: "Conselho",
    nome_exibicao: "Conselho",
    slug: "conselho",
    descricao: "Conselhos nacionais e Conselhos de Previdencia Social vinculados a base.",
    ordem_exibicao: 3,
  },
  {
    categoria: "Interno",
    nome: "Grupo de Trabalho",
    nome_exibicao: "Grupo de Trabalho",
    slug: "grupo-de-trabalho",
    descricao: "Grupos de trabalho e frentes temporarias registradas no conjunto interno.",
    ordem_exibicao: 4,
  },
  {
    categoria: "Interno",
    nome: "Subcomite",
    nome_exibicao: "Subcomite",
    slug: "subcomite",
    descricao: "Subcomites vinculados a colegiados com atuacao especializada.",
    ordem_exibicao: 5,
  },
];

const normalizeSlug = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeTipoPayload = (payload = {}) => {
  const nome = normalizeText(payload.nome);
  const nomeExibicao = normalizeText(payload.nome_exibicao) || nome;
  const slug = normalizeSlug(payload.slug || nomeExibicao || nome);

  return {
    categoria: normalizeText(payload.categoria) || "Interno",
    nome,
    nome_exibicao: nomeExibicao,
    slug,
    descricao: normalizeText(payload.descricao),
    ordem_exibicao: Number(payload.ordem_exibicao || 0) || 0,
    status: normalizeText(payload.status) || "Ativo",
    observacoes: normalizeText(payload.observacoes),
  };
};

export const ensureTipoColegiadoSeed = async () => {
  for (const tipo of DEFAULT_TIPOS) {
    await run(
      `INSERT OR IGNORE INTO tipos_colegiados (
        categoria,
        nome,
        nome_exibicao,
        slug,
        descricao,
        ordem_exibicao,
        status,
        observacoes,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'Ativo', NULL, CURRENT_TIMESTAMP)`,
      [
        tipo.categoria,
        tipo.nome,
        tipo.nome_exibicao,
        tipo.slug,
        tipo.descricao,
        tipo.ordem_exibicao,
      ],
    );
  }
};

export const listTiposColegiados = async ({ categoria = "Interno" } = {}) =>
  all(
    `SELECT
      t.*,
      COALESCE(c.total_colegiados, 0) AS total_colegiados
     FROM tipos_colegiados t
     LEFT JOIN (
       SELECT tipo, categoria, COUNT(*) AS total_colegiados
       FROM colegiados
       WHERE COALESCE(sigla_colegiado_pai, '') = ''
       GROUP BY tipo, categoria
     ) c ON c.tipo = t.nome_exibicao AND c.categoria = t.categoria
     WHERE t.categoria = ?
     ORDER BY t.ordem_exibicao, t.nome_exibicao`,
    [categoria],
  );

export const createTipoColegiado = async ({ payload, user }) => {
  const normalized = normalizeTipoPayload(payload);

  if (!normalized.nome || !normalized.slug) {
    throw new Error("Nome e slug do tipo sao obrigatorios.");
  }

  const existing = await get(`SELECT id FROM tipos_colegiados WHERE slug = ?`, [normalized.slug]);
  if (existing) {
    throw new Error("Ja existe um tipo de colegiado com esse identificador.");
  }

  const result = await run(
    `INSERT INTO tipos_colegiados (
      categoria,
      nome,
      nome_exibicao,
      slug,
      descricao,
      ordem_exibicao,
      status,
      observacoes,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      normalized.categoria,
      normalized.nome,
      normalized.nome_exibicao,
      normalized.slug,
      normalized.descricao,
      normalized.ordem_exibicao,
      normalized.status,
      normalized.observacoes,
    ],
  );

  const created = await get(`SELECT * FROM tipos_colegiados WHERE id = ?`, [result.lastID]);
  await logChangeEvent({
    acao: "CRIAR_TIPO_COLEGIADO",
    modulo: "Colegiados Internos",
    tipoRegistro: "Tipo de colegiado",
    idRegistroAfetado: created.id,
    descricaoResumida: `Tipo ${created.nome_exibicao} criado.`,
    dadosNovos: created,
    user,
  });

  return created;
};

export const updateTipoColegiado = async ({ id, payload, user }) => {
  const existing = await get(`SELECT * FROM tipos_colegiados WHERE id = ?`, [id]);
  if (!existing) {
    throw new Error("Tipo de colegiado nao localizado.");
  }

  const normalized = normalizeTipoPayload({ ...existing, ...payload, slug: existing.slug });
  if (!normalized.nome || !normalized.nome_exibicao) {
    throw new Error("Nome do tipo e obrigatorio.");
  }

  await run(
    `UPDATE tipos_colegiados
     SET categoria = ?,
         nome = ?,
         nome_exibicao = ?,
         descricao = ?,
         ordem_exibicao = ?,
         status = ?,
         observacoes = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      normalized.categoria,
      normalized.nome,
      normalized.nome_exibicao,
      normalized.descricao,
      normalized.ordem_exibicao,
      normalized.status,
      normalized.observacoes,
      id,
    ],
  );

  if (existing.nome_exibicao !== normalized.nome_exibicao) {
    await run(
      `UPDATE colegiados
       SET tipo = ?, updated_at = CURRENT_TIMESTAMP
       WHERE tipo = ? AND categoria = ?`,
      [normalized.nome_exibicao, existing.nome_exibicao, existing.categoria],
    );
  }

  const updated = await get(`SELECT * FROM tipos_colegiados WHERE id = ?`, [id]);
  await logChangeEvent({
    acao: "EDITAR_TIPO_COLEGIADO",
    modulo: "Colegiados Internos",
    tipoRegistro: "Tipo de colegiado",
    idRegistroAfetado: updated.id,
    descricaoResumida: `Tipo ${updated.nome_exibicao} atualizado.`,
    dadosAnteriores: existing,
    dadosNovos: updated,
    user,
  });

  return updated;
};

export const deleteTipoColegiado = async ({ id, user }) => {
  const existing = await get(`SELECT * FROM tipos_colegiados WHERE id = ?`, [id]);
  if (!existing) {
    throw new Error("Tipo de colegiado nao localizado.");
  }

  const linked = await get(
    `SELECT COUNT(*) AS total FROM colegiados WHERE tipo = ? AND categoria = ?`,
    [existing.nome_exibicao, existing.categoria],
  );

  if (Number(linked?.total || 0) > 0) {
    const error = new Error("Existem colegiados vinculados a este tipo.");
    error.code = "TIPO_COM_COLEGIADOS";
    error.totalLinked = Number(linked.total || 0);
    throw error;
  }

  await run(`DELETE FROM tipos_colegiados WHERE id = ?`, [id]);

  await logChangeEvent({
    acao: "EXCLUIR_TIPO_COLEGIADO",
    modulo: "Colegiados Internos",
    tipoRegistro: "Tipo de colegiado",
    idRegistroAfetado: existing.id,
    descricaoResumida: `Tipo ${existing.nome_exibicao} excluido.`,
    dadosAnteriores: existing,
    user,
  });

  return existing;
};
