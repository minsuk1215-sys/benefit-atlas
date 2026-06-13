import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPolicies } from '../api/client';
import type { Policy } from '../api/client';

export default function HomePage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPolicies({ limit: 12, category: filterCategory || undefined })
      .then(res => {
        setPolicies(res.data);
        setTotal(res.total);
      })
      .catch(console.error);
  }, [filterCategory]);

  const categories = ['', '보육·교육', '주거·자립', '고용·창업', '건강·의료', '문화·여가', '생활안정', '농수산'];

  return (
    <div style={{ padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 히어로 섹션 */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#C85A3C', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 500 }}>
            맞춤형 공공서비스 큐레이션
          </div>
          <h1 style={{ fontSize: '52px', color: '#1F1A14', margin: 0, lineHeight: 1.1, fontWeight: 500 }}>
            나에게 오는 혜택,<br />
            <span style={{ color: '#2F5D3F', fontStyle: 'italic' }}>조용히 놓치지 않게.</span>
          </h1>
          <p style={{ color: '#4A4136', marginTop: '20px', fontSize: '16px', maxWidth: '560px', lineHeight: 1.6 }}>
            생애주기와 조건을 기반으로 흩어진 정부 정책을 한 곳에 모아드립니다.
            현재 <strong>{total.toLocaleString()}건</strong>의 공공정책이 등록되어 있습니다.
          </p>
          <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/search')}
              style={{
                padding: '14px 28px',
                backgroundColor: '#1F1A14',
                color: '#F5F0E6',
                border: 'none',
                borderRadius: '999px',
                fontSize: '15px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 500,
              }}
            >
              내 혜택 찾기 →
            </button>
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

        {/* 정책 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {policies.map(p => (
            <PolicyCard key={p.ID} policy={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PolicyCard({ policy: p }: { policy: Policy }) {
  return (
    <div
      style={{
        backgroundColor: '#FBF8F1',
        border: '1px solid #D9CDB6',
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minHeight: '180px',
      }}
      onClick={() => p.APPLY_URL && window.open(p.APPLY_URL, '_blank')}
    >
      <div style={{ fontSize: '11px', color: '#C85A3C', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
        {p.CATEGORY}
      </div>
      <h3 style={{ margin: 0, fontSize: '17px', color: '#1F1A14', lineHeight: 1.3, fontWeight: 500 }}>
        {p.TITLE}
      </h3>
      <div style={{ fontSize: '13px', color: '#4A4136' }}>{p.ORG}</div>
      <div style={{ marginTop: 'auto', fontSize: '12px', color: '#8A7F6D' }}>
        {p.TARGET_AGE_MIN || p.TARGET_AGE_MAX
          ? `대상: ${p.TARGET_AGE_MIN ?? '제한없음'}~${p.TARGET_AGE_MAX ?? '제한없음'}세`
          : '대상: 일반'}
      </div>
    </div>
  );
}