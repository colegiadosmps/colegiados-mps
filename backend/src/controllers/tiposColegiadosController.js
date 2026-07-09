import {
  createTipoColegiado,
  deleteTipoColegiado,
  listTiposColegiados,
  updateTipoColegiado,
} from "../services/tipoColegiadoService.js";

export const listarTiposColegiados = async (request, response) => {
  try {
    const tipos = await listTiposColegiados({
      categoria: request.query.categoria || "Interno",
    });
    response.json(tipos);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const criarTipoColegiado = async (request, response) => {
  try {
    const tipo = await createTipoColegiado({
      payload: request.body || {},
      user: request.adminUser,
    });

    response.status(201).json({
      success: true,
      message: "Tipo de colegiado salvo com sucesso.",
      tipo,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel salvar o tipo de colegiado.",
    });
  }
};

export const atualizarTipoColegiado = async (request, response) => {
  try {
    const tipo = await updateTipoColegiado({
      id: request.params.id,
      payload: request.body || {},
      user: request.adminUser,
    });

    response.json({
      success: true,
      message: "Tipo de colegiado atualizado com sucesso.",
      tipo,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel atualizar o tipo de colegiado.",
    });
  }
};

export const excluirTipoColegiado = async (request, response) => {
  try {
    await deleteTipoColegiado({
      id: request.params.id,
      user: request.adminUser,
    });

    response.status(204).send();
  } catch (error) {
    response.status(error.code === "TIPO_COM_COLEGIADOS" ? 409 : 400).json({
      success: false,
      code: error.code || null,
      totalLinked: error.totalLinked || 0,
      message: error.message || "Nao foi possivel excluir o tipo de colegiado.",
    });
  }
};
