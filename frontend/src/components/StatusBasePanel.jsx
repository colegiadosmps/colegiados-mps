import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { formatDateTime } from "../services/formatters";

const buildAlerts = ({ colegiados, membros, reunioes }) => {
  const alerts = [];

  const semSigla = colegiados.filter((item) => !item.sigla?.trim()).length;
  if (semSigla > 0) {
    alerts.push(`Existem ${semSigla} registros sem sigla informada.`);
  }

  const integrantesSemColegiado = membros.filter(
    (item) => !item.sigla_colegiado?.trim(),
  ).length;
  if (integrantesSemColegiado > 0) {
    alerts.push(
      `Existem ${integrantesSemColegiado} integrantes sem colegiado vinculado.`,
    );
  }

  const reunioesSemColegiado = reunioes.filter(
    (item) => !item.sigla_colegiado?.trim(),
  ).length;
  if (reunioesSemColegiado > 0) {
    alerts.push(`Existem ${reunioesSemColegiado} reunioes sem sigla de colegiado.`);
  }

  return alerts;
};

const StatusBasePanel = ({ onClose, open }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLoading(true);
    setError("");

    Promise.all([
      api.get("/api/importacoes/google-drive/status"),
      api.get("/api/sincronizacoes"),
      api.get("/api/colegiados"),
      api.get("/api/membros"),
      api.get("/api/reunioes"),
      api.get("/api/publicacoes"),
    ])
      .then(async ([driveStatus, sincronizacoes, colegiados, membros, reunioes, publicacoes]) => {
        const ultimaSincronizacao = sincronizacoes[0] || null;
        const detalheUltimaSincronizacao = ultimaSincronizacao
          ? await api.get(`/api/sincronizacoes/${ultimaSincronizacao.id}`)
          : null;

        setPayload({
          driveStatus,
          sincronizacoes,
          ultimaSincronizacao,
          detalheUltimaSincronizacao,
          colegiados,
          membros,
          reunioes,
          publicacoes,
        });
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [open]);

  const derived = useMemo(() => {
    if (!payload) {
      return null;
    }

    const internos = payload.colegiados.filter((item) => item.tipo === "Interno");
    const externos = payload.colegiados.filter((item) => item.tipo === "Externo");
    const csvFiles =
      payload.detalheUltimaSincronizacao?.arquivos?.map((item) => item.arquivo) || [];
    const foundFolders = Array.from(
      new Set([
        ...payload.colegiados.map((item) => item.sigla).filter(Boolean),
        ...payload.publicacoes.map((item) => item.sigla_colegiado).filter(Boolean),
      ]),
    ).sort();

    const alerts = buildAlerts({
      colegiados: payload.colegiados,
      membros: payload.membros,
      reunioes: payload.reunioes,
    });

    return {
      totalInternos: internos.length,
      totalExternos: externos.length,
      totalIntegrantes: payload.membros.length,
      totalReunioes: payload.reunioes.length,
      totalPublicacoes: payload.publicacoes.length,
      csvFiles,
      foundFolders,
      alerts,
    };
  }, [payload]);

  if (!open) {
    return null;
  }

  return (
    <>
      <button className="status-panel-backdrop" onClick={onClose} type="button" />
      <aside className="status-panel">
        <div className="status-panel__header">
          <div>
            <p className="eyebrow">Area tecnica</p>
            <h2>Status da Base</h2>
          </div>
          <button className="text-button" onClick={onClose} type="button">
            Fechar
          </button>
        </div>

        {loading ? <div className="loading-state"><span className="spinner" />Carregando status da base...</div> : null}
        {error ? <div className="inline-message">{error}</div> : null}

        {!loading && !error && payload && derived ? (
          <div className="status-panel__content">
            <section className="status-panel__section">
              <h3>Fonte de dados</h3>
              <div className="status-panel__list">
                <p>
                  <strong>Pasta principal:</strong>{" "}
                  {payload.driveStatus.root_folder_id || "Nao informado"}
                </p>
                <p>
                  <strong>Ultima leitura:</strong>{" "}
                  {formatDateTime(payload.ultimaSincronizacao?.data_sincronizacao)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {payload.ultimaSincronizacao?.status || "Sem historico registrado"}
                </p>
              </div>
            </section>

            <section className="status-panel__section">
              <h3>Resumo de carga</h3>
              <div className="status-panel__metrics">
                <div className="status-panel__metric">
                  <strong>{derived.totalInternos}</strong>
                  <span>Colegiados Internos</span>
                </div>
                <div className="status-panel__metric">
                  <strong>{derived.totalExternos}</strong>
                  <span>Colegiados Externos</span>
                </div>
                <div className="status-panel__metric">
                  <strong>{derived.totalIntegrantes}</strong>
                  <span>Integrantes</span>
                </div>
                <div className="status-panel__metric">
                  <strong>{derived.totalReunioes}</strong>
                  <span>Reunioes</span>
                </div>
                <div className="status-panel__metric">
                  <strong>{derived.totalPublicacoes}</strong>
                  <span>Publicacoes</span>
                </div>
              </div>
            </section>

            <section className="status-panel__section">
              <h3>Arquivos CSV identificados</h3>
              {derived.csvFiles.length ? (
                <ul className="status-panel__bullet-list">
                  {derived.csvFiles.map((file) => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nenhum arquivo CSV identificado.</p>
              )}
            </section>

            <section className="status-panel__section">
              <h3>Pastas de colegiados encontradas</h3>
              {derived.foundFolders.length ? (
                <ul className="status-panel__bullet-list">
                  {derived.foundFolders.map((folder) => (
                    <li key={folder}>{folder}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Pasta correspondente ao colegiado nao localizada.</p>
              )}
            </section>

            <section className="status-panel__section">
              <h3>Alertas e inconsistencias</h3>
              {derived.alerts.length ? (
                <ul className="status-panel__bullet-list">
                  {derived.alerts.map((alert) => (
                    <li key={alert}>{alert}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nenhuma inconsistencia detectada na leitura atual.</p>
              )}
            </section>
          </div>
        ) : null}
      </aside>
    </>
  );
};

export default StatusBasePanel;
