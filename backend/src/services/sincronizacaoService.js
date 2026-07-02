import { all, get, run } from "../database/db.js";
import { syncGoogleDrive } from "./googleDriveService.js";

const buildStatus = (summary) => {
  if (summary.errors.length > 0) {
    return "Concluida com ressalvas";
  }

  if (summary.warnings.length > 0) {
    return "Concluida com alertas";
  }

  if (summary.folders_scanned === 0) {
    return "Sem pastas encontradas";
  }

  if (summary.imported_files.length === 0 && summary.publication_folders.length === 0) {
    return "Sem atualizacoes";
  }

  return "Concluida com sucesso";
};

const buildObservacao = (summary) => {
  const parts = [];

  if (summary.skipped_files.length > 0) {
    parts.push(`${summary.skipped_files.length} arquivo(s) ignorado(s) por padrao invalido.`);
  }

  if (summary.folders_scanned === 0) {
    parts.push(
      "A pasta raiz foi acessada, mas nenhuma subpasta de colegiado foi localizada. Verifique o ID configurado e o compartilhamento com a conta de servico.",
    );
  }

  if (summary.errors.length > 0) {
    parts.push(`${summary.errors.length} erro(s) durante a sincronizacao.`);
  }

  if (summary.warnings.length > 0) {
    parts.push(`${summary.warnings.length} alerta(s) identificado(s) na leitura.`);
  }

  return parts.join(" ") || null;
};

export const executarSincronizacao = async () => {
  const summary = await syncGoogleDrive();
  const status = buildStatus(summary);
  const observacao = buildObservacao(summary);
  const totalRegistrosMembros = summary.imported_files
    .filter((item) => item.tipo === "Membros")
    .reduce((total, item) => total + item.quantidade_registros, 0);
  const totalRegistrosReunioes = summary.imported_files
    .filter((item) => item.tipo === "Reunioes")
    .reduce((total, item) => total + item.quantidade_registros, 0);

  const sincronizacao = await run(
    `INSERT INTO sincronizacoes (
      data_sincronizacao,
      total_pastas_encontradas,
      total_arquivos_encontrados,
      total_arquivos_processados,
      total_registros_membros,
      total_registros_reunioes,
      total_pastas_publicacoes,
      status,
      observacao
    ) VALUES (datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      summary.folders_scanned,
      summary.files_found,
      summary.imported_files.length + summary.skipped_files.length + summary.errors.length,
      totalRegistrosMembros,
      totalRegistrosReunioes,
      summary.publication_folders.length,
      status,
      observacao,
    ],
  );

  for (const item of summary.imported_files) {
    await run(
      `INSERT INTO sincronizacao_arquivos (
        sincronizacao_id,
        arquivo,
        drive_file_id,
        tipo,
        sigla_colegiado,
        data_base,
        quantidade_registros,
        status,
        observacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sincronizacao.lastID,
        item.arquivo,
        item.drive_file_id || null,
        item.tipo,
        item.sigla_colegiado,
        item.data_base,
        item.quantidade_registros,
        item.status,
        null,
      ],
    );
  }

  for (const item of summary.skipped_files) {
    await run(
      `INSERT INTO sincronizacao_arquivos (
        sincronizacao_id,
        arquivo,
        drive_file_id,
        tipo,
        sigla_colegiado,
        data_base,
        quantidade_registros,
        status,
        observacao
      ) VALUES (?, ?, ?, 'Ignorado', ?, NULL, 0, 'Ignorado', ?)`,
      [sincronizacao.lastID, item.file, null, item.file.split("_")[0] || "N/A", item.reason],
    );
  }

  for (const item of summary.errors) {
    await run(
      `INSERT INTO sincronizacao_arquivos (
        sincronizacao_id,
        arquivo,
        drive_file_id,
        tipo,
        sigla_colegiado,
        data_base,
        quantidade_registros,
        status,
        observacao
      ) VALUES (?, ?, ?, 'Erro', ?, NULL, 0, 'Erro', ?)`,
      [
        sincronizacao.lastID,
        item.file || item.folder || "Desconhecido",
        item.drive_file_id || null,
        (item.file || item.folder || "N/A").split("_")[0] || "N/A",
        item.message,
      ],
    );
  }

  for (const item of summary.warnings) {
    await run(
      `INSERT INTO sincronizacao_arquivos (
        sincronizacao_id,
        arquivo,
        drive_file_id,
        tipo,
        sigla_colegiado,
        data_base,
        quantidade_registros,
        status,
        observacao
      ) VALUES (?, ?, NULL, 'Alerta', 'BASE', NULL, 0, 'Alerta', ?)`,
      [sincronizacao.lastID, item.file || "Alerta", item.reason],
    );
  }

  const resumo = await get(
    "SELECT * FROM sincronizacoes WHERE id = ?",
    [sincronizacao.lastID],
  );

  return {
    ...summary,
    sincronizacao: resumo,
  };
};

export const listarSincronizacoes = () =>
  all(
    `SELECT *
     FROM sincronizacoes
     ORDER BY datetime(data_sincronizacao) DESC, id DESC`,
  );

export const obterSincronizacaoPorId = async (id) => {
  const sincronizacao = await get(
    "SELECT * FROM sincronizacoes WHERE id = ?",
    [id],
  );

  if (!sincronizacao) {
    return null;
  }

  const arquivos = await all(
    `SELECT *
     FROM sincronizacao_arquivos
     WHERE sincronizacao_id = ?
     ORDER BY id`,
    [id],
  );

  return {
    ...sincronizacao,
    arquivos,
  };
};
