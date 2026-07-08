import {
  authenticateAdminUser,
  changeAuthenticatedUserPassword,
  createCollaboratorUser,
  getAuthenticatedSession,
  revokeSession,
} from "../services/authService.js";

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
      response.status(401).json({
        authorized: false,
        authenticated: false,
        message: "Usuario ou senha invalidos",
      });
      return;
    }

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
    const token = extractToken(request);
    const session = await getAuthenticatedSession(token);

    if (!session) {
      response.status(401).json({
        authenticated: false,
        message: "Sessao nao autenticada.",
      });
      return;
    }

    response.json({
      authenticated: true,
      user: session.user,
    });
  } catch (error) {
    response.status(500).json({
      authenticated: false,
      message: error.message || "Nao foi possivel consultar a sessao.",
    });
  }
};

export const forgotPassword = async (_request, response) => {
  response.json({
    success: true,
    message:
      "Solicitacao registrada. Nesta fase inicial, a redefinicao de senha deve ser feita pelo administrador.",
  });
};

export const changePassword = async (request, response) => {
  try {
    const token = extractToken(request);
    const session = await getAuthenticatedSession(token);

    if (!session) {
      response.status(401).json({
        success: false,
        message: "Sessao nao autenticada.",
      });
      return;
    }

    const { currentPassword, newPassword } = request.body || {};
    const user = await changeAuthenticatedUserPassword({
      currentPassword,
      newPassword,
      userId: session.user.id,
    });

    response.json({
      success: true,
      message: "Senha atualizada com sucesso.",
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
    const { coordenacao, email, nome, ramal } = request.body || {};
    const result = await createCollaboratorUser({
      coordenacao,
      email,
      nome,
      ramal,
    });

    response.status(201).json({
      success: true,
      message:
        "Colaborador criado com sucesso. Senha inicial: C2026@mps. Troca obrigatoria no primeiro acesso.",
      user: result.user,
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error.message || "Nao foi possivel criar o colaborador.",
    });
  }
};
