import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Colegiados from "./pages/Colegiados";
import Membros from "./pages/Membros";
import Reunioes from "./pages/Reunioes";
import Publicacoes from "./pages/Publicacoes";
import Importacoes from "./pages/Importacoes";

const App = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="app-main">
          <Header onToggleMenu={() => setMenuOpen((current) => !current)} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/colegiados" element={<Colegiados />} />
              <Route path="/membros" element={<Membros />} />
              <Route path="/reunioes" element={<Reunioes />} />
              <Route path="/publicacoes" element={<Publicacoes />} />
              <Route path="/importacoes" element={<Importacoes />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
