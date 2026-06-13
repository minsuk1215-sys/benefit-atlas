import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ResultPage from './pages/ResultPage';

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
          gap: '24px',
        }}>
          <Link to="/" style={{
            fontSize: '22px',
            fontWeight: 600,
            color: '#1F1A14',
            textDecoration: 'none',
            fontStyle: 'italic',
          }}>
            BenefitAtlas
          </Link>
          <Link to="/" style={{ color: '#4A4136', textDecoration: 'none', fontSize: '14px' }}>홈</Link>
          <Link to="/search" style={{ color: '#4A4136', textDecoration: 'none', fontSize: '14px' }}>내 혜택 찾기</Link>
        </nav>

        {/* 페이지 라우팅 */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/result" element={<ResultPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;