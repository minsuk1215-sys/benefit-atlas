import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
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
      <div style={{
        fontFamily: 'sans-serif',
        backgroundColor: '#F5F0E6',
        minHeight: '100vh',
      }}>
        {/* 상단 네비게이션 */}
<nav style={{
  padding: '20px 40px',
  borderBottom: '1px solid #D9CDB6',
  backgroundColor: 'rgba(245, 240, 230, 0.92)',
  backdropFilter: 'blur(8px)',
  position: 'sticky',
  top: 0,
  zIndex: 10,
  display: 'flex',
  alignItems: 'baseline',
  gap: 24,
  flexWrap: 'wrap',
}}>
  <Link to="/" style={{
    fontSize: 22,
    fontWeight: 600,
    color: '#1F1A14',
    textDecoration: 'none',
    fontStyle: 'italic',
    marginRight: 16,
  }}>
    BenefitAtlas
  </Link>
  <Link to="/" style={navLink}>홈</Link>
  <Link to="/search" style={navLink}>내 혜택 찾기</Link>
  <Link to="/lifecycle" style={navLink}>생애주기</Link>
  <Link to="/jobs" style={navLink}>일자리</Link>
  <Link to="/education" style={navLink}>자녀교육</Link>
  <div style={{ flex: 1 }} />
  <Link to="/schedule" style={navLink}>📅 내 일정</Link>
<Link to="/saved" style={navLink}>♡ 관심 정책</Link>
</nav>

        {/* 페이지 라우팅 */}
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


      </div>
    </BrowserRouter>
  );
}
const navLink: React.CSSProperties = {
  color: '#4A4136',
  textDecoration: 'none',
  fontSize: 14,
  whiteSpace: 'nowrap',
};

export default App;