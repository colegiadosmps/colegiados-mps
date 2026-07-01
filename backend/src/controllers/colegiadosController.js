import { all, get } from "../database/db.js";

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
      ORDER BY c.sigla`,
      params,
    );

    response.json(colegiados);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const obterColegiadoPorSigla = async (request, response) => {
  try {
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
      WHERE c.sigla = ?`,
      [request.params.sigla.toUpperCase()],
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
