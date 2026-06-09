import { useEffect, useState } from 'react';
import { checkHealth } from './api/client';
import './App.css';

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth()
      .then(data => setHealth(data))
      .catch(err => setError(err.message));
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#2F5D3F' }}>BenefitAtlas</h1>
      <p style={{ color: '#666' }}>생애맞춤 주민혜택 플랫폼 · 개발 진행 중</p>

      <div style={{
        marginTop: '32px',
        padding: '20px',
        backgroundColor: '#F5F0E6',
        borderRadius: '12px',
        border: '1px solid #D9CDB6'
      }}>
        <h3 style={{ marginTop: 0 }}>백엔드 연결 상태</h3>
        {error && (
          <div style={{ color: '#C85A3C' }}>
            ❌ 연결 실패: {error}
          </div>
        )}
        {health && (
          <div>
            <div>✅ 상태: <strong>{health.status}</strong></div>
            <div>📡 서비스: {health.service}</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '8px' }}>
              마지막 확인: {new Date(health.timestamp).toLocaleString('ko-KR')}
            </div>
          </div>
        )}
        {!health && !error && <div>연결 중...</div>}
      </div>
    </div>
  );
}

export default App;