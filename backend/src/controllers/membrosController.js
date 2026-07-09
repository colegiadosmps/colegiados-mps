import { all } from "../database/db.js";
import {
  createMembro,
  deleteMembro,
  updateMembro,
} from "../services/contentCrudService.js";

export const listarMembros = async (request, response) => {
  try {
    const conditions = [];
    const params = [];

    if (request.query.colegiado) {
      conditions.push("sigla_colegiado = ?");
      params.push(request.query.colegiado.toUpperCase());
    }

    if (request.query.ativo) {
      conditions.push("ativo = ?");
      params.push(request.query.ativo);
    }

    if (request.query.tipo_vinculo) {
      conditions.push("tipo_vinculo = ?");
      params.push(request.query.tipo_vinculo);
    }

    if (request.query.papel) {
      conditions.push("papel = ?");
      params.push(request.query.papel);
    }

    if (request.query.search) {
      conditions.push(
        "(LOWER(nome_membro) LIKE ? OR LOWER(detalhamento_papel) LIKE ?)",
      );
      const term = `%${request.query.search.toLowerCase()}%`;
      params.push(term, term);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const membros = await all(
      `SELECT *
       FROM membros
       ${whereClause}
       ORDER BY nome_membro`,
      params,
    );

    response.json(membros);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const criarMembro = async (request, response) => {
  try {
    const membro = await createMembro({
      payload: request.body || {},
      user: request.adminUser,
    });

    response.status(201).json({
      success: true,
      message: "Membro salvo com sucesso.",
      membro,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel salvar o membro.",
    });
  }
};

export const atualizarMembro = async (request, response) => {
  try {
    const membro = await updateMembro({
      id: request.params.id,
      payload: request.body || {},
      user: request.adminUser,
    });

    response.json({
      success: true,
      message: "Membro atualizado com sucesso.",
      membro,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel atualizar o membro.",
    });
  }
};

export const excluirMembro = async (request, response) => {
  try {
    await deleteMembro({
      id: request.params.id,
      user: request.adminUser,
    });

    response.status(204).send();
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel excluir o membro.",
    });
  }
};
