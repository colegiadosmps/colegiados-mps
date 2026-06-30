import crypto from "node:crypto";

const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_PASSWORD = "Colegiados@2026";
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

const getAdminConfig = () => ({
  user: process.env.ADMIN_USER || DEFAULT_ADMIN_USER,
  password: process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
});

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const getSigningSecret = () => {
  const config = getAdminConfig();
  return `colegiados-mps:${config.user}:${config.password}`;
};

const signPayload = (payload) =>
  crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");

export const validateAdminCredentials = ({ user, password }) => {
  const config = getAdminConfig();

  return safeEqual(user || "", config.user) && safeEqual(password || "", config.password);
};

export const createAdminToken = () => {
  const config = getAdminConfig();
  const payload = JSON.stringify({
    user: config.user,
    exp: Date.now() + TOKEN_TTL_MS,
  });

  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
};

export const verifyAdminToken = (token) => {
  if (!token || !token.includes(".")) {
    return false;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = signPayload(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    const config = getAdminConfig();

    return payload.user === config.user && Number(payload.exp) > Date.now();
  } catch (_error) {
    return false;
  }
};
