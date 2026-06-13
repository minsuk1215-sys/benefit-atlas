import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Policy } from '../api/client';
import { getSavedPolicies, toggleSavedPolicy } from '../utils/storage';

export default function SavedPage() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = async () => {
    const ids = getSavedPolicies();
    if (ids.length === 0) {
      setPolicies([]);
      setLoading(false);
      return;
    }
    try {
      const results = await Promise.all(
        ids.map(id => api.get('/api/policies/' + id).then(r => r.data.data).catch(() => null))
      );
      setPolicies(results.filter(Boolean));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const handleUnsave = (id: string) => {
    toggleSavedPolicy(id);
    setPolicies(prev => prev.filter(p => p.ID !== id));
  };

  return (
    <div style={{ padding: '48px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={eyebrow}>저장한 혜택 모음</div>
          <h1 style={title}>관심 정책</h1>
          <p style={meta}>
            저장한 정책 <strong style={{ color: '#1F1A14', fontWeight: 600 }}>{policies.length}건</strong>
          </p>
        </div>

        {loading ? (
          <div style={loadingStyle}>불러오는 중...</div>
        ) : policies.length === 0 ? (
          <div style={emptyStyle}>
            <div style={{ fontSize: 48, color: '#D9CDB6', marginBottom: 16 }}>♡</div>
            <h3 style={emptyTitle}>아직 저장한 정책이 없어요</h3>
            <p style={emptyText}>관심 있는 정책의 ♡를 눌러 저장해보세요.</p>
            <button onClick={() => navigate('/search')} style={btnPrimary}>
              내 혜택 찾기
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {policies.map(p => (
              <div key={p.ID} style={cardStyle}>
                <div onClick={() => navigate('/policy/' + p.ID)} style={{ cursor: 'pointer' }}>
                  <div style={cardCategory}>{p.CATEGORY}</div>
                  <h4 style={cardTitle}>{p.TITLE}</h4>
                  <div style={cardOrg}>{p.ORG}</div>
                </div>
                <button onClick={() => handleUnsave(p.ID)} style={btnHeart}>♡</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.2em',
  textTransform: 'uppercase', marginBottom: 16, fontWeight: 500,
};

const title: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 44, fontWeight: 500, color: '#1F1A14',
  margin: 0, marginBottom: 16, lineHeight: 1.15, letterSpacing: '-0.015em',
};

const meta: React.CSSProperties = {
  color: '#4A4136', fontSize: 15,
};

const loadingStyle: React.CSSProperties = {
  padding: 80, textAlign: 'center', color: '#8A7F6D',
};

const emptyStyle: React.CSSProperties = {
  padding: '100px 20px', textAlign: 'center',
  backgroundColor: '#FBF8F1', border: '1px dashed #D9CDB6', borderRadius: 18,
};

const emptyTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 22, fontWeight: 500, color: '#1F1A14', marginBottom: 12,
};

const emptyText: React.CSSProperties = {
  fontSize: 14, color: '#4A4136', marginBottom: 24, lineHeight: 1.6,
};

const btnPrimary: React.CSSProperties = {
  padding: '12px 24px', backgroundColor: '#1F1A14', color: '#F5F0E6',
  border: 'none', borderRadius: 999, fontSize: 14, cursor: 'pointer',
  fontFamily: 'inherit',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FBF8F1', border: '1px solid #D9CDB6',
  borderRadius: 18, padding: '20px 24px',
  display: 'grid', gridTemplateColumns: '1fr 48px',
  gap: 20, alignItems: 'center',
};

const cardCategory: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.15em',
  textTransform: 'uppercase', marginBottom: 6, fontWeight: 500,
};

const cardTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 19, fontWeight: 500, color: '#1F1A14',
  margin: 0, marginBottom: 6, letterSpacing: '-0.01em',
};

const cardOrg: React.CSSProperties = {
  fontSize: 13, color: '#4A4136',
};

const btnHeart: React.CSSProperties = {
  width: 44, height: 44, borderRadius: '50%',
  border: '1px solid #C85A3C', backgroundColor: '#C85A3C',
  color: '#F5F0E6', cursor: 'pointer', fontSize: 18,
  fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};