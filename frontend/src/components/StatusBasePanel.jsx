import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  formatColegiadoDisplayName,
  formatDateTime,
} from "../services/formatters";

const initialCredentials = {
  user: "",
  password: "",
};

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

const listClassName = (items) =>
  `status-panel__bullet-list ${items.length > 5 ? "is-scrollable" : ""}`;

const StatusBasePanel = ({ onClose, open }) => {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  const resetAuthState = (nextMessage = "") => {
    setToken("");
    setCredentials(initialCredentials);
    setSubmitting(false);
    setSyncing(false);
    setError("");
    setMessage(nextMessage);
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        driveStatus,
        sincronizacoes,
        colegiados,
        membros,
        reunioes,
        publicacoes,
      ] = await Promise.all([
        api.get("/api/importacoes/google-drive/status"),
        api.get("/api/sincronizacoes"),
        api.get("/api/colegiados"),
        api.get("/api/membros"),
        api.get("/api/reunioes"),
        api.get("/api/publicacoes"),
      ]);

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
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    loadData();
  }, [open]);

  const derived = useMemo(() => {
    if (!payload) {
      return null;
    }

    const internos = payload.colegiados.filter((item) => item.categoria === "Interno");
    const externos = payload.colegiados.filter((item) => item.categoria === "Externo");
    const arquivosDetalhados = payload.detalheUltimaSincronizacao?.arquivos || [];
    const csvFiles = arquivosDetalhados.filter((item) => item.arquivo).map((item) => item.arquivo);
    const foundFolders = Array.from(
      new Set([
        ...payload.colegiados.map((item) => item.chave_pasta || item.sigla).filter(Boolean),
        ...payload.publicacoes.map((item) => item.sigla_colegiado).filter(Boolean),
      ]),
    ).sort();

    return {
      totalInternos: internos.length,
      totalExternos: externos.length,
      totalIntegrantes: payload.membros.length,
      totalReunioes: payload.reunioes.length,
      totalPublicacoes: payload.publicacoes.length,
      csvFiles,
      importedFiles: arquivosDetalhados.filter((item) => item.status === "Importado com sucesso"),
      ignoredFiles: arquivosDetalhados.filter((item) => item.status === "Ignorado"),
      warningFiles: arquivosDetalhados.filter((item) => item.status === "Alerta"),
      errorFiles: arquivosDetalhados.filter((item) => item.status === "Erro"),
      foundFolders,
      alerts: buildAlerts({
        colegiados: payload.colegiados,
        membros: payload.membros,
        reunioes: payload.reunioes,
      }),
    };
  }, [payload]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const result = await api.post("/api/auth/login", credentials);
      setToken(result.token);
      setMessage(result.message || "Acesso autorizado.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage("");
    setError("");

    try {
      const result = await api.post(
        "/api/sincronizacoes/executar",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await loadData();
      setMessage(result.message || "Sincronizacao concluida com sucesso.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    setPayload(null);
    api
      .post(
        "/api/auth/logout",
        {},
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      )
      .catch(() => null);
    resetAuthState("Sessao administrativa finalizada.");
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    try {
      const result = await api.post("/api/auth/esqueci-senha", {
        user: credentials.user,
      });
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return !open ? null : (
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

        {!loading && payload ? (
          <div className="status-panel__content">
            <section className="status-panel__section">
              <h3>Fonte de dados</h3>
              <div className="status-panel__list">
                <p>
                  <strong>Pasta principal:</strong>{" "}
                  {payload.driveStatus.root_folder_label || "Google Drive"}
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
          </div>
        ) : null}

        {!token ? (
          <section className="status-panel__section">
            <h3>Autenticacao administrativa</h3>
            <p className="muted">
              Informe usuario e senha para executar a sincronizacao manual.
            </p>

            <form className="form-grid" onSubmit={handleLogin}>
              <label>
                Usuario
                <input
                  autoComplete="username"
                  onChange={(event) =>
                    setCredentials((current) => ({ ...current, user: event.target.value }))
                  }
                  required
                  value={credentials.user}
                />
              </label>

              <label>
                Senha
                <input
                  autoComplete="current-password"
                  onChange={(event) =>
                    setCredentials((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  required
                  type="password"
                  value={credentials.password}
                />
              </label>

              <div className="form-actions full">
                <button className="primary-button" disabled={submitting} type="submit">
                  {submitting ? "Validando..." : "Entrar"}
                </button>
                <button className="text-button" onClick={handleForgotPassword} type="button">
                  Esqueci minha senha
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {loading ? (
          <div className="loading-state">
            <span className="spinner" />
            Carregando status da base...
          </div>
        ) : null}

        {message ? <div className="inline-message">{message}</div> : null}
        {error ? <div className="inline-message danger-text">{error}</div> : null}

        {!loading && payload && derived ? (
          <div className="status-panel__content">
            {token ? (
              <section className="status-panel__section">
                <div className="section-heading">
                  <div>
                    <h3>Controle de sincronizacao</h3>
                    <p>Sincronize manualmente a base do Google Drive com o sistema.</p>
                  </div>
                </div>

                <div className="status-panel__actions">
                  <button
                    className="primary-button"
                    disabled={syncing}
                    onClick={handleSync}
                    type="button"
                  >
                    {syncing ? "Sincronizando..." : "Sincronizar agora"}
                  </button>
                  <button className="text-button" onClick={handleLogout} type="button">
                    Finalizar sessao
                  </button>
                </div>
              </section>
            ) : null}

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
              <h3>Arquivos CSV identificados ({derived.csvFiles.length})</h3>
              {derived.csvFiles.length ? (
                <ul className={listClassName(derived.csvFiles)}>
                  {derived.csvFiles.map((file) => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nenhum arquivo CSV identificado.</p>
              )}
            </section>

            <section className="status-panel__section">
              <h3>Arquivos importados ({derived.importedFiles.length})</h3>
              {derived.importedFiles.length ? (
                <ul className={listClassName(derived.importedFiles)}>
                  {derived.importedFiles.map((item) => (
                    <li key={`${item.arquivo}-${item.id || item.data_base || "ok"}`}>
                      {item.arquivo} ({item.quantidade_registros} registro(s))
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nenhum arquivo importado na ultima leitura.</p>
              )}
            </section>

            <section className="status-panel__section">
              <h3>Arquivos ignorados ({derived.ignoredFiles.length})</h3>
              {derived.ignoredFiles.length ? (
                <ul className={listClassName(derived.ignoredFiles)}>
                  {derived.ignoredFiles.map((item, index) => (
                    <li key={`${item.arquivo}-${index}`}>
                      {item.arquivo}: {item.observacao || item.status}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nenhum arquivo ignorado na ultima leitura.</p>
              )}
            </section>

            <section className="status-panel__section">
              <h3>Alertas ({derived.warningFiles.length})</h3>
              {derived.warningFiles.length ? (
                <ul className={listClassName(derived.warningFiles)}>
                  {derived.warningFiles.map((item, index) => (
                    <li key={`${item.arquivo}-${index}`}>
                      {item.arquivo}: {item.observacao || item.status}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nenhum alerta registrado na ultima leitura.</p>
              )}
            </section>

            <section className="status-panel__section">
              <h3>Erros de sincronizacao ({derived.errorFiles.length})</h3>
              {derived.errorFiles.length ? (
                <ul className={listClassName(derived.errorFiles)}>
                  {derived.errorFiles.map((item, index) => (
                    <li key={`${item.arquivo}-${index}`}>
                      {item.arquivo}: {item.observacao || "Erro nao detalhado"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nenhum erro registrado na ultima leitura.</p>
              )}
            </section>

            <section className="status-panel__section">
              <h3>Pastas de colegiados encontradas ({derived.foundFolders.length})</h3>
              {derived.foundFolders.length ? (
                <ul className={listClassName(derived.foundFolders)}>
                  {derived.foundFolders.map((folder) => (
                    <li key={folder}>{formatColegiadoDisplayName(folder)}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Pasta correspondente ao colegiado nao localizada.</p>
              )}
            </section>

            <section className="status-panel__section">
              <h3>Alertas e inconsistencias ({derived.alerts.length})</h3>
              {derived.alerts.length ? (
                <ul className={listClassName(derived.alerts)}>
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
