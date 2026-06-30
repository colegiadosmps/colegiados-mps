import {
  executarSincronizacao,
  listarSincronizacoes,
  obterSincronizacaoPorId,
} from "../services/sincronizacaoService.js";

export const listarHistoricoSincronizacoes = async (_request, response) => {
  try {
    const sincronizacoes = await listarSincronizacoes();
    response.json(sincronizacoes);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const detalharSincronizacao = async (request, response) => {
  try {
    const sincronizacao = await obterSincronizacaoPorId(request.params.id);

    if (!sincronizacao) {
      response.status(404).json({ message: "Sincronizacao nao encontrada." });
      return;
    }

    response.json(sincronizacao);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const executarSincronizacaoAgora = async (_request, response) => {
  try {
    const result = await executarSincronizacao();
    response.json(result);
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
};
