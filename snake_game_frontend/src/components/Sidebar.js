import React from "react";

/**
 * PUBLIC_INTERFACE
 * Sidebar displays all UI to the left of the game canvas (settings, leaderboard, multiplayer lobby, user).
 * @param {Object} props
 */
function Sidebar({
  user,
  onLogout,
  children,
  settingsPanel,
  leaderboardPanel,
  multiplayerPanel,
  style = {}
}) {
  return (
    <aside className="sidebar" style={style}>
      <div>
        {user && (
          <div className="panel-section" style={{ marginBottom: 10, marginTop: 6 }}>
            <div className="panel-label" style={{ fontSize: 15 }}>
              Welcome,
            </div>
            <div className="user-hello">{user}</div>
            <button type="button" className="button minimal" onClick={onLogout}>
              Log out
            </button>
          </div>
        )}
        {settingsPanel}
        {multiplayerPanel}
        {leaderboardPanel}
      </div>
      <footer className="footer" style={{ textAlign: "left", marginTop: 22 }}>
        <span style={{ color: "var(--color-secondary)", opacity: 0.7 }}>
          Multiplayer Snake &copy; 2024
        </span>
      </footer>
      {children}
    </aside>
  );
}

export default Sidebar;
