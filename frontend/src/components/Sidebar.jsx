import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Dashboard" },
  { to: "/colegiados/internos", label: "Colegiados Internos" },
  { to: "/colegiados/externos", label: "Colegiados Externos" },
  { to: "/integrantes", label: "Integrantes" },
  { to: "/calendario-reunioes", label: "Calendario de Reunioes" },
  { to: "/historico-reunioes", label: "Historico de Reunioes" },
  { to: "/publicacoes", label: "Publicacoes" },
];

const Sidebar = ({ open, onClose }) => (
  <>
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-brand">
        <span className="brand-mark">MPS</span>
        <div>
          <strong>Colegiados</strong>
          <p>Painel institucional</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>

    {open ? <button className="sidebar-backdrop" onClick={onClose} /> : null}
  </>
);

export default Sidebar;
