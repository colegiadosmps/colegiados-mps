import { HiOutlineCog6Tooth } from "react-icons/hi2";

const Header = ({ onOpenStatus, onToggleMenu }) => (
  <header className="topbar">
    <div>
      <p className="eyebrow">Ministerio da Previdencia Social</p>
      <h1>Colegiados - MPS</h1>
    </div>
    <div className="topbar-actions">
      <button
        aria-label="Abrir status da base"
        className="icon-button"
        onClick={onOpenStatus}
        type="button"
      >
        <HiOutlineCog6Tooth />
      </button>
      <button className="menu-button" onClick={onToggleMenu} type="button">
        Menu
      </button>
    </div>
  </header>
);

export default Header;
