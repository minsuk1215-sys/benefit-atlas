import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Policy } from '../api/client';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = location.state?.profile;

  const [policies, setPolicies] = useState<(Policy & { _score: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      navigate('/search');
      return;
    }

    api.post('/api/recommend', profile)
      .then(res => setPolicies(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  if (!profile) return null;

  return (
    <div style={{ padding: '40px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/search')}
          style={{
            background: 'none',
            border: 'none',
            color: '#4A4136',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '8px 0',
            fontFamily: 'inherit',
            marginBottom: '16px',
          }}
        >
          ← 조건 수정
        </button>

        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px', color: '#1F1A14', margin: 0, fontWeight: 500 }}>
            당신을 위한 <span style={{ color: '#2F5D3F', fontStyle: 'italic' }}>{policies.length}개</span>의 혜택
          </h2>
          <p style={{ color: '#4A4136', marginTop: '8px', fontSize: '14px' }}>
            만 {profile.age}세
            {profile.job && ` · ${profile.job}`}
            {profile.region && ` · ${profile.region}`}
            {profile.children && profile.children !== '없음' && ` · 자녀 ${profile.children}`}
          </p>
        </div>

        {loading && <div style={{ padding: '40px', textAlign: 'center' }}>맞춤 혜택을 찾고 있어요...</div>}

        {!loading && policies.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8A7F6D' }}>
            조건에 맞는 혜택을 찾지 못했어요. 조건을 조금 완화해보세요.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {policies.map((p, idx) => (
            <div
              key={p.ID}
              onClick={() => p.APPLY_URL && window.open(p.APPLY_URL, '_blank')}
              style={{
                backgroundColor: '#FBF8F1',
                border: '1px solid #D9CDB6',
                borderRadius: '18px',
                padding: '20px 24px',
                cursor: 'pointer',
                display: 'grid',
                gridTemplateColumns: '50px 1fr auto',
                gap: '20px',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '24px', fontStyle: 'italic', color: '#C85A3C', fontWeight: 500 }}>
                {idx + 1}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#C85A3C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 500 }}>
                  {p.CATEGORY}
                </div>
                <h4 style={{ margin: 0, fontSize: '18px', color: '#1F1A14', fontWeight: 500, marginBottom: '6px' }}>
                  {p.TITLE}
                </h4>
                <div style={{ fontSize: '13px', color: '#4A4136' }}>{p.ORG}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#8A7F6D', marginBottom: '4px' }}>매칭 점수</div>
                <div style={{ fontSize: '22px', color: '#2F5D3F', fontStyle: 'italic', fontWeight: 500 }}>
                  {p._score}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}