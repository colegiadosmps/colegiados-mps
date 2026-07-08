import { all } from "../database/db.js";
import { createPublicacao, updatePublicacao } from "../services/contentCrudService.js";

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
    const publicacao = await createPublicacao({
      payload: request.body || {},
      user: request.adminUser,
    });

    response.status(201).json({
      success: true,
      message: "Publicacao salva com sucesso.",
      publicacao,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel salvar a publicacao.",
    });
  }
};

export const atualizarPublicacao = async (request, response) => {
  try {
    const publicacao = await updatePublicacao({
      id: request.params.id,
      payload: request.body || {},
      user: request.adminUser,
    });

    response.json({
      success: true,
      message: "Publicacao atualizada com sucesso.",
      publicacao,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel atualizar a publicacao.",
    });
  }
};

