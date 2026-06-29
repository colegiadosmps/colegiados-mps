import { all, exec, run } from "../database/db.js";
import { readCsvFile } from "./csvService.js";
import { parseFileName } from "./fileNameService.js";
import {
  normalizeBooleanStatus,
  normalizeDate,
  normalizeText,
} from "../utils/formatters.js";

const registerImport = async ({
  arquivo,
  tipo,
  siglaColegiado,
  dataBase,
  quantidadeRegistros,
  status,
  observacao,
}) => {
  await run(
    `INSERT INTO importacoes (
      arquivo,
      tipo,
      sigla_colegiado,
      data_base,
      data_importacao,
      quantidade_registros,
      status,
      observacao
    ) VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?)`,
    [
      arquivo,
      tipo,
      siglaColegiado,
      dataBase,
      quantidadeRegistros,
      status,
      observacao || null,
    ],
  );
};

const ensureColegiado = async (siglaColegiado) => {
  await run(
    `INSERT INTO colegiados (sigla, nome, tipo, descricao, ativo, updated_at)
     VALUES (?, ?, ?, ?, 'Sim', datetime('now'))
     ON CONFLICT(sigla) DO UPDATE SET updated_at = datetime('now')`,
    [
      siglaColegiado,
      siglaColegiado,
      "Nao informado",
      "Colegiado criado automaticamente a partir da importacao.",
    ],
  );
};

const replaceMembers = async ({
  siglaColegiado,
  dataBase,
  arquivoOrigem,
  records,
}) => {
  await run("DELETE FROM membros WHERE sigla_colegiado = ?", [siglaColegiado]);

  for (const record of records) {
    await run(
      `INSERT INTO membros (
        nome_membro,
        sigla_colegiado,
        sigla_colegiado_pai,
        matricula,
        email_institucional,
        telefone_institucional,
        telefone_pessoal,
        tipo_vinculo,
        papel,
        detalhamento_papel,
        inicio_vigencia,
        fim_vigencia,
        ativo,
        data_base,
        arquivo_origem,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        normalizeText(record.NOME_MEMBRO) || "Nao informado",
        normalizeText(record.SIGLA_COLEGIADO) || siglaColegiado,
        normalizeText(record["SIGLA_COLEGIADO: SIGLA_COLEGIADO_PAI"]),
        normalizeText(record.MATRICULA),
        normalizeText(record.EMAIL_INSTITUCIONAL),
        normalizeText(record.TELEFONE_INSTITUCIONAL),
        normalizeText(record.TELEFONE_PESSOAL),
        normalizeText(record.TIPO_VINCULO),
        normalizeText(record.PAPEL),
        normalizeText(record.DETALHAMENTO_PAPEL),
        normalizeDate(record.INICIO_VIGENCIA),
        normalizeDate(record.FIM_VIGENCIA),
        normalizeBooleanStatus(record.ATIVO),
        dataBase,
        arquivoOrigem,
      ],
    );
  }
};

const replaceMeetings = async ({
  siglaColegiado,
  dataBase,
  arquivoOrigem,
  records,
}) => {
  await run("DELETE FROM reunioes WHERE sigla_colegiado = ?", [siglaColegiado]);

  for (const record of records) {
    await run(
      `INSERT INTO reunioes (
        id_reuniao,
        id_colegiado,
        sigla_colegiado,
        id_unidade,
        data_reuniao,
        hora,
        local,
        classificacao_pauta,
        descricao_pauta,
        texto_ata,
        status_reuniao,
        quorum_registrado,
        data_base,
        arquivo_origem,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        normalizeText(record.ID_REUNIAO),
        normalizeText(record.ID_COLEGIADO),
        normalizeText(record.SIGLA_COLEGIADO) || siglaColegiado,
        normalizeText(record.ID_UNIDADE),
        normalizeDate(record.DATA_REUNIAO),
        normalizeText(record.HORA),
        normalizeText(record.LOCAL),
        normalizeText(record.CLASSIFICACAO_PAUTA),
        normalizeText(record.DESCRICAO_PAUTA),
        normalizeText(record.TEXTO_ATA),
        normalizeText(record.STATUS_REUNIAO),
        normalizeText(record.QUORUM_REGISTRADO),
        dataBase,
        arquivoOrigem,
      ],
    );
  }
};

export const importCsvFile = async (filePath, originalName) => {
  const fileInfo = parseFileName(originalName);
  const { records } = readCsvFile(filePath);

  await ensureColegiado(fileInfo.siglaColegiado);

  await exec("BEGIN TRANSACTION");

  try {
    if (fileInfo.tipo === "Membros") {
      await replaceMembers({
        siglaColegiado: fileInfo.siglaColegiado,
        dataBase: fileInfo.dataBase,
        arquivoOrigem: originalName,
        records,
      });
    }

    if (fileInfo.tipo === "Reunioes") {
      await replaceMeetings({
        siglaColegiado: fileInfo.siglaColegiado,
        dataBase: fileInfo.dataBase,
        arquivoOrigem: originalName,
        records,
      });
    }

    const status =
      fileInfo.tipo === "Reunioes" && records.length === 0
        ? "Arquivo lido sem registros"
        : "Importado com sucesso";

    await registerImport({
      arquivo: originalName,
      tipo: fileInfo.tipo,
      siglaColegiado: fileInfo.siglaColegiado,
      dataBase: fileInfo.dataBase,
      quantidadeRegistros: records.length,
      status,
      observacao:
        records.length === 0
          ? "Arquivo lido com cabecalho, mas sem registros de dados."
          : null,
    });

    await exec("COMMIT");

    return {
      message: "Arquivo importado com sucesso",
      arquivo: originalName,
      tipo: fileInfo.tipo,
      sigla_colegiado: fileInfo.siglaColegiado,
      data_base: fileInfo.dataBase,
      quantidade_registros: records.length,
      status,
    };
  } catch (error) {
    await exec("ROLLBACK");

    await registerImport({
      arquivo: originalName,
      tipo: fileInfo.tipo,
      siglaColegiado: fileInfo.siglaColegiado,
      dataBase: fileInfo.dataBase,
      quantidadeRegistros: 0,
      status: "Erro na importacao",
      observacao: error.message,
    });

    throw error;
  }
};

export const listImportacoes = () =>
  all(
    `SELECT *
     FROM importacoes
     ORDER BY datetime(data_importacao) DESC, id DESC`,
  );
