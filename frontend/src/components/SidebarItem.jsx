import { NavLink } from "react-router-dom";

const SidebarItem = ({ icon: Icon, label, onClose, to }) => (
  <NavLink
    to={to}
    onClick={onClose}
    className={({ isActive }) =>
      `sidebar-item ${isActive ? "active" : ""}`
    }
  >
    <span className="sidebar-item__icon">
      <Icon />
    </span>
    <span>{label}</span>
  </NavLink>
);

export default SidebarItem;
