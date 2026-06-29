import { all, get, run } from "../database/db.js";

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

export const criarPublicacao = async (request, response) => {
  try {
    const { sigla_colegiado, nome_pasta, link_pasta, data_base, ativo = "Sim" } =
      request.body;

    const result = await run(
      `INSERT INTO pastas_publicacoes (
        sigla_colegiado,
        nome_pasta,
        link_pasta,
        data_base,
        ativo,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [sigla_colegiado.toUpperCase(), nome_pasta, link_pasta, data_base, ativo],
    );

    const created = await get(
      "SELECT * FROM pastas_publicacoes WHERE id = ?",
      [result.lastID],
    );
    response.status(201).json(created);
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
};

export const atualizarPublicacao = async (request, response) => {
  try {
    const { sigla_colegiado, nome_pasta, link_pasta, data_base, ativo } =
      request.body;

    await run(
      `UPDATE pastas_publicacoes
       SET sigla_colegiado = ?, nome_pasta = ?, link_pasta = ?, data_base = ?, ativo = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        sigla_colegiado.toUpperCase(),
        nome_pasta,
        link_pasta,
        data_base,
        ativo,
        request.params.id,
      ],
    );

    const updated = await get("SELECT * FROM pastas_publicacoes WHERE id = ?", [
      request.params.id,
    ]);
    response.json(updated);
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
};

export const excluirPublicacao = async (request, response) => {
  try {
    await run("DELETE FROM pastas_publicacoes WHERE id = ?", [request.params.id]);
    response.status(204).send();
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};
