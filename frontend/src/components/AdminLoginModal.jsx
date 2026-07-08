import { useState } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import { api } from "../services/api";

const initialCredentials = {
  user: "",
  password: "",
};

const AdminLoginModal = ({ onAuthenticated, onClose, open }) => {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!open) {
    return null;
  }

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setCredentials((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      user: String(formData.get("user") || credentials.user || "").trim(),
      password: String(formData.get("password") || credentials.password || ""),
    };

    try {
      const result = await api.post("/api/auth/login", payload);
      setCredentials(initialCredentials);
      onAuthenticated(result);
    } catch (requestError) {
      setError(requestError.message || "Usuario ou senha invalidos.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setMessage("");
    setError("");

    try {
      const result = await api.post("/api/auth/esqueci-senha", {
        user: credentials.user,
      });
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel registrar a solicitacao.");
    }
  };

  return (
    <>
      <button className="modal-backdrop" onClick={onClose} type="button" />
      <section
        aria-label="Acesso administrativo"
        aria-modal="true"
        className="admin-modal"
        role="dialog"
      >
        <div className="admin-modal__header">
          <div>
            <p className="eyebrow">Acesso restrito</p>
            <h2>Acesso administrativo</h2>
          </div>
          <button
            aria-label="Fechar login administrativo"
            className="app-modal__close"
            onClick={onClose}
            type="button"
          >
            <HiOutlineXMark />
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Usuario ou e-mail
            <input
              autoComplete="username"
              name="user"
              onChange={handleChange("user")}
              required
              value={credentials.user}
            />
          </label>

          <label>
            Senha
            <input
              autoComplete="current-password"
              name="password"
              onChange={handleChange("password")}
              required
              type="password"
              value={credentials.password}
            />
          </label>

          <div className="form-actions full">
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? "Entrando..." : "Entrar"}
            </button>
            <button className="text-button" onClick={handleForgotPassword} type="button">
              Esqueci minha senha
            </button>
          </div>
        </form>

        {message ? <div className="inline-message">{message}</div> : null}
        {error ? <div className="inline-message danger-text">{error}</div> : null}
      </section>
    </>
  );
};

export default AdminLoginModal;
