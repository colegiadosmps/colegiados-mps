import { useState } from "react";
import { api } from "../services/api";

const initialCredentials = {
  user: "",
  password: "",
};

const AdminSyncModal = ({ onClose }) => {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

      setSummary(result.sincronizacao);
      setMessage("Sincronizacao concluida com sucesso.");
    } catch (error) {
      setMessage(
        error.message ||
          "Nao foi possivel concluir a sincronizacao. Verifique as credenciais do Google Drive ou a estrutura das pastas.",
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <button className="modal-backdrop" onClick={onClose} type="button" />
      <section className="admin-modal">
        <div className="section-heading">
          <h2>Area tecnica</h2>
          <button className="text-button" onClick={onClose} type="button">
            Fechar
          </button>
        </div>

        {!token ? (
          <form className="form-grid" onSubmit={handleLogin}>
            <label>
              Usuario
              <input
                autoComplete="username"
                value={credentials.user}
                onChange={(event) =>
                  setCredentials({ ...credentials, user: event.target.value })
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
                  setCredentials({ ...credentials, password: event.target.value })
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
        ) : (
          <div className="admin-sync-panel">
            <p className="muted">
              Acesso autorizado. Use o botao abaixo para disparar a sincronizacao do
              Google Drive com o SQLite.
            </p>
            <button
              className="primary-button"
              disabled={syncing}
              onClick={handleSync}
              type="button"
            >
              {syncing ? "Sincronizando..." : "Sincronizar agora"}
            </button>
          </div>
        )}

        {message ? <div className="inline-message">{message}</div> : null}

        {summary ? (
          <div className="result-card">
            <h3>Resumo da sincronizacao</h3>
            <p>Pastas encontradas: {summary.total_pastas_encontradas}</p>
            <p>Arquivos encontrados: {summary.total_arquivos_encontrados}</p>
            <p>Arquivos processados: {summary.total_arquivos_processados}</p>
            <p>Registros de membros: {summary.total_registros_membros}</p>
            <p>Registros de reunioes: {summary.total_registros_reunioes}</p>
            <p>Pastas de publicacoes: {summary.total_pastas_publicacoes}</p>
            <p>Status geral: {summary.status}</p>
            <p>Observacao: {summary.observacao || "-"}</p>
          </div>
        ) : null}
      </section>
    </>
  );
};

export default AdminSyncModal;
