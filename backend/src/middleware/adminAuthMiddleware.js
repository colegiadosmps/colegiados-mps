import { verifyAdminToken } from "../services/authService.js";

export const requireAdminAuth = (request, response, next) => {
  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!verifyAdminToken(token)) {
    response.status(401).json({
      authorized: false,
      message: "Acesso tecnico nao autorizado.",
    });
    return;
  }

  next();
};
