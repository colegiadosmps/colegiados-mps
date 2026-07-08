import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import AdminLoginModal from "./components/AdminLoginModal";
import AdminPanel from "./components/AdminPanel";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import CalendarioReunioes from "./pages/CalendarioReunioes";
import ColegiadosExternos from "./pages/ColegiadosExternos";
import ColegiadosInternos from "./pages/ColegiadosInternos";
import ColegiadosInternosTipo from "./pages/ColegiadosInternosTipo";
import ConsultaColegiado from "./pages/ConsultaColegiado";
import EstadoInstanciasPage from "./pages/EstadoInstanciasPage";
import HistoricoReunioes from "./pages/HistoricoReunioes";
import Integrantes from "./pages/Integrantes";
import Publicacoes from "./pages/Publicacoes";
import { api } from "./services/api";

const ADMIN_SESSION_KEY = "colegiados_mps_admin_session";

const App = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminSession, setAdminSession] = useState(null);

  useEffect(() => {
    const savedSession = window.sessionStorage.getItem(ADMIN_SESSION_KEY);

    if (!savedSession) {
      return;
    }

    try {
      const parsedSession = JSON.parse(savedSession);

      if (!parsedSession?.token) {
        window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
        return;
      }

      api
        .get("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${parsedSession.token}`,
          },
        })
        .then((result) => {
          setAdminSession({
            token: parsedSession.token,
            user: result.user,
          });
        })
        .catch(() => {
          window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
          setAdminSession(null);
        });
    } catch (_error) {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
      setAdminSession(null);
    }
  }, []);

  const handleOpenAdmin = () => {
    if (adminSession?.token) {
      setAdminPanelOpen(true);
      return;
    }

    setLoginOpen(true);
  };

  const handleAuthenticated = (result) => {
    const nextSession = {
      token: result.token,
      user: result.user,
    };

    setAdminSession(nextSession);
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(nextSession));
    setLoginOpen(false);
    setAdminPanelOpen(true);
  };

  const handleLogout = () => {
    const token = adminSession?.token;

    if (token) {
      api
        .post(
          "/api/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        .catch(() => null);
    }

    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminSession(null);
    setAdminPanelOpen(false);
    setLoginOpen(false);
  };

  return (
    <HashRouter>
      <div className="app-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="app-main">
          <Header
            adminUser={adminSession?.user || null}
            onLogout={handleLogout}
            onOpenStatus={handleOpenAdmin}
            onToggleMenu={() => setMenuOpen((current) => !current)}
          />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/colegiados/internos" element={<ColegiadosInternos />} />
              <Route
                path="/colegiados/internos/tipo/:tipoSlug"
                element={<ColegiadosInternosTipo />}
              />
              <Route path="/colegiados/externos" element={<ColegiadosExternos />} />
              <Route path="/colegiados/:sigla/estado/:uf" element={<EstadoInstanciasPage />} />
              <Route path="/colegiados/:sigla" element={<ConsultaColegiado />} />
              <Route path="/integrantes" element={<Integrantes />} />
              <Route path="/calendario-reunioes" element={<CalendarioReunioes />} />
              <Route path="/historico-reunioes" element={<HistoricoReunioes />} />
              <Route path="/publicacoes" element={<Publicacoes />} />
            </Routes>
          </main>
        </div>
        <AdminLoginModal
          onAuthenticated={handleAuthenticated}
          onClose={() => setLoginOpen(false)}
          open={loginOpen}
        />
        <AdminPanel
          onClose={() => setAdminPanelOpen(false)}
          onLogout={handleLogout}
          open={adminPanelOpen}
          token={adminSession?.token || ""}
          user={adminSession?.user || null}
        />
      </div>
    </HashRouter>
  );
};

export default App;
