import { all, get } from "../database/db.js";
import {
  UF_ESTADOS,
  getHierarchyByParent,
  getHierarchyByParentAndUf,
} from "../services/hierarquiaService.js";
import { createColegiado, updateColegiado } from "../services/contentCrudService.js";
import { normalizeKey } from "../utils/formatters.js";

const formatInstanciaPayload = (row) => ({
  sigla: row.filho_sigla,
  sigla_exibicao: row.sigla_exibicao || row.filho_sigla,
  chave_pasta: row.filho_chave_pasta || row.filho_sigla,
  nome: row.nome || row.sigla_exibicao || row.filho_sigla,
  municipio: row.municipio || null,
  uf: row.uf || null,
  estado: row.estado || null,
  ativo: row.ativo || "Nao informado",
  membros_count: row.membros_count || 0,
  reunioes_count: row.reunioes_count || 0,
});

const buildChildInstanceExclusion = () => `
  NOT EXISTS (
    SELECT 1
    FROM colegiado_hierarquia h
    WHERE h.filho_sigla = c.sigla
  )
  AND (
    c.sigla_colegiado_pai IS NULL
    OR TRIM(c.sigla_colegiado_pai) = ''
  )
`;

export const listarColegiados = async (_request, response) => {
  try {
    const conditions = [];
    const params = [];

    if (_request.query.categoria) {
      conditions.push("c.categoria = ?");
      params.push(_request.query.categoria);
    } else if (_request.query.tipo && ["Interno", "Externo"].includes(_request.query.tipo)) {
      conditions.push("c.categoria = ?");
      params.push(_request.query.tipo);
    } else if (_request.query.tipo) {
      conditions.push("c.tipo = ?");
      params.push(_request.query.tipo);
    }

    if (_request.query.sigla) {
      conditions.push("(c.sigla = ? OR c.chave_pasta = ? OR c.sigla_exibicao = ?)");
      params.push(
        normalizeKey(_request.query.sigla),
        normalizeKey(_request.query.sigla),
        _request.query.sigla,
      );
    }

    const shouldExcludeChildInstances =
      _request.query.incluirInstancias !== "true" &&
      (_request.query.categoria === "Interno" || _request.query.tipo === "Interno");

    if (shouldExcludeChildInstances) {
      conditions.push(buildChildInstanceExclusion());
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const colegiados = await all(
      `SELECT
        c.*,
        COALESCE(m.total_membros, 0) AS total_membros,
        COALESCE(r.total_reunioes, 0) AS total_reunioes,
        COALESCE(mu.data_base, ru.data_base, p.data_base) AS ultima_atualizacao
      FROM colegiados c
      LEFT JOIN (
        SELECT sigla_colegiado, COUNT(*) AS total_membros
        FROM membros
        GROUP BY sigla_colegiado
      ) m ON m.sigla_colegiado = c.sigla
      LEFT JOIN (
        SELECT sigla_colegiado, COUNT(*) AS total_reunioes
        FROM reunioes
        GROUP BY sigla_colegiado
      ) r ON r.sigla_colegiado = c.sigla
      LEFT JOIN (
        SELECT sigla_colegiado, MAX(data_base) AS data_base
        FROM membros
        GROUP BY sigla_colegiado
      ) mu ON mu.sigla_colegiado = c.sigla
      LEFT JOIN (
        SELECT sigla_colegiado, MAX(data_base) AS data_base
        FROM reunioes
        GROUP BY sigla_colegiado
      ) ru ON ru.sigla_colegiado = c.sigla
      LEFT JOIN (
        SELECT sigla_colegiado, MAX(data_base) AS data_base
        FROM pastas_publicacoes
        GROUP BY sigla_colegiado
      ) p ON p.sigla_colegiado = c.sigla
      ${whereClause}
      ORDER BY COALESCE(c.sigla_exibicao, c.sigla)`,
      params,
    );

    response.json(colegiados);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const listarInstanciasPorUf = async (request, response) => {
  try {
    const parentSigla = normalizeKey(request.params.sigla);
    const uf = normalizeKey(request.params.uf);
    const municipio = request.query.municipio || "";
    const rows = await getHierarchyByParentAndUf(parentSigla, uf, municipio);

    const estado = UF_ESTADOS[uf] || null;
    const instancias = rows.map(formatInstanciaPayload);

    response.json({
      pai: parentSigla,
      agrupamento: "estado",
      uf,
      estado,
      total: instancias.length,
      instancias,
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const listarInstanciasPorColegiado = async (request, response) => {
  try {
    const parentSigla = normalizeKey(request.params.sigla);
    const rows = await getHierarchyByParent(parentSigla);

    if (!rows.length) {
      response.json({
        pai: parentSigla,
        total: 0,
        agrupamento: null,
        instancias: [],
      });
      return;
    }

    const allChildrenAreCps = rows.every((row) => Boolean(row.uf));

    if (allChildrenAreCps) {
      const estadoMap = new Map();

      rows.forEach((row) => {
        const key = row.uf || "SEM_UF";
        const current = estadoMap.get(key) || {
          uf: row.uf,
          estado: row.estado || UF_ESTADOS[row.uf] || "Demais estados",
          total: 0,
          instancias: [],
        };

        current.instancias.push(formatInstanciaPayload(row));
        current.total += 1;
        estadoMap.set(key, current);
      });

      const estados = Array.from(estadoMap.values()).sort((left, right) =>
        String(left.estado || "").localeCompare(String(right.estado || ""), "pt-BR"),
      );

      response.json({
        pai: parentSigla,
        total: rows.length,
        agrupamento: "estado",
        estados,
      });
      return;
    }

    response.json({
      pai: parentSigla,
      total: rows.length,
      agrupamento: "direto",
      instancias: rows.map(formatInstanciaPayload),
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const obterColegiadoPorSigla = async (request, response) => {
  try {
    const requestedKey = normalizeKey(request.params.sigla);
    const colegiado = await get(
      `SELECT
        c.*,
        COALESCE(m.total_membros, 0) AS total_membros,
        COALESCE(r.total_reunioes, 0) AS total_reunioes,
        COALESCE(mu.data_base, ru.data_base, p.data_base) AS ultima_atualizacao
      FROM colegiados c
      LEFT JOIN (
        SELECT sigla_colegiado, COUNT(*) AS total_membros, MAX(data_base) AS data_base
        FROM membros
        GROUP BY sigla_colegiado
      ) mu ON mu.sigla_colegiado = c.sigla
      LEFT JOIN (
        SELECT sigla_colegiado, COUNT(*) AS total_reunioes, MAX(data_base) AS data_base
        FROM reunioes
        GROUP BY sigla_colegiado
      ) ru ON ru.sigla_colegiado = c.sigla
      LEFT JOIN (
        SELECT sigla_colegiado, MAX(data_base) AS data_base
        FROM pastas_publicacoes
        GROUP BY sigla_colegiado
      ) p ON p.sigla_colegiado = c.sigla
      LEFT JOIN (
        SELECT sigla_colegiado, COUNT(*) AS total_membros
        FROM membros
        GROUP BY sigla_colegiado
      ) m ON m.sigla_colegiado = c.sigla
      LEFT JOIN (
        SELECT sigla_colegiado, COUNT(*) AS total_reunioes
        FROM reunioes
        GROUP BY sigla_colegiado
      ) r ON r.sigla_colegiado = c.sigla
      WHERE c.sigla = ? OR c.chave_pasta = ? OR c.sigla_exibicao = ?`,
      [requestedKey, requestedKey, request.params.sigla],
    );

    if (!colegiado) {
      response.status(404).json({ message: "Colegiado nao encontrado." });
      return;
    }

    const [membros, reunioes, publicacoes] = await Promise.all([
      all(
        `SELECT *
         FROM membros
         WHERE sigla_colegiado = ?
         ORDER BY nome_membro`,
        [colegiado.sigla],
      ),
      all(
        `SELECT *
         FROM reunioes
         WHERE sigla_colegiado = ?
         ORDER BY COALESCE(data_reuniao, '') DESC, COALESCE(hora, '') DESC`,
        [colegiado.sigla],
      ),
      all(
        `SELECT *
         FROM pastas_publicacoes
         WHERE sigla_colegiado = ?
         ORDER BY nome_pasta`,
        [colegiado.sigla],
      ),
    ]);

    response.json({
      ...colegiado,
      membros,
      reunioes,
      publicacoes,
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const criarColegiado = async (request, response) => {
  try {
    const colegiado = await createColegiado({
      payload: request.body || {},
      user: request.adminUser,
    });

    response.status(201).json({
      success: true,
      message: "Colegiado salvo com sucesso.",
      colegiado,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel salvar o colegiado.",
    });
  }
};

export const atualizarColegiado = async (request, response) => {
  try {
    const colegiado = await updateColegiado({
      currentSigla: request.params.sigla,
      payload: request.body || {},
      user: request.adminUser,
    });

    response.json({
      success: true,
      message: "Colegiado atualizado com sucesso.",
      colegiado,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel atualizar o colegiado.",
    });
  }
};
