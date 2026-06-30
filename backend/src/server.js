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
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const schemaPath = path.resolve(process.cwd(), "src/database/schema.sql");

const allowedOrigins = ["http://localhost:5173", frontendUrl];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origem nao permitida pelo CORS."));
    },
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
  await ensureColumn("colegiados", "competencia", "TEXT");
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
