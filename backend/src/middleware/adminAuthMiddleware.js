import { getAuthenticatedSession } from "../services/authService.js";

export const requireAdminAuth = async (request, response, next) => {
  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  const session = await getAuthenticatedSession(token);

  if (!session) {
    response.status(401).json({
      authorized: false,
      message: "Acesso tecnico nao autorizado.",
    });
    return;
  }

  request.adminUser = session.user;
  next();
};

export const requireAdminProfile =
  (...profiles) =>
  (request, response, next) => {
    const currentProfile = String(request.adminUser?.perfil || "").toUpperCase();
    const allowedProfiles = profiles.map((profile) => String(profile || "").toUpperCase());

    if (!allowedProfiles.includes(currentProfile)) {
      response.status(403).json({
        authorized: false,
        message: "Voce nao tem permissao para executar esta acao.",
      });
      return;
    }

    next();
  };
