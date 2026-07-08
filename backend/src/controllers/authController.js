import {
  authenticateAdminUser,
  changeAuthenticatedUserPassword,
  createCollaboratorUser,
  listAdminUsers,
  resetUserPasswordByAdmin,
  revokeSession,
} from "../services/authService.js";
import { logAccessEvent, logChangeEvent } from "../services/auditService.js";

const extractToken = (request) => {
  const authorization = request.headers.authorization || "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
};

const buildSuccessResponse = ({ token, user }) => ({
  authorized: true,
  authenticated: true,
  message: "Acesso autorizado",
  token,
  user,
});

export const autenticarAdmin = async (request, response) => {
  try {
    const { user, password } = request.body || {};
    const session = await authenticateAdminUser({
      login: user,
      password,
    });

    if (!session) {
      await logAccessEvent({
        evento: "LOGIN_ERRO",
        observacao: `Tentativa de login para ${user || "usuario nao informado"}.`,
        status: "ERRO",
      });
      response.status(401).json({
        authorized: false,
        authenticated: false,
        message: "Usuario ou senha invalidos",
      });
      return;
    }

    await logAccessEvent({
      evento: "LOGIN_SUCESSO",
      observacao: "Autenticacao concluida.",
      user: session.user,
    });
    await logAccessEvent({
      evento: "ENTROU_MODO_EDICAO",
      observacao: "Sessao autenticada iniciada.",
      user: session.user,
    });

    response.json(buildSuccessResponse(session));
  } catch (error) {
    response.status(500).json({
      authorized: false,
      authenticated: false,
      message: error.message || "Nao foi possivel autenticar o usuario.",
    });
  }
};

export const login = async (request, response) => autenticarAdmin(request, response);

export const logout = async (request, response) => {
  try {
    const token = extractToken(request);

    if (token) {
      await revokeSession(token);
    }

    if (request.adminUser) {
      await logAccessEvent({
        evento: "LOGOUT",
        observacao: "Sessao encerrada pelo usuario.",
        user: request.adminUser,
      });
      await logAccessEvent({
        evento: "SAIU_MODO_EDICAO",
        observacao: "Modo de edicao desativado.",
        user: request.adminUser,
      });
    }

    response.json({
      success: true,
      message: "Sessao encerrada com sucesso.",
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || "Nao foi possivel encerrar a sessao.",
    });
  }
};

export const me = async (request, response) => {
  try {
    response.json({
      authenticated: true,
      user: request.adminUser,
    });
  } catch (error) {
    response.status(500).json({
      authenticated: false,
      message: error.message || "Nao foi possivel consultar a sessao.",
    });
  }
};

export const forgotPassword = async (_request, response) => {
  await logAccessEvent({
    evento: "ESQUECI_MINHA_SENHA",
    observacao: "Solicitacao de ajuda para redefinicao de senha.",
  });
  response.json({
    success: true,
    message:
      "Solicitacao registrada. Nesta fase inicial, a redefinicao de senha deve ser feita pelo administrador.",
  });
};

export const changePassword = async (request, response) => {
  try {
    const { currentPassword, newPassword } = request.body || {};
    const user = await changeAuthenticatedUserPassword({
      currentPassword,
      newPassword,
      userId: request.adminUser.id,
    });

    response.json({
      success: true,
      message: "Senha atualizada com sucesso.",
      user,
    });

    await logAccessEvent({
      evento: "TROCAR_SENHA",
      observacao: "Senha alterada pelo usuario autenticado.",
      user,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel atualizar a senha.",
    });
  }
};

export const createCollaborator = async (request, response) => {
  try {
    const payload = request.body || {};
    const result = await createCollaboratorUser({
      coordenacao: payload.coordenacao || payload.coordenacao_nome || payload.department,
      email: payload.email || payload.usuario,
      nome: payload.nome || payload.name,
      ramal: payload.ramal || payload.extension,
    });

    response.status(201).json({
      success: true,
      message:
        "Colaborador criado com sucesso. Senha inicial: C2026@mps. Troca obrigatoria no primeiro acesso.",
      user: result.user,
    });

    await logChangeEvent({
      acao: "CRIAR_COLABORADOR",
      modulo: "Usuarios",
      tipoRegistro: "Usuario",
      idRegistroAfetado: result.user.id,
      descricaoResumida: `Colaborador ${result.user.email} criado.`,
      dadosNovos: result.user,
      user: request.adminUser,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel criar o colaborador.",
    });
  }
};

export const listUsers = async (_request, response) => {
  try {
    const users = await listAdminUsers();
    response.json(users);
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || "Nao foi possivel listar os usuarios.",
    });
  }
};

export const resetUserPassword = async (request, response) => {
  try {
    const result = await resetUserPasswordByAdmin({
      targetUserId: request.params.id,
    });

    response.json({
      success: true,
      message:
        "Senha redefinida com sucesso para C2026@mps. Troca obrigatoria no proximo acesso.",
      user: result.user,
    });

    await logChangeEvent({
      acao: "REDEFINIR_SENHA_COLABORADOR",
      modulo: "Usuarios",
      tipoRegistro: "Usuario",
      idRegistroAfetado: result.user.id,
      descricaoResumida: `Senha do usuario ${result.user.email} redefinida pelo admin.`,
      dadosNovos: result.user,
      user: request.adminUser,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel redefinir a senha.",
    });
  }
};
