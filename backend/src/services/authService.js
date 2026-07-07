import crypto from "node:crypto";
import { promisify } from "node:util";
import { get, run } from "../database/db.js";

const DEFAULT_ADMIN_NAME = "Andre Ximenes";
const DEFAULT_ADMIN_EMAIL = "andre.ximenes@previdencia.gov.br";
const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_PASSWORD = "Colegiados@2026";
const SESSION_TTL_HOURS = 8;
const SCRYPT_KEY_LENGTH = 64;
const scrypt = promisify(crypto.scrypt);

const normalizeValue = (value) => String(value || "").trim();
const normalizeComparableValue = (value) => normalizeValue(value).toLowerCase();

const toIsoDate = (date) => date.toISOString();

const addHours = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setHours(nextDate.getHours() + amount);
  return nextDate;
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const buildPublicUser = (row) => {
  if (!row) {
    return null;
  }

  const firstName = normalizeValue(row.nome).split(/\s+/).filter(Boolean)[0] || row.usuario;

  return {
    id: row.id,
    nome: row.nome,
    primeiroNome: firstName,
    email: row.email,
    usuario: row.usuario,
    coordenacao: row.coordenacao,
    ramal: row.ramal,
    perfil: row.perfil,
    status: row.status,
    senhaTemporaria: Boolean(row.senha_temporaria),
    ultimoLoginEm: row.ultimo_login_em,
  };
};

const getSeedAdminConfig = () => ({
  nome: process.env.ADMIN_NAME || DEFAULT_ADMIN_NAME,
  email: process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL,
  usuario: process.env.ADMIN_USER || DEFAULT_ADMIN_USER,
  senha: process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
  coordenacao:
    process.env.ADMIN_COORDENACAO || "Coordenacao de atendimento colaborativo - CACO",
  ramal: process.env.ADMIN_RAMAL || "5555",
  perfil: process.env.ADMIN_PROFILE || "ADMIN",
  status: "Ativo",
});

const findUserByLogin = async (login) =>
  get(
    `
      SELECT *
      FROM usuarios_admin
      WHERE lower(usuario) = lower(?)
         OR lower(email) = lower(?)
      LIMIT 1
    `,
    [login, login],
  );

const findUserById = async (id) =>
  get(
    `
      SELECT *
      FROM usuarios_admin
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

export const hashPassword = async (password) =>
  new Promise((resolve, reject) => {
    const normalizedPassword = normalizeValue(password);
    const salt = crypto.randomBytes(16).toString("hex");

    scrypt(normalizedPassword, salt, SCRYPT_KEY_LENGTH)
      .then((derivedKey) => {
        resolve(`scrypt:${salt}:${Buffer.from(derivedKey).toString("hex")}`);
      })
      .catch(reject);
  });

const verifyPassword = async (password, storedHash) => {
  const normalizedPassword = normalizeValue(password);
  const normalizedHash = normalizeValue(storedHash);

  if (!normalizedPassword || !normalizedHash) {
    return false;
  }

  const [algorithm, salt, expectedHash] = normalizedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const derivedKey = await scrypt(normalizedPassword, salt, SCRYPT_KEY_LENGTH);
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const derivedBuffer = Buffer.from(derivedKey);

  if (expectedBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, derivedBuffer);
};

export const ensureDefaultAdminUser = async () => {
  const config = getSeedAdminConfig();
  const existingUser = await findUserByLogin(config.usuario);

  if (!existingUser) {
    await run(
      `
        INSERT INTO usuarios_admin (
          nome,
          email,
          usuario,
          coordenacao,
          ramal,
          perfil,
          status,
          senha_hash,
          senha_temporaria,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [
        config.nome,
        config.email,
        config.usuario,
        config.coordenacao,
        config.ramal,
        config.perfil,
        config.status,
        await hashPassword(config.senha),
      ],
    );

    return;
  }

  if (!normalizeValue(existingUser.senha_hash)) {
    await run(
      `
        UPDATE usuarios_admin
        SET senha_hash = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [await hashPassword(config.senha), existingUser.id],
    );
    return;
  }

  const isSeedAdmin =
    normalizeComparableValue(existingUser.email) === normalizeComparableValue(config.email) &&
    normalizeComparableValue(existingUser.usuario) === normalizeComparableValue(config.usuario) &&
    normalizeComparableValue(existingUser.perfil) === normalizeComparableValue(config.perfil);

  if (
    isSeedAdmin &&
    Number(existingUser.senha_temporaria) === 1 &&
    !normalizeValue(existingUser.ultimo_login_em)
  ) {
    await run(
      `
        UPDATE usuarios_admin
        SET senha_hash = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [await hashPassword(config.senha), existingUser.id],
    );
  }
};

const createSession = async (userRow) => {
  const now = new Date();
  const token = crypto.randomBytes(48).toString("base64url");
  const sessionId = crypto.randomUUID();
  const expiresAt = addHours(now, SESSION_TTL_HOURS);

  await run(
    `
      INSERT INTO auth_sessions (
        id,
        usuario_id,
        token_hash,
        expira_em,
        created_at,
        ultimo_uso_em
      )
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    [sessionId, userRow.id, hashToken(token), toIsoDate(expiresAt)],
  );

  await run(
    `
      UPDATE usuarios_admin
      SET ultimo_login_em = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [toIsoDate(now), userRow.id],
  );

  return {
    token,
    user: buildPublicUser({
      ...userRow,
      ultimo_login_em: toIsoDate(now),
    }),
  };
};

export const authenticateAdminUser = async ({ login, password }) => {
  await ensureDefaultAdminUser();

  const comparableLogin = normalizeComparableValue(login);
  const comparablePassword = normalizeValue(password);

  if (!comparableLogin || !comparablePassword) {
    return null;
  }

  const user = await findUserByLogin(comparableLogin);

  if (!user || normalizeComparableValue(user.status) !== "ativo") {
    return null;
  }

  const passwordMatches = await verifyPassword(comparablePassword, user.senha_hash);

  if (!passwordMatches) {
    return null;
  }

  return createSession(user);
};

export const getAuthenticatedSession = async (token) => {
  const normalizedToken = normalizeValue(token);

  if (!normalizedToken) {
    return null;
  }

  const session = await get(
    `
      SELECT
        s.id,
        s.usuario_id,
        s.expira_em,
        s.revogada_em,
        u.nome,
        u.email,
        u.usuario,
        u.coordenacao,
        u.ramal,
        u.perfil,
        u.status,
        u.senha_temporaria,
        u.ultimo_login_em
      FROM auth_sessions s
      INNER JOIN usuarios_admin u
        ON u.id = s.usuario_id
      WHERE s.token_hash = ?
      LIMIT 1
    `,
    [hashToken(normalizedToken)],
  );

  if (!session || session.revogada_em) {
    return null;
  }

  if (normalizeComparableValue(session.status) !== "ativo") {
    return null;
  }

  if (new Date(session.expira_em).getTime() <= Date.now()) {
    await run(
      `
        UPDATE auth_sessions
        SET revogada_em = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [session.id],
    );
    return null;
  }

  await run(
    `
      UPDATE auth_sessions
      SET ultimo_uso_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [session.id],
  );

  const user = await findUserById(session.usuario_id);

  return {
    id: session.id,
    user: buildPublicUser(user),
  };
};

export const revokeSession = async (token) => {
  const normalizedToken = normalizeValue(token);

  if (!normalizedToken) {
    return;
  }

  await run(
    `
      UPDATE auth_sessions
      SET revogada_em = CURRENT_TIMESTAMP
      WHERE token_hash = ?
        AND revogada_em IS NULL
    `,
    [hashToken(normalizedToken)],
  );
};
