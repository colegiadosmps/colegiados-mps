import {
  createAdminToken,
  validateAdminCredentials,
} from "../services/authService.js";

export const autenticarAdmin = (request, response) => {
  const { user, password } = request.body || {};

  if (!validateAdminCredentials({ user, password })) {
    response.status(401).json({
      authorized: false,
      message: "Usuario ou senha invalidos",
    });
    return;
  }

  response.json({
    authorized: true,
    message: "Acesso autorizado",
    token: createAdminToken(),
  });
};
