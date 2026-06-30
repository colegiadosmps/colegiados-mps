import { all, get } from "../database/db.js";

export const getDashboardResumo = async () => {
  const [
    totalColegiados,
    totalInternos,
    totalExternos,
    totalMembros,
    totalMembrosAtivos,
    totalReunioes,
    totalPastasPublicacoes,
    ultimaSincronizacao,
    colegiadosComResumo,
  ] = await Promise.all([
    get("SELECT COUNT(*) AS total FROM colegiados"),
    get("SELECT COUNT(*) AS total FROM colegiados WHERE tipo = 'Interno'"),
    get("SELECT COUNT(*) AS total FROM colegiados WHERE tipo = 'Externo'"),
    get("SELECT COUNT(*) AS total FROM membros"),
    get("SELECT COUNT(*) AS total FROM membros WHERE ativo = 'Sim'"),
    get("SELECT COUNT(*) AS total FROM reunioes"),
    get("SELECT COUNT(*) AS total FROM pastas_publicacoes"),
    get(
      `SELECT *
       FROM sincronizacoes
       ORDER BY datetime(data_sincronizacao) DESC, id DESC
       LIMIT 1`,
    ),
    all(
      `SELECT
        c.sigla,
        c.nome,
        c.tipo,
        c.competencia,
        c.ativo,
        COALESCE(m.total_membros, 0) AS total_membros,
        COALESCE(r.total_reunioes, 0) AS total_reunioes,
        COALESCE(mu.data_base, ru.data_base, p.data_base) AS ultima_atualizacao
      FROM colegiados c
      LEFT JOIN (
        SELECT sigla_colegiado, COUNT(*) AS total_membros, MAX(data_base) AS data_base
        FROM membros
        GROUP BY sigla_colegiado
      ) mu ON mu.sigla_colegiado = c.sigla
      LEFT JOIN (
        SELECT sigla_colegiado, COUNT(*) AS total_reunioes, MAX(data_base) AS data_base
        FROM reunioes
        GROUP BY sigla_colegiado
      ) ru ON ru.sigla_colegiado = c.sigla
      LEFT JOIN (
        SELECT sigla_colegiado, MAX(data_base) AS data_base
        FROM pastas_publicacoes
        GROUP BY sigla_colegiado
      ) p ON p.sigla_colegiado = c.sigla
      LEFT JOIN (
        SELECT sigla_colegiado, COUNT(*) AS total_membros
        FROM membros
        GROUP BY sigla_colegiado
      ) m ON m.sigla_colegiado = c.sigla
      LEFT JOIN (
        SELECT sigla_colegiado, COUNT(*) AS total_reunioes
        FROM reunioes
        GROUP BY sigla_colegiado
      ) r ON r.sigla_colegiado = c.sigla
      ORDER BY c.sigla`,
    ),
  ]);

  return {
    total_colegiados: totalColegiados.total,
    total_colegiados_internos: totalInternos.total,
    total_colegiados_externos: totalExternos.total,
    total_membros: totalMembros.total,
    total_membros_ativos: totalMembrosAtivos.total,
    total_reunioes: totalReunioes.total,
    total_pastas_publicacoes: totalPastasPublicacoes.total,
    ultima_sincronizacao: ultimaSincronizacao,
    colegiados_com_resumo: colegiadosComResumo,
  };
};

export const getDashboardGraficos = async () => {
  const [
    membrosPorColegiado,
    membrosAtivosInativos,
    membrosPorTipoVinculo,
    membrosPorPapel,
    reunioesPorColegiado,
    reunioesPorStatus,
    reunioesPorMes,
    colegiadosPorTipo,
  ] = await Promise.all([
    all(
      `SELECT sigla_colegiado AS label, COUNT(*) AS value
       FROM membros
       GROUP BY sigla_colegiado
       ORDER BY value DESC, label`,
    ),
    all(
      `SELECT COALESCE(ativo, 'Nao informado') AS label, COUNT(*) AS value
       FROM membros
       GROUP BY ativo
       ORDER BY value DESC, label`,
    ),
    all(
      `SELECT COALESCE(tipo_vinculo, 'Nao informado') AS label, COUNT(*) AS value
       FROM membros
       GROUP BY tipo_vinculo
       ORDER BY value DESC, label`,
    ),
    all(
      `SELECT COALESCE(papel, 'Nao informado') AS label, COUNT(*) AS value
       FROM membros
       GROUP BY papel
       ORDER BY value DESC, label`,
    ),
    all(
      `SELECT sigla_colegiado AS label, COUNT(*) AS value
       FROM reunioes
       GROUP BY sigla_colegiado
       ORDER BY value DESC, label`,
    ),
    all(
      `SELECT COALESCE(status_reuniao, 'Nao informado') AS label, COUNT(*) AS value
       FROM reunioes
       GROUP BY status_reuniao
       ORDER BY value DESC, label`,
    ),
    all(
      `SELECT
        SUBSTR(COALESCE(data_reuniao, ''), 1, 7) AS label,
        COUNT(*) AS value
       FROM reunioes
       WHERE data_reuniao IS NOT NULL AND data_reuniao <> ''
       GROUP BY SUBSTR(data_reuniao, 1, 7)
       ORDER BY label`,
    ),
    all(
      `SELECT COALESCE(tipo, 'Nao informado') AS label, COUNT(*) AS value
       FROM colegiados
       GROUP BY tipo
       ORDER BY value DESC, label`,
    ),
  ]);

  return {
    membros_por_colegiado: membrosPorColegiado,
    membros_ativos_inativos: membrosAtivosInativos,
    membros_por_tipo_vinculo: membrosPorTipoVinculo,
    membros_por_papel: membrosPorPapel,
    reunioes_por_colegiado: reunioesPorColegiado,
    reunioes_por_status: reunioesPorStatus,
    reunioes_por_mes: reunioesPorMes,
    colegiados_por_tipo: colegiadosPorTipo,
  };
};
