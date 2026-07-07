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
