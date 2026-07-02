import { all, exec, run } from "../database/db.js";
import { parseCsvContent, readCsvFile } from "./csvService.js";
import { parseFileName } from "./fileNameService.js";
import {
  normalizeBooleanStatus,
  normalizeDate,
  normalizeKey,
  normalizeText,
} from "../utils/formatters.js";

const normalizeRecord = (record) =>
  Object.fromEntries(
    Object.entries(record).map(([key, value]) => [normalizeKey(key), value]),
  );

const getFieldValue = (record, aliases) => {
  const normalized = normalizeRecord(record);

  for (const alias of aliases) {
    const value = normalizeText(normalized[alias]);
    if (value) {
      return value;
    }
  }

  return null;
};

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
    `INSERT INTO colegiados (
      sigla,
      sigla_exibicao,
      chave_pasta,
      nome,
      categoria,
      tipo,
      descricao,
      ativo,
      updated_at
    ) VALUES (?, ?, ?, ?, 'Interno', ?, ?, 'Sim', datetime('now'))
     ON CONFLICT(sigla) DO UPDATE SET
       chave_pasta = excluded.chave_pasta,
       updated_at = datetime('now')`,
    [
      siglaColegiado,
      siglaColegiado,
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
        normalizeKey(normalizeText(record.SIGLA_COLEGIADO) || siglaColegiado),
        normalizeKey(normalizeText(record["SIGLA_COLEGIADO: SIGLA_COLEGIADO_PAI"])),
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
        normalizeKey(normalizeText(record.SIGLA_COLEGIADO) || siglaColegiado),
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

const replaceInternalColegiados = async ({ arquivoOrigem, records }) => {
  await run("DELETE FROM colegiados WHERE categoria = 'Interno'");

  for (const record of records) {
    const sigla =
      getFieldValue(record, ["SIGLA", "SIGLA_COLEGIADO", "SIGLA_DO_COLEGIADO"]) ||
      "NAO_INFORMADO";
    const nome =
      getFieldValue(record, ["COLEGIADO", "NOME", "NOME_COLEGIADO"]) || sigla;
    const siglaExibicao = normalizeText(sigla) || "Nao informado";
    const chavePasta = normalizeKey(siglaExibicao);

    await run(
      `INSERT INTO colegiados (
        sigla,
        sigla_exibicao,
        chave_pasta,
        nome,
        categoria,
        tipo,
        descricao,
        competencia,
        sigla_colegiado_pai,
        unidade,
        sigla_unidade_pai,
        ato_criacao,
        data_instituicao,
        data_termino,
        qtd_min_reunioes_anuais,
        regra_quorum,
        observacoes,
        ativo,
        updated_at
      ) VALUES (?, ?, ?, ?, 'Interno', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        normalizeKey(siglaExibicao),
        siglaExibicao,
        chavePasta,
        nome,
        getFieldValue(record, ["TIPO", "TIPO_COLEGIADO", "TIPO_DE_COLEGIADO"]) || "Nao informado",
        getFieldValue(record, ["DESCRICAO", "FINALIDADE"]) || null,
        getFieldValue(record, ["COMPETENCIAS", "COMPETENCIA"]) || null,
        getFieldValue(record, ["SIGLA_COLEGIADO_PAI", "COLEGIADO_PAI"]) || null,
        getFieldValue(record, ["UNIDADE"]) || null,
        getFieldValue(record, ["SIGLA_UNIDADE_PAI"]) || null,
        getFieldValue(record, ["ATO_DE_CRIACAO", "ATO_CRIACAO"]) || null,
        normalizeDate(getFieldValue(record, ["DATA_DE_INSTITUICAO", "DATA_INSTITUICAO"])),
        normalizeDate(getFieldValue(record, ["DATA_DE_TERMINO", "DATA_TERMINO"])),
        getFieldValue(record, ["QUANTIDADE_MINIMA_DE_REUNIOES_ANUAIS", "QTD_MINIMA_REUNIOES_ANUAIS"]) || null,
        getFieldValue(record, ["REGRA_DE_QUORUM", "REGRA_QUORUM"]) || null,
        getFieldValue(record, ["OBSERVACOES", "OBSERVACAO"]) || null,
        normalizeBooleanStatus(getFieldValue(record, ["STATUS", "ATIVO"])),
      ],
    );
  }

  await registerImport({
    arquivo: arquivoOrigem,
    tipo: "Colegiados",
    siglaColegiado: "BASE",
    dataBase: null,
    quantidadeRegistros: records.length,
    status: "Importado com sucesso",
    observacao: "Colegiados internos carregados com sucesso.",
  });

  return {
    arquivo: arquivoOrigem,
    tipo: "Colegiados",
    sigla_colegiado: "BASE",
    data_base: null,
    quantidade_registros: records.length,
    status: "Importado com sucesso",
  };
};

const replaceExternalColegiados = async ({ arquivoOrigem, records }) => {
  await run("DELETE FROM colegiados WHERE categoria = 'Externo'");

  const usedSiglas = new Set();

  for (const record of records) {
    const nome =
      getFieldValue(record, ["COLEGIADO", "NOME", "NOME_COLEGIADO"]) || "Nao informado";
    const orgao = getFieldValue(record, ["ORGAO"]) || "Nao informado";
    const baseSigla = normalizeKey(
      getFieldValue(record, ["SIGLA"]) || `EXT_${nome}_${orgao}`,
    );

    let sigla = baseSigla || "EXT_NAO_INFORMADO";
    let counter = 2;
    while (usedSiglas.has(sigla)) {
      sigla = `${baseSigla}_${counter}`;
      counter += 1;
    }
    usedSiglas.add(sigla);

    await run(
      `INSERT INTO colegiados (
        sigla,
        sigla_exibicao,
        chave_pasta,
        nome,
        categoria,
        tipo,
        descricao,
        orgao,
        dispositivo_legal,
        ativo,
        updated_at
      ) VALUES (?, ?, ?, ?, 'Externo', 'Externo', ?, ?, ?, 'Sim', datetime('now'))`,
      [
        sigla,
        getFieldValue(record, ["SIGLA"]) || nome,
        normalizeKey(getFieldValue(record, ["SIGLA"]) || nome),
        nome,
        getFieldValue(record, [
          "NATUREZA_COMPETENCIA_OU_FINALIDADE",
          "NATUREZA_COMPETENCIA_FINALIDADE",
          "NATUREZA_FINALIDADE",
        ]) || null,
        orgao,
        getFieldValue(record, ["DISPOSITIVO_LEGAL"]) || null,
      ],
    );
  }

  await registerImport({
    arquivo: arquivoOrigem,
    tipo: "Colegiados_Externos",
    siglaColegiado: "BASE",
    dataBase: null,
    quantidadeRegistros: records.length,
    status: "Importado com sucesso",
    observacao: "Colegiados externos carregados com sucesso.",
  });

  return {
    arquivo: arquivoOrigem,
    tipo: "Colegiados_Externos",
    sigla_colegiado: "BASE",
    data_base: null,
    quantidade_registros: records.length,
    status: "Importado com sucesso",
  };
};

const importParsedCsv = async ({ originalName, records, fileInfo }) => {
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

export const importCsvFile = async (filePath, originalName) => {
  const fileInfo = parseFileName(originalName);
  const { records } = readCsvFile(filePath);

  return importParsedCsv({
    originalName,
    records,
    fileInfo,
  });
};

export const importRootCsvContent = async (content, originalName) => {
  const { records } = parseCsvContent(content);

  await exec("BEGIN TRANSACTION");

  try {
    let result = null;

    if (/^colegiados(?:\.csv)?$/i.test(originalName)) {
      result = await replaceInternalColegiados({
        arquivoOrigem: originalName,
        records,
      });
    } else if (/^colegiados_externos(?:\.csv)?$/i.test(originalName)) {
      result = await replaceExternalColegiados({
        arquivoOrigem: originalName,
        records,
      });
    } else {
      throw new Error("Arquivo raiz nao suportado para importacao automatica.");
    }

    await exec("COMMIT");
    return {
      message: "Arquivo importado com sucesso",
      ...result,
    };
  } catch (error) {
    await exec("ROLLBACK");
    throw error;
  }
};

export const importCsvContent = async (content, originalName) => {
  const fileInfo = parseFileName(originalName);
  const { records } = parseCsvContent(content);

  return importParsedCsv({
    originalName,
    records,
    fileInfo,
  });
};

export const listImportacoes = () =>
  all(
    `SELECT *
     FROM importacoes
     ORDER BY datetime(data_importacao) DESC, id DESC`,
  );
