import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineCircleStack,
  HiOutlineKey,
  HiOutlineUserPlus,
  HiOutlineXMark,
} from "react-icons/hi2";
import EmptyStatePanel from "./common/EmptyStatePanel";
import FeedbackPanel from "./common/FeedbackPanel";
import LottieAnimation from "./common/LottieAnimation";
import { api } from "../services/api";
import { formatDateTime } from "../services/formatters";

const INITIAL_COLLABORATOR = {
  nome: "",
  email: "",
  coordenacao: "",
  ramal: "",
};

const INITIAL_PASSWORD_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
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
  const [passwordForm, setPasswordForm] = useState(INITIAL_PASSWORD_FORM);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );
  const isAdmin = String(user?.perfil || "").toUpperCase() === "ADMIN";

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
        api.get("/api/importacoes/google-drive/status", {
          headers: authHeaders,
        }),
        api.get("/api/sincronizacoes"),
        api.get("/api/colegiados"),
        api.get("/api/membros"),
        api.get("/api/reunioes"),
        api.get("/api/publicacoes"),
      ]);

      const ultimaSincronizacao = sincronizacoes[0] || null;
      const detalheUltimaSincronizacao = ultimaSincronizacao
        ? await api.get(`/api/sincronizacoes/${ultimaSincronizacao.id}`, {
            headers: authHeaders,
          })
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
  }, [activeModal, authHeaders, open]);

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
          technicalFiles: arquivosDetalhados.filter((item) =>
            ["Configuracao", "Modelo", "Auditoria"].includes(item.tipo),
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

  const openPasswordModal = () => {
    setPasswordForm(INITIAL_PASSWORD_FORM);
    setPasswordMessage("");
    setPasswordError("");
    setActiveModal("password");
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

    const formData = new FormData(event.currentTarget);
    const payload = {
      nome: String(formData.get("nome") || collaboratorForm.nome || "").trim(),
      email: String(formData.get("email") || collaboratorForm.email || "").trim(),
      coordenacao: String(
        formData.get("coordenacao") || collaboratorForm.coordenacao || "",
      ).trim(),
      ramal: String(formData.get("ramal") || collaboratorForm.ramal || "").trim(),
    };

    try {
      const result = await api.post("/api/auth/usuarios", payload, {
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

  const handlePasswordChange = (field) => (event) => {
    const value = event.target.value;
    setPasswordForm((current) => ({ ...current, [field]: value }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordMessage("");
    setPasswordError("");

    const formData = new FormData(event.currentTarget);
    const currentPassword = String(
      formData.get("currentPassword") || passwordForm.currentPassword || "",
    );
    const newPassword = String(
      formData.get("newPassword") || passwordForm.newPassword || "",
    );
    const confirmPassword = String(
      formData.get("confirmPassword") || passwordForm.confirmPassword || "",
    );

    if (newPassword !== confirmPassword) {
      setSavingPassword(false);
      setPasswordError("A confirmacao da senha nao confere.");
      return;
    }

    try {
      const result = await api.post(
        "/api/auth/trocar-senha",
        {
          currentPassword,
          newPassword,
        },
        {
          headers: authHeaders,
        },
      );
      setPasswordMessage(result.message || "Senha atualizada com sucesso.");
      setPasswordForm(INITIAL_PASSWORD_FORM);
    } catch (requestError) {
      setPasswordError(
        requestError.message || "Nao foi possivel atualizar a senha.",
      );
    } finally {
      setSavingPassword(false);
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
            <p className="eyebrow">{isAdmin ? "Painel administrativo" : "Minha conta"}</p>
            <h3>{isAdmin ? "Ambiente administrativo" : "Area do colaborador"}</h3>
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
          <strong>Ola, {user?.primeiroNome || "Usuario"}</strong>
          <span>
            {isAdmin
              ? "Selecione uma acao administrativa."
              : "Modo de edicao ativo nas areas operacionais. Aqui voce gerencia apenas sua conta e sua senha."}
          </span>
        </div>

        <div className="admin-card-grid">
          {isAdmin ? (
            <>
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
                <p>Cria um colaborador ativo com senha inicial C2026@mps.</p>
              </button>

              <button className="admin-card" onClick={openStatusModal} type="button">
                <span className="admin-card__icon">
                  <HiOutlineCircleStack />
                </span>
                <strong>Status da base</strong>
                <p>Consulta fonte de dados, resumo de carga, arquivos e inconsistencias.</p>
              </button>
            </>
          ) : (
            <button className="admin-card" onClick={openPasswordModal} type="button">
              <span className="admin-card__icon">
                <HiOutlineKey />
              </span>
              <strong>Alterar minha senha</strong>
              <p>Atualiza sua senha temporaria ou sua senha atual de acesso.</p>
            </button>
          )}
        </div>
      </section>

      {activeModal === "sync" ? (
        <ModalShell onClose={closeActiveModal} title="Sincronizar base de dados">
          <div className="admin-sync-panel">
            <div className="loading-state loading-state--visual">
              <LottieAnimation
                fallback={<div className="spinner" />}
                height={140}
                name={syncing ? "sync-drive" : syncMessage ? "success" : syncError ? "error" : "sync-drive"}
                width={140}
              />
            </div>
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
            {syncMessage ? <FeedbackPanel message={syncMessage} tone="success" /> : null}
            {syncError ? <FeedbackPanel message={syncError} tone="error" title="Falha na sincronizacao" /> : null}
          </div>
        </ModalShell>
      ) : null}

      {activeModal === "collaborator" ? (
        <ModalShell onClose={closeActiveModal} title="Adicionar novo colaborador">
          <div className="admin-sync-panel">
            {(savingCollaborator || collaboratorMessage || collaboratorError) ? (
              <div className="loading-state loading-state--visual">
                <LottieAnimation
                  fallback={<div className="spinner" />}
                  height={120}
                  name={savingCollaborator ? "import-csv" : collaboratorError ? "error" : "success-saved"}
                  width={120}
                />
              </div>
            ) : null}
            <form className="form-grid" onSubmit={handleCreateCollaborator}>
              <label>
                Nome
                <input
                  name="nome"
                  onChange={handleCollaboratorChange("nome")}
                  required
                  value={collaboratorForm.nome}
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  onChange={handleCollaboratorChange("email")}
                  required
                  type="email"
                  value={collaboratorForm.email}
                />
              </label>
              <label>
                Coordenacao
                <input
                  name="coordenacao"
                  onChange={handleCollaboratorChange("coordenacao")}
                  required
                  value={collaboratorForm.coordenacao}
                />
              </label>
              <label>
                Ramal
                <input
                  name="ramal"
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
                <EmptyStatePanel
                  animation="empty"
                  message="Nenhum usuario autorizado cadastrado."
                  title="Lista vazia"
                />
              ) : null}
            </section>
          </div>

          {collaboratorMessage ? <FeedbackPanel message={collaboratorMessage} tone="saved" /> : null}
          {collaboratorError ? <FeedbackPanel message={collaboratorError} tone="error" title="Erro ao salvar colaborador" /> : null}
        </ModalShell>
      ) : null}

      {activeModal === "password" ? (
        <ModalShell onClose={closeActiveModal} title="Alterar minha senha">
          <div className="admin-sync-panel">
            {(savingPassword || passwordMessage || passwordError) ? (
              <div className="loading-state loading-state--visual">
                <LottieAnimation
                  fallback={<div className="spinner" />}
                  height={120}
                  name={savingPassword ? "loading-base" : passwordError ? "error" : "success-saved"}
                  width={120}
                />
              </div>
            ) : null}
            <p>
              Sua nova senha deve ter entre 6 e 12 caracteres, com letra maiuscula,
              numero e caractere especial.
            </p>

            <form className="form-grid" onSubmit={handleChangePassword}>
              <label>
                Senha atual
                <input
                  autoComplete="current-password"
                  name="currentPassword"
                  onChange={handlePasswordChange("currentPassword")}
                  required
                  type="password"
                  value={passwordForm.currentPassword}
                />
              </label>

              <label>
                Nova senha
                <input
                  autoComplete="new-password"
                  name="newPassword"
                  onChange={handlePasswordChange("newPassword")}
                  required
                  type="password"
                  value={passwordForm.newPassword}
                />
              </label>

              <label>
                Confirmar nova senha
                <input
                  autoComplete="new-password"
                  name="confirmPassword"
                  onChange={handlePasswordChange("confirmPassword")}
                  required
                  type="password"
                  value={passwordForm.confirmPassword}
                />
              </label>

              <div className="form-actions full">
                <button className="primary-button" disabled={savingPassword} type="submit">
                  {savingPassword ? "Salvando..." : "Atualizar senha"}
                </button>
              </div>
            </form>
          </div>

          {passwordMessage ? <FeedbackPanel message={passwordMessage} tone="saved" /> : null}
          {passwordError ? <FeedbackPanel message={passwordError} tone="error" title="Erro ao alterar senha" /> : null}
        </ModalShell>
      ) : null}

      {activeModal === "status" ? (
        <ModalShell onClose={closeActiveModal} title="Status da base" wide>
          {loadingStatus ? (
            <div className="loading-state loading-state--visual">
              <LottieAnimation
                fallback={<div className="spinner" />}
                height={120}
                name="loading-base"
                width={120}
              />
              <span>Carregando status da base...</span>
            </div>
          ) : null}

          {statusError ? <FeedbackPanel message={statusError} tone="error" title="Erro ao carregar a base" /> : null}

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
                  <EmptyStatePanel
                    animation="empty"
                    message="Nenhum arquivo CSV identificado."
                    title="Sem arquivos CSV"
                  />
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
                  <EmptyStatePanel
                    animation="empty"
                    message="Nenhum arquivo importado na ultima leitura."
                    title="Sem importacoes recentes"
                  />
                )}
              </section>

              <section className="status-panel__section">
                <h3>Arquivos tecnicos do sistema ({derivedStatus.technicalFiles.length})</h3>
                {derivedStatus.technicalFiles.length ? (
                  <ul className={listClassName(derivedStatus.technicalFiles)}>
                    {derivedStatus.technicalFiles.map((item, index) => (
                      <li key={`${item.arquivo}-${index}`}>
                        {item.arquivo}: {item.tipo}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyStatePanel
                    animation="empty"
                    message="Nenhum arquivo tecnico identificado na ultima leitura."
                    title="Sem arquivos tecnicos"
                  />
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
                  <EmptyStatePanel
                    animation="empty"
                    message="Nenhum arquivo ignorado na ultima leitura."
                    title="Sem arquivos ignorados"
                  />
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
                  <EmptyStatePanel
                    animation="empty"
                    message="Nenhum alerta registrado na ultima leitura."
                    title="Sem alertas"
                  />
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
                  <EmptyStatePanel
                    animation="empty"
                    message="Nenhuma pasta de colegiado localizada."
                    title="Sem pastas encontradas"
                  />
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
                  <EmptyStatePanel
                    animation="empty"
                    message="Nenhuma inconsistencia detectada na leitura atual."
                    title="Base consistente"
                  />
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
