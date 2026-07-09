import { all } from "../database/db.js";
import {
  createReuniao,
  deleteReuniao,
  updateReuniao,
} from "../services/contentCrudService.js";

export const listarReunioes = async (request, response) => {
  try {
    const conditions = [];
    const params = [];

    if (request.query.colegiado) {
      conditions.push("sigla_colegiado = ?");
      params.push(request.query.colegiado.toUpperCase());
    }

    if (request.query.status) {
      conditions.push("status_reuniao = ?");
      params.push(request.query.status);
    }

    if (request.query.data) {
      conditions.push("data_reuniao = ?");
      params.push(request.query.data);
    }

    if (request.query.search) {
      conditions.push(
        "(LOWER(classificacao_pauta) LIKE ? OR LOWER(descricao_pauta) LIKE ?)",
      );
      const term = `%${request.query.search.toLowerCase()}%`;
      params.push(term, term);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const reunioes = await all(
      `SELECT *
       FROM reunioes
       ${whereClause}
       ORDER BY COALESCE(data_reuniao, ''), COALESCE(hora, '') DESC`,
      params,
    );

    response.json(reunioes);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const criarReuniao = async (request, response) => {
  try {
    const reuniao = await createReuniao({
      payload: request.body || {},
      user: request.adminUser,
    });

    response.status(201).json({
      success: true,
      message: "Reuniao salva com sucesso.",
      reuniao,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel salvar a reuniao.",
    });
  }
};

export const atualizarReuniao = async (request, response) => {
  try {
    const reuniao = await updateReuniao({
      id: request.params.id,
      payload: request.body || {},
      user: request.adminUser,
    });

    response.json({
      success: true,
      message: "Reuniao atualizada com sucesso.",
      reuniao,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel atualizar a reuniao.",
    });
  }
};

export const excluirReuniao = async (request, response) => {
  try {
    await deleteReuniao({
      id: request.params.id,
      user: request.adminUser,
    });

    response.status(204).send();
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel excluir a reuniao.",
    });
  }
};
