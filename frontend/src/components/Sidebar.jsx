import {
  HiOutlineBriefcase,
  HiOutlineClipboardDocumentList,
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
