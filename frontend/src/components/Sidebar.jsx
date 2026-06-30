import {
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineChartBarSquare,
  HiOutlineCircleStack,
  HiOutlineClipboardDocumentList,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineUsers,
} from "react-icons/hi2";
import SidebarItem from "./SidebarItem";

const items = [
  { to: "/", label: "Dashboard", icon: HiOutlineHome },
  {
    to: "/colegiados/internos",
    label: "Colegiados Internos",
    icon: HiOutlineClipboardDocumentList,
  },
  {
    to: "/colegiados/externos",
    label: "Colegiados Externos",
    icon: HiOutlineBriefcase,
  },
  { to: "/integrantes", label: "Integrantes", icon: HiOutlineUsers },
  {
    to: "/calendario-reunioes",
    label: "Calendario de Reunioes",
    icon: HiOutlineCalendarDays,
  },
  {
    to: "/historico-reunioes",
    label: "Historico de Reunioes",
    icon: HiOutlineDocumentText,
  },
  { to: "/publicacoes", label: "Publicacoes", icon: HiOutlineChartBarSquare },
  { to: "/status-base", label: "Status da Base", icon: HiOutlineCircleStack },
];

const Sidebar = ({ open, onClose }) => (
  <>
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-brand">
        <span className="brand-mark">MPS</span>
        <div>
          <strong>Colegiados</strong>
          <p>Painel institucional de consulta</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <SidebarItem key={item.to} {...item} onClose={onClose} />
        ))}
      </nav>
    </aside>

    {open ? <button className="sidebar-backdrop" onClick={onClose} /> : null}
  </>
);

export default Sidebar;
