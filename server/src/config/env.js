import dotenv from "dotenv";

dotenv.config();

const defaultJwtSecret = "development-secret-change-me";
const defaultRefreshSecret = "development-refresh-secret-change-me";
const isProduction = process.env.NODE_ENV === "production";

const parseNumber = (name, value, fallback) => {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${name} must be a positive number`);
  return parsed;
};

const parseOrigins = (value) =>
  (value || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const requireProductionSecret = (name, value, fallback) => {
  if (isProduction && (!value || value === fallback || value.startsWith("change-me"))) {
    throw new Error(`${name} must be set to a strong unique value in production`);
  }
  return value || fallback;
};

if (isProduction && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in production");
}

if (isProduction && !process.env.CLIENT_ORIGIN) {
  throw new Error("CLIENT_ORIGIN must be set in production");
}

export const env = {
  isProduction,
  port: parseNumber("PORT", process.env.PORT, 5000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: requireProductionSecret("JWT_SECRET", process.env.JWT_SECRET, defaultJwtSecret),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshSecret: requireProductionSecret("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET, defaultRefreshSecret),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN),
  rateLimitWindowMs: parseNumber("RATE_LIMIT_WINDOW_MS", process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: parseNumber("RATE_LIMIT_MAX", process.env.RATE_LIMIT_MAX, 300)
};
