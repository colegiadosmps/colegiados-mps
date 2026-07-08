import { useState } from "react";
import { HiOutlineCog6Tooth } from "react-icons/hi2";

const Header = ({ adminUser, onLogout, onOpenStatus, onToggleMenu }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Ministerio da Previdencia Social</p>
        <h1>Colegiados - MPS</h1>
      </div>
      <div className="topbar-actions">
        {adminUser ? (
          <div className="user-chip-wrapper">
            <button
              className="user-chip"
              onClick={() => setUserMenuOpen((current) => !current)}
              type="button"
            >
              <span className="user-chip__dot" />
              <span>Ola, {adminUser.primeiroNome}</span>
            </button>
            {userMenuOpen ? (
              <div className="user-chip__menu">
                <button
                  className="text-button user-chip__menu-action"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                  type="button"
                >
                  Sair do sistema
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          aria-label="Abrir acesso administrativo"
          className="status-button"
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
};

export default Header;
