import { NavLink, Route, Routes } from 'react-router-dom';
import { GamePage } from './pages/GamePage';
import { RulesPage } from './pages/RulesPage';

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">PIXEL OMOK</p>
          <h1>오목 대전</h1>
        </div>
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
