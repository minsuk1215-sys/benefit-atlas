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
        ids.map(id => api.get(`/api/policies/${id}`).then(r => r.data.data).catch(() => null))
      );
      setPolicies(results.filter(Boolean));
    } catch (err) {
      console.error(err);
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
    <div style={{ padding: '40px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '32px', color: '#1F1A14', marginTop: 0, fontWeight: 500 }}>
          관심 <span style={{ color: '#C85A3C', fontStyle: 'italic' }}>정책</span>
        </h2>
        <p style={{ color: '#4A4136', marginTop: '8px', marginBottom: '32px', fontSize: '14px' }}>
          저장한 정책 {policies.length}건
        </p>

        {loading && <div style={{ padding: '40px', textAlign: 'center' }}>불러오는 중...</div>}

        {!loading && policies.length === 0 && (
          <div style={{ padding: '100px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', color: '#D9CDB6', marginBottom: '16px' }}>♡</div>
            <h3 style={{ fontSize: '20px', color: '#1F1A14', marginBottom: '12px', fontWeight: 500 }}>
              아직 저장한 정책이 없어요
            </h3>
            <p style={{ fontSize: '14px', color: '#4A4136', marginBottom: '24px' }}>
              관심 있는 정책의 ♡를 눌러 저장해보세요.
            </p>
            <button
              onClick={() => navigate('/search')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#1F1A14',
                color: '#F5F0E6',
                border: 'none',
                borderRadius: '999px',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              내 혜택 찾기 →
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {policies.map(p => (
            <div
              key={p.ID}
              style={{
                backgroundColor: '#FBF8F1',
                border: '1px solid #D9CDB6',
                borderRadius: '18px',
                padding: '20px 24px',
                display: 'grid',
                gridTemplateColumns: '1fr 50px',
                gap: '20px',
                alignItems: 'center',
              }}
            >
              <div
                onClick={() => navigate(`/policy/${p.ID}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ fontSize: '11px', color: '#C85A3C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 500 }}>
                  {p.CATEGORY}
                </div>
                <h4 style={{ margin: 0, fontSize: '18px', color: '#1F1A14', fontWeight: 500, marginBottom: '6px' }}>
                  {p.TITLE}
                </h4>
                <div style={{ fontSize: '13px', color: '#4A4136' }}>{p.ORG}</div>
              </div>
              <button
                onClick={() => handleUnsave(p.ID)}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '1px solid #C85A3C',
                  backgroundColor: '#C85A3C',
                  color: '#F5F0E6',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontFamily: 'inherit',
                }}
              >
                ♡
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}