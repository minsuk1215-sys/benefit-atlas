import { useEffect, useState } from 'react';
import { fetchPolicies, checkHealth } from './api/client';
import type { Policy } from './api/client';
import './App.css';

function App() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthOk, setHealthOk] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');

  // 헬스 체크
  useEffect(() => {
    checkHealth()
      .then(() => setHealthOk(true))
      .catch(() => setHealthOk(false));
  }, []);

  // 정책 목록 로드
  useEffect(() => {
    setLoading(true);
    fetchPolicies({ limit: 12, category: filterCategory || undefined })
      .then(res => {
        setPolicies(res.data);
        setTotal(res.total);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [filterCategory]);

  const categories = ['', '보육·교육', '주거·자립', '고용·창업', '건강·의료', '문화·여가', '생활안정', '농수산'];

  return (
    <div style={{
      fontFamily: 'sans-serif',
      backgroundColor: '#F5F0E6',
      minHeight: '100vh',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ color: '#1F1A14', margin: 0, fontSize: '36px' }}>
                생애맞춤 <span style={{ color: '#2F5D3F', fontStyle: 'italic' }}>BenefitAtlas</span>
              </h1>
              <p style={{ color: '#4A4136', marginTop: '8px' }}>
                공공정책 {total.toLocaleString()}건이 당신을 기다립니다
              </p>
            </div>
            <div style={{ fontSize: '13px', color: '#8A7F6D' }}>
              백엔드: {healthOk ? '✅ 연결됨' : '❌ 끊김'}
            </div>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat || 'all'}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: '8px 18px',
                borderRadius: '999px',
                border: filterCategory === cat ? '1px solid #1F1A14' : '1px solid #D9CDB6',
                backgroundColor: filterCategory === cat ? '#1F1A14' : '#FBF8F1',
                color: filterCategory === cat ? '#F5F0E6' : '#1F1A14',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            >
              {cat || '전체'}
            </button>
          ))}
        </div>

        {/* 로딩 / 에러 */}
        {loading && <div style={{ padding: '40px', textAlign: 'center' }}>불러오는 중...</div>}
        {error && (
          <div style={{ padding: '20px', color: '#C85A3C', backgroundColor: '#FBF8F1', borderRadius: '12px' }}>
            ❌ 오류: {error}
          </div>
        )}

        {/* 정책 그리드 */}
        {!loading && !error && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {policies.map(p => (
              <div
                key={p.ID}
                style={{
                  backgroundColor: '#FBF8F1',
                  border: '1px solid #D9CDB6',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  minHeight: '180px',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = '#1F1A14';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#D9CDB6';
                }}
                onClick={() => p.APPLY_URL && window.open(p.APPLY_URL, '_blank')}
              >
                <div style={{
                  fontSize: '11px',
                  color: '#C85A3C',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}>
                  {p.CATEGORY}
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: '17px',
                  color: '#1F1A14',
                  lineHeight: 1.3,
                  fontWeight: 500,
                }}>
                  {p.TITLE}
                </h3>
                <div style={{ fontSize: '13px', color: '#4A4136' }}>{p.ORG}</div>
                <div style={{ marginTop: 'auto', fontSize: '12px', color: '#8A7F6D' }}>
                  {p.TARGET_AGE_MIN || p.TARGET_AGE_MAX
                    ? `대상: ${p.TARGET_AGE_MIN ?? '제한없음'}~${p.TARGET_AGE_MAX ?? '제한없음'}세 · `
                    : ''}
                  생애주기: {p.LIFECYCLE}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 더보기 안내 */}
        {!loading && policies.length > 0 && (
          <div style={{ marginTop: '32px', textAlign: 'center', color: '#8A7F6D', fontSize: '13px' }}>
            전체 {total.toLocaleString()}건 중 {policies.length}건 표시 (다음 STEP에서 페이지네이션 추가)
          </div>
        )}
      </div>
    </div>
  );
}

export default App;