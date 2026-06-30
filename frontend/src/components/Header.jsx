const Header = ({ onOpenAdmin, onToggleMenu }) => (
  <header className="topbar">
    <div>
      <p className="eyebrow">Ministerio da Previdencia Social</p>
      <h1>Colegiados - MPS</h1>
    </div>
    <div className="topbar-actions">
      <button
        aria-label="Abrir area tecnica de sincronizacao"
        className="gear-button"
        onClick={onOpenAdmin}
        type="button"
      >
        &#9881;
      </button>
      <button className="menu-button" onClick={onToggleMenu} type="button">
        Menu
      </button>
    </div>
  </header>
);

export default Header;
