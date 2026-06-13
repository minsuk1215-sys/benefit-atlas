import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ResultPage from './pages/ResultPage';
import SavedPage from './pages/SavedPage';
import PolicyDetailPage from './pages/PolicyDetailPage';
import JobsPage from './pages/JobsPage';
import EducationPage from './pages/EducationPage';
import LifecyclePage from './pages/LifecyclePage';
import SchedulePage from './pages/SchedulePage';

function App() {
  return (
    <BrowserRouter>
      <Topbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/policy/:id" element={<PolicyDetailPage />} />
        <Route path="/lifecycle" element={<LifecyclePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/education" element={<EducationPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
      </Routes>
    </BrowserRouter>
  );
}

function Topbar() {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const menus = [
    { to: '/', label: '홈' },
    { to: '/search', label: '내 혜택 찾기' },
    { to: '/lifecycle', label: '생애주기' },
    { to: '/jobs', label: '일자리' },
    { to: '/education', label: '자녀교육' },
  ];

  return (
    <nav style={navStyle}>
      <div style={navInnerStyle}>
        <Link to="/" style={brandStyle}>
          <span style={brandIconStyle}>✦</span>
          <span>
            <span style={brandNameStyle}>BenefitAtlas</span>
            <span style={brandSubStyle}>생애맞춤</span>
          </span>
        </Link>

        <div style={menuStyle}>
          {menus.map(m => (
            <Link
              key={m.to}
              to={m.to}
              style={{
                ...navLinkStyle,
                ...(isActive(m.to) ? activeLinkStyle : {}),
              }}
            >
              {m.label}
            </Link>
          ))}
        </div>

        <div style={rightStyle}>
          <Link to="/schedule" style={iconLinkStyle} title="내 일정">📅</Link>
          <Link to="/saved" style={iconLinkStyle} title="관심 정책">♡</Link>
        </div>
      </div>
    </nav>
  );
}

const navStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 50,
  backgroundColor: 'rgba(245, 240, 230, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: '1px solid var(--line)',
};

const navInnerStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
  padding: '16px 24px',
  display: 'flex',
  alignItems: 'center',
  gap: 32,
};

const brandStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: 'var(--ink)',
  marginRight: 16,
};

const brandIconStyle: React.CSSProperties = {
  fontSize: 18,
  color: 'var(--terra)',
};

const brandNameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 20,
  fontWeight: 500,
  fontStyle: 'italic',
  display: 'block',
  lineHeight: 1.1,
};

const brandSubStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--ink-faint)',
  display: 'block',
};

const menuStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  flex: 1,
};

const navLinkStyle: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: 14,
  color: 'var(--ink-soft)',
  borderRadius: 999,
  transition: 'all 0.15s ease',
};

const activeLinkStyle: React.CSSProperties = {
  backgroundColor: 'var(--ink)',
  color: 'var(--ivory)',
};

const rightStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
};

const iconLinkStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  fontSize: 16,
  color: 'var(--ink-soft)',
  transition: 'all 0.15s ease',
};

export default App;