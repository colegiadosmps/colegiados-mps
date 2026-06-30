import { all } from "../database/db.js";

export const listarPublicacoes = async (request, response) => {
  try {
    const conditions = [];
    const params = [];

    if (request.query.colegiado) {
      conditions.push("p.sigla_colegiado = ?");
      params.push(request.query.colegiado.toUpperCase());
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const publicacoes = await all(
      `SELECT p.*, c.nome AS nome_colegiado
       FROM pastas_publicacoes p
       LEFT JOIN colegiados c ON c.sigla = p.sigla_colegiado
       ${whereClause}
       ORDER BY p.sigla_colegiado, p.nome_pasta`,
      params,
    );

    response.json(publicacoes);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

