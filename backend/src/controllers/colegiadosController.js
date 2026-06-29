import { all, get, run } from "../database/db.js";

export const listarColegiados = async (_request, response) => {
  try {
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
      ORDER BY c.sigla`,
    );

    response.json(colegiados);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const obterColegiadoPorSigla = async (request, response) => {
  try {
    const colegiado = await get(
      `SELECT * FROM colegiados WHERE sigla = ?`,
      [request.params.sigla.toUpperCase()],
    );

    if (!colegiado) {
      response.status(404).json({ message: "Colegiado nao encontrado." });
      return;
    }

    response.json(colegiado);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const criarColegiado = async (request, response) => {
  try {
    const { sigla, nome, tipo, descricao, ativo = "Sim" } = request.body;

    const result = await run(
      `INSERT INTO colegiados (sigla, nome, tipo, descricao, ativo, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [sigla?.toUpperCase(), nome, tipo, descricao, ativo],
    );

    const colegiado = await get("SELECT * FROM colegiados WHERE id = ?", [
      result.lastID,
    ]);
    response.status(201).json(colegiado);
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
};

export const atualizarColegiado = async (request, response) => {
  try {
    const { sigla, nome, tipo, descricao, ativo } = request.body;
    const { id } = request.params;
    const current = await get("SELECT * FROM colegiados WHERE id = ?", [id]);

    if (!current) {
      response.status(404).json({ message: "Colegiado nao encontrado." });
      return;
    }

    const nextSigla = sigla?.toUpperCase();

    await run(
      `UPDATE colegiados
       SET sigla = ?, nome = ?, tipo = ?, descricao = ?, ativo = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [nextSigla, nome, tipo, descricao, ativo, id],
    );

    if (current.sigla !== nextSigla) {
      await Promise.all([
        run(
          "UPDATE membros SET sigla_colegiado = ?, updated_at = datetime('now') WHERE sigla_colegiado = ?",
          [nextSigla, current.sigla],
        ),
        run(
          "UPDATE reunioes SET sigla_colegiado = ?, updated_at = datetime('now') WHERE sigla_colegiado = ?",
          [nextSigla, current.sigla],
        ),
        run(
          "UPDATE pastas_publicacoes SET sigla_colegiado = ?, updated_at = datetime('now') WHERE sigla_colegiado = ?",
          [nextSigla, current.sigla],
        ),
      ]);
    }

    const colegiado = await get("SELECT * FROM colegiados WHERE id = ?", [id]);
    response.json(colegiado);
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
};

export const excluirColegiado = async (request, response) => {
  try {
    const colegiado = await get("SELECT * FROM colegiados WHERE id = ?", [
      request.params.id,
    ]);

    if (!colegiado) {
      response.status(404).json({ message: "Colegiado nao encontrado." });
      return;
    }

    await Promise.all([
      run("DELETE FROM membros WHERE sigla_colegiado = ?", [colegiado.sigla]),
      run("DELETE FROM reunioes WHERE sigla_colegiado = ?", [colegiado.sigla]),
      run("DELETE FROM pastas_publicacoes WHERE sigla_colegiado = ?", [
        colegiado.sigla,
      ]),
      run("DELETE FROM colegiados WHERE id = ?", [request.params.id]),
    ]);

    response.status(204).send();
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const obterDashboard = async (_request, response) => {
  try {
    const [
      totalColegiados,
      totalMembros,
      totalMembrosAtivos,
      totalReunioes,
      totalPastasPublicacoes,
      ultimaImportacao,
      colegiados,
    ] = await Promise.all([
      get("SELECT COUNT(*) AS total FROM colegiados"),
      get("SELECT COUNT(*) AS total FROM membros"),
      get("SELECT COUNT(*) AS total FROM membros WHERE ativo = 'Sim'"),
      get("SELECT COUNT(*) AS total FROM reunioes"),
      get("SELECT COUNT(*) AS total FROM pastas_publicacoes"),
      get(
        "SELECT data_importacao FROM importacoes ORDER BY datetime(data_importacao) DESC, id DESC LIMIT 1",
      ),
      all(
        `SELECT
          c.sigla,
          c.nome,
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
        ORDER BY c.sigla`,
      ),
    ]);

    response.json({
      total_colegiados: totalColegiados.total,
      total_membros: totalMembros.total,
      total_membros_ativos: totalMembrosAtivos.total,
      total_reunioes: totalReunioes.total,
      total_pastas_publicacoes: totalPastasPublicacoes.total,
      ultima_importacao: ultimaImportacao?.data_importacao || null,
      colegiados,
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};
