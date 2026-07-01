import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import StatusBasePanel from "./components/StatusBasePanel";
import Dashboard from "./pages/Dashboard";
import CalendarioReunioes from "./pages/CalendarioReunioes";
import ColegiadosExternos from "./pages/ColegiadosExternos";
import ColegiadosInternos from "./pages/ColegiadosInternos";
import ConsultaColegiado from "./pages/ConsultaColegiado";
import HistoricoReunioes from "./pages/HistoricoReunioes";
import Integrantes from "./pages/Integrantes";
import Publicacoes from "./pages/Publicacoes";

const App = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="app-main">
          <Header
            onOpenStatus={() => setStatusOpen(true)}
            onToggleMenu={() => setMenuOpen((current) => !current)}
          />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/colegiados/internos" element={<ColegiadosInternos />} />
              <Route path="/colegiados/externos" element={<ColegiadosExternos />} />
              <Route path="/colegiados/:sigla" element={<ConsultaColegiado />} />
              <Route path="/integrantes" element={<Integrantes />} />
              <Route path="/calendario-reunioes" element={<CalendarioReunioes />} />
              <Route path="/historico-reunioes" element={<HistoricoReunioes />} />
              <Route path="/publicacoes" element={<Publicacoes />} />
            </Routes>
          </main>
        </div>
        <StatusBasePanel onClose={() => setStatusOpen(false)} open={statusOpen} />
      </div>
    </BrowserRouter>
  );
};

export default App;
