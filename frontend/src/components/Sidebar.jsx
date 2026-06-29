import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Dashboard" },
  { to: "/colegiados", label: "Colegiados" },
  { to: "/membros", label: "Membros" },
  { to: "/reunioes", label: "Reunioes" },
  { to: "/publicacoes", label: "Publicacoes" },
  { to: "/importacoes", label: "Importacoes" },
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
