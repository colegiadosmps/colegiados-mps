import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { all, exec, getDatabasePath, run } from "./database/db.js";
import colegiadosRoutes from "./routes/colegiadosRoutes.js";
import membrosRoutes from "./routes/membrosRoutes.js";
import reunioesRoutes from "./routes/reunioesRoutes.js";
import publicacoesRoutes from "./routes/publicacoesRoutes.js";
import importacoesRoutes from "./routes/importacoesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import sincronizacoesRoutes from "./routes/sincronizacoesRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3333;
const schemaPath = path.resolve(process.cwd(), "src/database/schema.sql");
const normalizeOrigin = (value) => value.replace(/\/+$/, "");
const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URLS,
  "http://localhost:5173",
]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((value) => value.trim())
  .filter(Boolean)
  .map(normalizeOrigin);

const allowedOrigins = new Set(configuredOrigins);
const isNetlifyOrigin = (origin) =>
  /^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin);

app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = origin ? normalizeOrigin(origin) : origin;

      if (
        !normalizedOrigin ||
        allowedOrigins.has(normalizedOrigin) ||
        isNetlifyOrigin(normalizedOrigin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("Origem nao permitida pelo CORS."));
    },
    optionsSuccessStatus: 204,
  }),
);

app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    database_path: getDatabasePath(),
  });
});

const ensureColumn = async (tableName, columnName, definition) => {
  const columns = await all(`PRAGMA table_info(${tableName})`);

  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
};

const ensureSchemaCompatibility = async () => {
  await ensureColumn("colegiados", "categoria", "TEXT");
  await ensureColumn("colegiados", "competencia", "TEXT");
  await ensureColumn("colegiados", "sigla_colegiado_pai", "TEXT");
  await ensureColumn("colegiados", "unidade", "TEXT");
  await ensureColumn("colegiados", "sigla_unidade_pai", "TEXT");
  await ensureColumn("colegiados", "ato_criacao", "TEXT");
  await ensureColumn("colegiados", "data_instituicao", "TEXT");
  await ensureColumn("colegiados", "data_termino", "TEXT");
  await ensureColumn("colegiados", "qtd_min_reunioes_anuais", "TEXT");
  await ensureColumn("colegiados", "regra_quorum", "TEXT");
  await ensureColumn("colegiados", "observacoes", "TEXT");
  await ensureColumn("colegiados", "orgao", "TEXT");
  await ensureColumn("colegiados", "dispositivo_legal", "TEXT");
  await ensureColumn("pastas_publicacoes", "drive_folder_id", "TEXT");
};

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/colegiados", colegiadosRoutes);
app.use("/api/membros", membrosRoutes);
app.use("/api/reunioes", reunioesRoutes);
app.use("/api/publicacoes", publicacoesRoutes);
app.use("/api/importacoes", importacoesRoutes);
app.use("/api/sincronizacoes", sincronizacoesRoutes);

const initializeDatabase = async () => {
  const schema = fs.readFileSync(schemaPath, "utf8");
  await exec(schema);
  await ensureSchemaCompatibility();
};

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao inicializar o banco:", error);
    process.exit(1);
  });
