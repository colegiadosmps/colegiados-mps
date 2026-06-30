const Header = ({ onToggleMenu }) => (
  <header className="topbar">
    <div>
      <p className="eyebrow">Ministerio da Previdencia Social</p>
      <h1>Colegiados - MPS</h1>
    </div>
    <div className="topbar-actions">
      <button className="menu-button" onClick={onToggleMenu} type="button">
        Menu
      </button>
    </div>
  </header>
);

export default Header;
