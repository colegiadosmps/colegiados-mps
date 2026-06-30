import { useEffect, useState } from "react";
import { HiOutlineCircleStack } from "react-icons/hi2";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import PowerBiTable from "../components/PowerBiTable";
import { api } from "../services/api";
import { formatDateTime } from "../services/formatters";

const initialCredentials = {
  user: "",
  password: "",
};

const historicoColumns = [
  { key: "data_sincronizacao", label: "Data", width: "180px" },
  { key: "status", label: "Status", width: "180px" },
  { key: "total_pastas_encontradas", label: "Pastas", width: "90px" },
  { key: "total_arquivos_encontrados", label: "Arquivos", width: "90px" },
  { key: "total_arquivos_processados", label: "Processados", width: "110px" },
  { key: "total_registros_membros", label: "Membros", width: "90px" },
  { key: "total_registros_reunioes", label: "Reunioes", width: "90px" },
  { key: "observacao", label: "Observacao", width: "260px", className: "cell-wrap" },
];

const arquivosColumns = [
  { key: "arquivo", label: "Arquivo", width: "280px", className: "cell-wrap" },
  { key: "tipo", label: "Tipo", width: "120px" },
  { key: "sigla_colegiado", label: "Colegiado", width: "120px" },
  { key: "data_base", label: "Data Base", width: "120px" },
  { key: "quantidade_registros", label: "Qtd.", width: "90px" },
  { key: "status", label: "Status", width: "140px" },
  { key: "observacao", label: "Observacao", width: "280px", className: "cell-wrap" },
];

const StatusBase = () => {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [token, setToken] = useState("");
  const [historico, setHistorico] = useState(null);
  const [detalheAtual, setDetalheAtual] = useState(null);
  const [driveStatus, setDriveStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadData = () =>
    Promise.all([
      api.get("/api/sincronizacoes"),
      api.get("/api/importacoes/google-drive/status"),
    ]).then(async ([historicoResult, driveStatusResult]) => {
      setHistorico(historicoResult);
      setDriveStatus(driveStatusResult);

      if (historicoResult[0]) {
        const detalhe = await api.get(`/api/sincronizacoes/${historicoResult[0].id}`);
        setDetalheAtual(detalhe);
      } else {
        setDetalheAtual(null);
      }
    });

  useEffect(() => {
    if (!token) {
      return;
    }

    loadData().catch((error) => setMessage(error.message));
  }, [token]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const result = await api.post("/api/auth/admin", credentials);
      setToken(result.token);
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage("");

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
    } catch (error) {
      setMessage(
        error.message ||
          "Nao foi possivel concluir a sincronizacao. Verifique as credenciais do Google Drive ou a estrutura das pastas.",
      );
    } finally {
      setSyncing(false);
    }
  };

  const ultima = historico?.[0];

  return (
    <div className="page-content">
      <PageHeader
        filters={null}
        icon={HiOutlineCircleStack}
        metricLabel="Acesso tecnico"
        metricValue={token ? "Liberado" : "Restrito"}
        subtitle="Area restrita para consultar o historico da base e disparar a sincronizacao com o Google Drive."
        title="Status da Base"
      />

      {!token ? (
        <section className="content-card">
          <div className="section-heading">
            <h3>Autenticacao administrativa</h3>
            <p>Informe usuario e senha para acessar o historico e executar a sincronizacao.</p>
          </div>

          <form className="form-grid" onSubmit={handleLogin}>
            <label>
              Usuario
              <input
                autoComplete="username"
                value={credentials.user}
                onChange={(event) =>
                  setCredentials((current) => ({ ...current, user: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Senha
              <input
                autoComplete="current-password"
                type="password"
                value={credentials.password}
                onChange={(event) =>
                  setCredentials((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
            </label>
            <div className="form-actions full">
              <button className="primary-button" disabled={submitting} type="submit">
                {submitting ? "Validando..." : "Entrar"}
              </button>
            </div>
          </form>

          {message ? <div className="inline-message">{message}</div> : null}
        </section>
      ) : null}

      {token && (!historico || !driveStatus) ? <Loading label="Carregando status da base..." /> : null}

      {token && historico && driveStatus ? (
        <>
          <section className="content-card">
            <div className="section-heading">
              <h3>Controle de sincronizacao</h3>
              <p>Use o botao abaixo para atualizar a base a partir do Google Drive.</p>
            </div>

            <div className="status-grid">
              <div className="status-item">
                <span>Google Drive</span>
                <strong>{driveStatus.configured ? "Configurado" : "Nao configurado"}</strong>
              </div>
              <div className="status-item">
                <span>Ultima sincronizacao</span>
                <strong>{formatDateTime(ultima?.data_sincronizacao)}</strong>
              </div>
              <div className="status-item">
                <span>Pastas encontradas</span>
                <strong>{ultima?.total_pastas_encontradas || 0}</strong>
              </div>
              <div className="status-item">
                <span>Arquivos encontrados</span>
                <strong>{ultima?.total_arquivos_encontrados || 0}</strong>
              </div>
              <div className="status-item">
                <span>Arquivos processados</span>
                <strong>{ultima?.total_arquivos_processados || 0}</strong>
              </div>
              <div className="status-item">
                <span>Publicacoes</span>
                <strong>{ultima?.total_pastas_publicacoes || 0}</strong>
              </div>
            </div>

            <div className="status-actions">
              <button
                className="primary-button"
                disabled={syncing}
                onClick={handleSync}
                type="button"
              >
                {syncing ? "Sincronizando..." : "Sincronizar agora"}
              </button>
            </div>

            {message ? <div className="inline-message">{message}</div> : null}
          </section>

          <section className="content-card">
            <div className="section-heading">
              <h3>Historico de Sincronizacoes</h3>
              <p>{historico.length} execucao(oes) registradas.</p>
            </div>
            <PowerBiTable
              columns={historicoColumns}
              emptyMessage="Nenhuma sincronizacao registrada."
              rows={historico}
            />
          </section>

          <section className="content-card">
            <div className="section-heading">
              <h3>Arquivos da Ultima Sincronizacao</h3>
              <p>{detalheAtual?.arquivos?.length || 0} arquivo(s) registrados.</p>
            </div>
            <PowerBiTable
              columns={arquivosColumns}
              emptyMessage="Nenhum arquivo registrado na ultima sincronizacao."
              rows={detalheAtual?.arquivos || []}
            />
          </section>
        </>
      ) : null}
    </div>
  );
};

export default StatusBase;
