import { NavLink, Route, Routes } from 'react-router-dom';
import { GamePage } from './pages/GamePage';
import { RulesPage } from './pages/RulesPage';

function LinkedInIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3C4.17 3 3.5 3.72 3.5 4.67c0 .93.65 1.67 1.71 1.67h.02c1.1 0 1.77-.74 1.77-1.67C6.98 3.72 6.33 3 5.25 3ZM20.5 13.08c0-3.53-1.89-5.17-4.42-5.17-2.04 0-2.96 1.12-3.47 1.92V8.5H9.23c.04.88 0 11.5 0 11.5h3.38v-6.42c0-.34.03-.68.12-.92.27-.68.88-1.38 1.91-1.38 1.35 0 1.89 1.03 1.89 2.54V20H20v-6.92Z"
        fill="currentColor"
      />
    </svg>
  );
}

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">PIXEL OMOK</p>
          <h1>오목 대전</h1>
        </div>

        <div className="topbar-actions">
          <nav className="nav">
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/">
              게임
            </NavLink>
            <NavLink
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              to="/rules"
            >
              룰 보기
            </NavLink>
          </nav>

          <a
            aria-label="LinkedIn"
            className="icon-link"
            href="https://www.linkedin.com/in/front-bch/"
            rel="noreferrer"
            target="_blank"
          >
            <LinkedInIcon />
          </a>
        </div>
      </header>

      <main className="page-frame">
        <Routes>
          <Route element={<GamePage />} path="/" />
          <Route element={<RulesPage />} path="/rules" />
        </Routes>
      </main>
    </div>
  );
}

export default App;
