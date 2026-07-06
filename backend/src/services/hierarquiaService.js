import { all, run } from "../database/db.js";
import { formatDateTime, normalizeKey, normalizeText } from "../utils/formatters.js";

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

const normalizeHierarchyText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
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

export const extractCpsLocation = (value) => {
  const normalized = normalizeHierarchyText(value);

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
  const municipio = toTitleCase(parts.slice(1, -1).join(" "));

  return {
    municipio: municipio || null,
    uf: UF_TO_ESTADO[uf] ? uf : null,
    estado: UF_TO_ESTADO[uf] || null,
  };
};

const ensureHierarchyColegiado = async ({
  sigla,
  siglaExibicao,
  chavePasta,
  nome,
  parentSigla,
}) => {
  const now = formatDateTime(new Date());
  const normalizedSigla = normalizeKey(sigla || chavePasta || siglaExibicao);
  const displayValue = normalizeText(siglaExibicao) || normalizedSigla;

  if (!normalizedSigla) {
    return;
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
      sigla_colegiado_pai,
      ativo,
      updated_at
    ) VALUES (?, ?, ?, ?, 'Interno', 'Instancia colegiada', ?, ?, 'Sim', ?)
     ON CONFLICT(sigla) DO UPDATE SET
       sigla_exibicao = COALESCE(colegiados.sigla_exibicao, excluded.sigla_exibicao),
       chave_pasta = COALESCE(colegiados.chave_pasta, excluded.chave_pasta),
       nome = CASE
         WHEN colegiados.nome IS NULL OR colegiados.nome = colegiados.sigla THEN excluded.nome
         ELSE colegiados.nome
       END,
       sigla_colegiado_pai = COALESCE(colegiados.sigla_colegiado_pai, excluded.sigla_colegiado_pai),
       updated_at = excluded.updated_at`,
    [
      normalizedSigla,
      displayValue,
      normalizeKey(chavePasta || displayValue || normalizedSigla),
      normalizeText(nome) || displayValue,
      "Colegiado criado automaticamente a partir da hierarquia de pastas.",
      normalizeKey(parentSigla),
      now,
    ],
  );
};

export const rebuildColegiadoHierarchy = async (folderRelations = []) => {
  const now = formatDateTime(new Date());
  const csvRelations = await all(
    `SELECT sigla, sigla_exibicao, chave_pasta, nome, sigla_colegiado_pai
     FROM colegiados
     WHERE sigla_colegiado_pai IS NOT NULL
       AND TRIM(sigla_colegiado_pai) <> ''`,
  );

  const relationMap = new Map();

  const registerRelation = (relation) => {
    const paiSigla = normalizeKey(relation.paiSigla);
    const filhoSigla = normalizeKey(
      relation.filhoSigla || relation.filhoChavePasta || relation.siglaExibicao,
    );

    if (!paiSigla || !filhoSigla || paiSigla === filhoSigla) {
      return;
    }

    const key = `${paiSigla}::${filhoSigla}`;
    const current = relationMap.get(key);
    const location = extractCpsLocation(
      relation.siglaExibicao || relation.filhoSigla || relation.filhoChavePasta,
    );

    relationMap.set(key, {
      paiSigla,
      filhoSigla,
      filhoChavePasta: normalizeKey(
        relation.filhoChavePasta || relation.siglaExibicao || relation.filhoSigla,
      ),
      siglaExibicao: normalizeText(relation.siglaExibicao) || filhoSigla,
      nome: normalizeText(relation.nome) || normalizeText(relation.siglaExibicao) || filhoSigla,
      tipoRelacao: "Instancia colegiada",
      origem: current
        ? current.origem.includes(relation.origem)
          ? current.origem
          : `${current.origem} + ${relation.origem}`
        : relation.origem,
      municipio: relation.municipio || location.municipio,
      uf: relation.uf || location.uf,
      estado: relation.estado || location.estado,
    });
  };

  csvRelations.forEach((row) =>
    registerRelation({
      paiSigla: row.sigla_colegiado_pai,
      filhoSigla: row.sigla,
      filhoChavePasta: row.chave_pasta || row.sigla,
      siglaExibicao: row.sigla_exibicao || row.sigla,
      nome: row.nome,
      origem: "Colegiados.csv",
    }),
  );

  folderRelations.forEach((row) =>
    registerRelation({
      ...row,
      origem: row.origem || "Pasta Google Drive",
    }),
  );

  for (const relation of relationMap.values()) {
    await ensureHierarchyColegiado({
      sigla: relation.filhoSigla,
      siglaExibicao: relation.siglaExibicao,
      chavePasta: relation.filhoChavePasta,
      nome: relation.nome,
      parentSigla: relation.paiSigla,
    });
  }

  await run("DELETE FROM colegiado_hierarquia");

  for (const relation of relationMap.values()) {
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        relation.paiSigla,
        relation.filhoSigla,
        relation.filhoChavePasta,
        relation.tipoRelacao,
        relation.origem,
        relation.municipio,
        relation.uf,
        relation.estado,
        now,
        now,
      ],
    );
  }
};

export const getHierarchyByParent = async (parentSigla) => {
  const paiSigla = normalizeKey(parentSigla);

  return all(
    `SELECT
      h.*,
      c.sigla_exibicao,
      c.nome,
      c.ativo,
      COALESCE(m.total_membros, 0) AS membros_count,
      COALESCE(r.total_reunioes, 0) AS reunioes_count
     FROM colegiado_hierarquia h
     LEFT JOIN colegiados c ON c.sigla = h.filho_sigla
     LEFT JOIN (
       SELECT sigla_colegiado, COUNT(*) AS total_membros
       FROM membros
       GROUP BY sigla_colegiado
     ) m ON m.sigla_colegiado = h.filho_sigla
     LEFT JOIN (
       SELECT sigla_colegiado, COUNT(*) AS total_reunioes
       FROM reunioes
       GROUP BY sigla_colegiado
     ) r ON r.sigla_colegiado = h.filho_sigla
     WHERE h.pai_sigla = ?
     ORDER BY COALESCE(h.estado, ''), COALESCE(h.municipio, ''), COALESCE(c.sigla_exibicao, h.filho_sigla)`,
    [paiSigla],
  );
};

export const getHierarchyByParentAndUf = async (parentSigla, uf, municipio) => {
  const paiSigla = normalizeKey(parentSigla);
  const normalizedUf = normalizeKey(uf);
  const conditions = ["h.pai_sigla = ?", "h.uf = ?"];
  const params = [paiSigla, normalizedUf];

  if (municipio) {
    conditions.push("UPPER(COALESCE(h.municipio, '')) LIKE ?");
    params.push(`%${String(municipio).trim().toUpperCase()}%`);
  }

  return all(
    `SELECT
      h.*,
      c.sigla_exibicao,
      c.nome,
      c.ativo,
      COALESCE(m.total_membros, 0) AS membros_count,
      COALESCE(r.total_reunioes, 0) AS reunioes_count
     FROM colegiado_hierarquia h
     LEFT JOIN colegiados c ON c.sigla = h.filho_sigla
     LEFT JOIN (
       SELECT sigla_colegiado, COUNT(*) AS total_membros
       FROM membros
       GROUP BY sigla_colegiado
     ) m ON m.sigla_colegiado = h.filho_sigla
     LEFT JOIN (
       SELECT sigla_colegiado, COUNT(*) AS total_reunioes
       FROM reunioes
       GROUP BY sigla_colegiado
     ) r ON r.sigla_colegiado = h.filho_sigla
     WHERE ${conditions.join(" AND ")}
     ORDER BY COALESCE(h.municipio, ''), COALESCE(c.sigla_exibicao, h.filho_sigla)`,
    params,
  );
};

export const UF_ESTADOS = UF_TO_ESTADO;
