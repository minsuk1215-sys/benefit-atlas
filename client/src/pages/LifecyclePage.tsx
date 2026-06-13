import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Policy } from '../api/client';

interface Stage {
  key: string;
  label: string;
  emoji: string;
  description: string;
}

const STAGES: Stage[] = [
  { key: 'birth',  label: '출생·임신',  emoji: '🌱', description: '임신부터 영아 단계까지' },
  { key: 'care',   label: '돌봄·보육',  emoji: '🌿', description: '유아·아동 양육 지원' },
  { key: 'youth',  label: '청년',        emoji: '🌳', description: '취업·주거·자립' },
  { key: 'marry',  label: '신혼·결혼',  emoji: '🌸', description: '결혼·신혼 정착' },
  { key: 'senior', label: '시니어',     emoji: '🍂', description: '중장년·노년기' },
];

export default function LifecyclePage() {
  const navigate = useNavigate();
  const [activeStage, setActiveStage] = useState<string>('youth');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // 각 단계별 정책 수 (한 번만 조회)
  useEffect(() => {
    Promise.all(
      STAGES.map(s =>
        api.get('/api/policies', { params: { limit: 1, lifecycle: s.key } })
          .then(r => ({ key: s.key, total: r.data.total }))
          .catch(() => ({ key: s.key, total: 0 }))
      )
    ).then(results => {
      const next: Record<string, number> = {};
      results.forEach(r => { next[r.key] = r.total; });
      setCounts(next);
    });
  }, []);

  // 선택한 단계 정책 조회
  useEffect(() => {
    setLoading(true);
    api.get('/api/policies', { params: { limit: 30, lifecycle: activeStage } })
      .then(res => setPolicies(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeStage]);

  return (
    <div style={{ padding: '40px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 11, color: '#C85A3C', letterSpacing: '0.2em',
            textTransform: 'uppercase', marginBottom: 16, fontWeight: 500,
          }}>
            생애주기별 안내
          </div>
          <h1 style={{
            fontSize: 44, color: '#1F1A14', margin: 0,
            lineHeight: 1.2, fontWeight: 500,
          }}>
            지금 <span style={{ color: '#2F5D3F', fontStyle: 'italic' }}>이 시점</span>의 혜택을 찾아보세요
          </h1>
          <p style={{ color: '#4A4136', marginTop: 16, fontSize: 15 }}>
            인생의 단계마다 받을 수 있는 정부 정책을 모았어요
          </p>
        </div>

        {/* 단계 카드 5개 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
          marginBottom: 40,
        }}>
          {STAGES.map(stage => {
            const isActive = activeStage === stage.key;
            return (
              <button
                key={stage.key}
                onClick={() => setActiveStage(stage.key)}
                style={{
                  padding: '24px 16px',
                  border: isActive ? '1px solid #1F1A14' : '1px solid #D9CDB6',
                  backgroundColor: isActive ? '#1F1A14' : '#FBF8F1',
                  color: isActive ? '#F5F0E6' : '#1F1A14',
                  borderRadius: 16,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'transform 0.15s',
                  transform: isActive ? 'translateY(-2px)' : 'none',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{stage.emoji}</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
                  {stage.label}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                  {stage.description}
                </div>
                <div style={{
                  fontSize: 12,
                  fontStyle: 'italic',
                  color: isActive ? '#CFC4B0' : '#8A7F6D',
                }}>
                  {counts[stage.key] !== undefined ? counts[stage.key].toLocaleString() + '건' : ''}
                </div>
              </button>
            );
          })}
        </div>

        {/* 선택한 단계의 정책 목록 */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{
            fontSize: 22, color: '#1F1A14', margin: 0, fontWeight: 500,
          }}>
            <span style={{ color: '#2F5D3F', fontStyle: 'italic' }}>
              {STAGES.find(s => s.key === activeStage)?.label}
            </span>
            {' 단계의 정책'}
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#8A7F6D' }}>
            불러오는 중...
          </div>
        ) : policies.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#8A7F6D' }}>
            이 단계의 정책이 없어요.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {policies.map(p => (
              <div
                key={p.ID}
                style={{
                  backgroundColor: '#FBF8F1',
                  border: '1px solid #D9CDB6',
                  borderRadius: 16,
                  padding: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  minHeight: 180,
                }}
                onClick={() => navigate('/policy/' + p.ID)}
              >
                <div style={{
                  fontSize: 11, color: '#C85A3C', letterSpacing: '0.1em',
                  textTransform: 'uppercase', fontWeight: 500,
                }}>
                  {p.CATEGORY}
                </div>
                <h3 style={{
                  margin: 0, fontSize: 17, color: '#1F1A14',
                  lineHeight: 1.3, fontWeight: 500,
                }}>
                  {p.TITLE}
                </h3>
                <div style={{ fontSize: 13, color: '#4A4136' }}>{p.ORG}</div>
                <div style={{ marginTop: 'auto', fontSize: 12, color: '#8A7F6D' }}>
                  {p.TARGET_AGE_MIN || p.TARGET_AGE_MAX
                    ? '대상: ' + (p.TARGET_AGE_MIN || '제한없음') + '~' + (p.TARGET_AGE_MAX || '제한없음') + '세'
                    : '대상: 일반'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}