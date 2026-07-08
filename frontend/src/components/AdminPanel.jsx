import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineCircleStack,
  HiOutlineUserPlus,
  HiOutlineXMark,
} from "react-icons/hi2";
import { api } from "../services/api";
import { formatDateTime } from "../services/formatters";

const INITIAL_COLLABORATOR = {
  nome: "",
  email: "",
  coordenacao: "",
  ramal: "",
};

const listClassName = (items) =>
  `status-panel__bullet-list ${items.length > 5 ? "is-scrollable" : ""}`;

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

const ModalShell = ({ children, onClose, title, wide = false }) => (
  <>
    <button className="modal-backdrop" onClick={onClose} type="button" />
    <section
      aria-label={title}
      aria-modal="true"
      className={`app-modal admin-app-modal ${wide ? "admin-app-modal--wide" : ""}`.trim()}
      role="dialog"
    >
      <div className="app-modal__header">
        <h3>{title}</h3>
        <button className="app-modal__close" onClick={onClose} type="button">
          <HiOutlineXMark />
        </button>
      </div>
      <div className="app-modal__body">{children}</div>
    </section>
  </>
);

const AdminPanel = ({ onClose, onLogout, open, token, user }) => {
  const [activeModal, setActiveModal] = useState("");
  const [statusPayload, setStatusPayload] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncError, setSyncError] = useState("");
  const [collaboratorForm, setCollaboratorForm] = useState(INITIAL_COLLABORATOR);
  const [savingCollaborator, setSavingCollaborator] = useState(false);
  const [collaboratorMessage, setCollaboratorMessage] = useState("");
  const [collaboratorError, setCollaboratorError] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [resettingUserId, setResettingUserId] = useState("");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const loadStatusData = async () => {
    setLoadingStatus(true);
    setStatusError("");

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

      setStatusPayload({
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
      setStatusError(requestError.message || "Nao foi possivel carregar o status da base.");
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);

    try {
      const result = await api.get("/api/auth/usuarios", {
        headers: authHeaders,
      });
      setUsers(result);
    } catch (requestError) {
      setCollaboratorError(
        requestError.message || "Nao foi possivel carregar os usuarios autorizados.",
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!open || activeModal !== "status") {
      return;
    }

    loadStatusData();
  }, [activeModal, open]);

  if (!open) {
    return null;
  }

  const derivedStatus = statusPayload
    ? (() => {
        const internos = statusPayload.colegiados.filter(
          (item) => item.categoria === "Interno",
        );
        const externos = statusPayload.colegiados.filter(
          (item) => item.categoria === "Externo",
        );
        const arquivosDetalhados = statusPayload.detalheUltimaSincronizacao?.arquivos || [];
        const csvFiles = arquivosDetalhados
          .filter((item) => item.arquivo)
          .map((item) => item.arquivo);
        const foundFolders = Array.from(
          new Set([
            ...statusPayload.colegiados
              .map((item) => item.chave_pasta || item.sigla)
              .filter(Boolean),
            ...statusPayload.publicacoes
              .map((item) => item.sigla_colegiado)
              .filter(Boolean),
          ]),
        ).sort();

        return {
          totalInternos: internos.length,
          totalExternos: externos.length,
          totalIntegrantes: statusPayload.membros.length,
          totalReunioes: statusPayload.reunioes.length,
          totalPublicacoes: statusPayload.publicacoes.length,
          csvFiles,
          importedFiles: arquivosDetalhados.filter(
            (item) => item.status === "Importado com sucesso",
          ),
          ignoredFiles: arquivosDetalhados.filter((item) => item.status === "Ignorado"),
          warningFiles: arquivosDetalhados.filter((item) => item.status === "Alerta"),
          errorFiles: arquivosDetalhados.filter((item) => item.status === "Erro"),
          foundFolders,
          alerts: buildAlerts({
            colegiados: statusPayload.colegiados,
            membros: statusPayload.membros,
            reunioes: statusPayload.reunioes,
          }),
        };
      })()
    : null;

  const openStatusModal = () => {
    setActiveModal("status");
  };

  const openSyncModal = () => {
    setSyncMessage("");
    setSyncError("");
    setActiveModal("sync");
  };

  const openCollaboratorModal = () => {
    setCollaboratorForm(INITIAL_COLLABORATOR);
    setCollaboratorMessage("");
    setCollaboratorError("");
    setActiveModal("collaborator");
    loadUsers();
  };

  const closeActiveModal = () => {
    setActiveModal("");
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage("");
    setSyncError("");

    try {
      const result = await api.post(
        "/api/sincronizacoes/executar",
        {},
        {
          headers: authHeaders,
        },
      );
      setSyncMessage(result.message || "Sincronizacao concluida com sucesso.");
      await loadStatusData();
    } catch (requestError) {
      setSyncError(
        requestError.message ||
          "Nao foi possivel concluir a sincronizacao. Verifique as configuracoes.",
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleCollaboratorChange = (field) => (event) => {
    const value = event.target.value;
    setCollaboratorForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateCollaborator = async (event) => {
    event.preventDefault();
    setSavingCollaborator(true);
    setCollaboratorMessage("");
    setCollaboratorError("");

    try {
      const result = await api.post("/api/auth/usuarios", collaboratorForm, {
        headers: authHeaders,
      });
      setCollaboratorMessage(
        result.message || "Colaborador criado com senha inicial C2026@mps.",
      );
      setCollaboratorForm(INITIAL_COLLABORATOR);
      await loadUsers();
    } catch (requestError) {
      setCollaboratorError(
        requestError.message || "Nao foi possivel criar o colaborador.",
      );
    } finally {
      setSavingCollaborator(false);
    }
  };

  const handleResetPassword = async (targetUser) => {
    setResettingUserId(String(targetUser.id));
    setCollaboratorMessage("");
    setCollaboratorError("");

    try {
      const result = await api.post(
        `/api/auth/usuarios/${targetUser.id}/redefinir-senha`,
        {},
        {
          headers: authHeaders,
        },
      );
      setCollaboratorMessage(result.message);
      await loadUsers();
    } catch (requestError) {
      setCollaboratorError(
        requestError.message || "Nao foi possivel redefinir a senha do usuario.",
      );
    } finally {
      setResettingUserId("");
    }
  };

  return (
    <>
      <button className="modal-backdrop" onClick={onClose} type="button" />
      <section
        aria-label="Painel administrativo"
        aria-modal="true"
        className="app-modal admin-panel-modal"
        role="dialog"
      >
        <div className="app-modal__header">
          <div>
            <p className="eyebrow">Painel administrativo</p>
            <h3>Ambiente administrativo</h3>
          </div>
          <div className="admin-panel-modal__actions">
            <button className="text-button" onClick={onLogout} type="button">
              Sair do sistema
            </button>
            <button className="app-modal__close" onClick={onClose} type="button">
              <HiOutlineXMark />
            </button>
          </div>
        </div>

        <div className="admin-panel-intro">
          <strong>Ola, {user?.primeiroNome || "Administrador"}</strong>
          <span>Selecione uma acao administrativa.</span>
        </div>

        <div className="admin-card-grid">
          <button className="admin-card" onClick={openSyncModal} type="button">
            <span className="admin-card__icon">
              <HiOutlineArrowPath />
            </span>
            <strong>Sincronizar a base</strong>
            <p>Executa a sincronizacao do Google Drive e atualiza os dados do sistema.</p>
          </button>

          <button className="admin-card" onClick={openCollaboratorModal} type="button">
            <span className="admin-card__icon">
              <HiOutlineUserPlus />
            </span>
            <strong>Adicionar novo colaborador</strong>
            <p>Cria um colaborador ativo com senha inicial `C2026@mps`.</p>
          </button>

          <button className="admin-card" onClick={openStatusModal} type="button">
            <span className="admin-card__icon">
              <HiOutlineCircleStack />
            </span>
            <strong>Status da base</strong>
            <p>Consulta fonte de dados, resumo de carga, arquivos e inconsistencias.</p>
          </button>
        </div>
      </section>

      {activeModal === "sync" ? (
        <ModalShell onClose={closeActiveModal} title="Sincronizar base de dados">
          <div className="admin-sync-panel">
            <p>
              Dispare a sincronizacao manual da base. O sistema vai permanecer no
              ambiente administrativo apos a conclusao.
            </p>
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
            {syncMessage ? <div className="inline-message">{syncMessage}</div> : null}
            {syncError ? <div className="inline-message danger-text">{syncError}</div> : null}
          </div>
        </ModalShell>
      ) : null}

      {activeModal === "collaborator" ? (
        <ModalShell onClose={closeActiveModal} title="Adicionar novo colaborador">
          <div className="admin-sync-panel">
            <form className="form-grid" onSubmit={handleCreateCollaborator}>
              <label>
                Nome
                <input
                  onChange={handleCollaboratorChange("nome")}
                  required
                  value={collaboratorForm.nome}
                />
              </label>
              <label>
                Email
                <input
                  onChange={handleCollaboratorChange("email")}
                  required
                  type="email"
                  value={collaboratorForm.email}
                />
              </label>
              <label>
                Coordenacao
                <input
                  onChange={handleCollaboratorChange("coordenacao")}
                  required
                  value={collaboratorForm.coordenacao}
                />
              </label>
              <label>
                Ramal
                <input
                  onChange={handleCollaboratorChange("ramal")}
                  required
                  value={collaboratorForm.ramal}
                />
              </label>

              <div className="form-actions full">
                <button className="primary-button" disabled={savingCollaborator} type="submit">
                  {savingCollaborator ? "Salvando..." : "Salvar colaborador"}
                </button>
              </div>
            </form>

            <section className="status-panel__section">
              <h3>Usuarios autorizados</h3>
              {loadingUsers ? <p className="muted">Carregando usuarios...</p> : null}
              {!loadingUsers && users.length ? (
                <div className="admin-users-list">
                  {users.map((listedUser) => (
                    <div className="admin-user-card" key={listedUser.id}>
                      <div className="admin-user-card__content">
                        <strong>{listedUser.nome}</strong>
                        <span>{listedUser.email}</span>
                        <span>
                          {listedUser.perfil} • {listedUser.status}
                        </span>
                      </div>
                      <button
                        className="text-button"
                        disabled={resettingUserId === String(listedUser.id)}
                        onClick={() => handleResetPassword(listedUser)}
                        type="button"
                      >
                        {resettingUserId === String(listedUser.id)
                          ? "Redefinindo..."
                          : "Redefinir senha"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              {!loadingUsers && !users.length ? (
                <p className="muted">Nenhum usuario autorizado cadastrado.</p>
              ) : null}
            </section>
          </div>

          {collaboratorMessage ? (
            <div className="inline-message">{collaboratorMessage}</div>
          ) : null}
          {collaboratorError ? (
            <div className="inline-message danger-text">{collaboratorError}</div>
          ) : null}
        </ModalShell>
      ) : null}

      {activeModal === "status" ? (
        <ModalShell onClose={closeActiveModal} title="Status da base" wide>
          {loadingStatus ? (
            <div className="loading-state">
              <span className="spinner" />
              Carregando status da base...
            </div>
          ) : null}

          {statusError ? <div className="inline-message danger-text">{statusError}</div> : null}

          {!loadingStatus && statusPayload && derivedStatus ? (
            <div className="status-panel__content">
              <section className="status-panel__section">
                <h3>Fonte de dados</h3>
                <div className="status-panel__list">
                  <p>
                    <strong>Pasta principal:</strong>{" "}
                    {statusPayload.driveStatus.root_folder_label || "Google Drive / Colegiados_MPS"}
                  </p>
                  <p>
                    <strong>Ultima leitura:</strong>{" "}
                    {formatDateTime(statusPayload.ultimaSincronizacao?.data_sincronizacao)}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {statusPayload.ultimaSincronizacao?.status || "Sem historico registrado"}
                  </p>
                </div>
              </section>

              <section className="status-panel__section">
                <h3>Resumo de carga</h3>
                <div className="status-panel__metrics">
                  <div className="status-panel__metric">
                    <strong>{derivedStatus.totalInternos}</strong>
                    <span>Colegiados Internos</span>
                  </div>
                  <div className="status-panel__metric">
                    <strong>{derivedStatus.totalExternos}</strong>
                    <span>Colegiados Externos</span>
                  </div>
                  <div className="status-panel__metric">
                    <strong>{derivedStatus.totalIntegrantes}</strong>
                    <span>Integrantes</span>
                  </div>
                  <div className="status-panel__metric">
                    <strong>{derivedStatus.totalReunioes}</strong>
                    <span>Reunioes</span>
                  </div>
                  <div className="status-panel__metric">
                    <strong>{derivedStatus.totalPublicacoes}</strong>
                    <span>Publicacoes</span>
                  </div>
                </div>
              </section>

              <section className="status-panel__section">
                <h3>Arquivos CSV identificados ({derivedStatus.csvFiles.length})</h3>
                {derivedStatus.csvFiles.length ? (
                  <ul className={listClassName(derivedStatus.csvFiles)}>
                    {derivedStatus.csvFiles.map((file) => (
                      <li key={file}>{file}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Nenhum arquivo CSV identificado.</p>
                )}
              </section>

              <section className="status-panel__section">
                <h3>Arquivos importados ({derivedStatus.importedFiles.length})</h3>
                {derivedStatus.importedFiles.length ? (
                  <ul className={listClassName(derivedStatus.importedFiles)}>
                    {derivedStatus.importedFiles.map((item) => (
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
                <h3>Arquivos ignorados ({derivedStatus.ignoredFiles.length})</h3>
                {derivedStatus.ignoredFiles.length ? (
                  <ul className={listClassName(derivedStatus.ignoredFiles)}>
                    {derivedStatus.ignoredFiles.map((item, index) => (
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
                <h3>Alertas ({derivedStatus.warningFiles.length})</h3>
                {derivedStatus.warningFiles.length ? (
                  <ul className={listClassName(derivedStatus.warningFiles)}>
                    {derivedStatus.warningFiles.map((item, index) => (
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
                <h3>Pastas de colegiados encontradas ({derivedStatus.foundFolders.length})</h3>
                {derivedStatus.foundFolders.length ? (
                  <ul className={listClassName(derivedStatus.foundFolders)}>
                    {derivedStatus.foundFolders.map((folder) => (
                      <li key={folder}>{folder}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Nenhuma pasta de colegiado localizada.</p>
                )}
              </section>

              <section className="status-panel__section">
                <h3>Alertas e inconsistencias</h3>
                {derivedStatus.alerts.length || derivedStatus.errorFiles.length ? (
                  <ul className={listClassName([...derivedStatus.alerts, ...derivedStatus.errorFiles])}>
                    {derivedStatus.alerts.map((alert) => (
                      <li key={alert}>{alert}</li>
                    ))}
                    {derivedStatus.errorFiles.map((item, index) => (
                      <li key={`${item.arquivo}-${index}`}>
                        {item.arquivo}: {item.observacao || item.status}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">
                    Nenhuma inconsistencia detectada na leitura atual.
                  </p>
                )}
              </section>
            </div>
          ) : null}
        </ModalShell>
      ) : null}
    </>
  );
};

export default AdminPanel;
