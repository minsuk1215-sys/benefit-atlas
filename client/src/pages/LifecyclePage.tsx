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
  { key: 'birth',  label: '출생·임신',  emoji: '🌱', description: '임신부터 영아까지' },
  { key: 'care',   label: '돌봄·보육',  emoji: '🌿', description: '유아·아동 양육' },
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

  useEffect(() => {
    setLoading(true);
    api.get('/api/policies', { params: { limit: 30, lifecycle: activeStage } })
      .then(res => setPolicies(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeStage]);

  const currentStage = STAGES.find(s => s.key === activeStage);

  return (
    <div style={{ padding: '48px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={eyebrow}>생애주기별 안내</div>
          <h1 style={title}>
            지금 이 시점의 혜택을 찾아보세요
          </h1>
          <p style={meta}>
            인생의 단계마다 받을 수 있는 정부 정책을 모았어요
          </p>
        </div>

        <div style={stageGrid}>
          {STAGES.map(stage => {
            const isActive = activeStage === stage.key;
            return (
              <button
                key={stage.key}
                onClick={() => setActiveStage(stage.key)}
                style={isActive ? stageCardActive : stageCard}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>{stage.emoji}</div>
                <div style={isActive ? stageLabelActive : stageLabel}>
                  {stage.label}
                </div>
                <div style={isActive ? stageDescActive : stageDesc}>
                  {stage.description}
                </div>
                <div style={isActive ? stageCountActive : stageCount}>
                  {counts[stage.key] !== undefined
                    ? counts[stage.key].toLocaleString() + '건'
                    : ''}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #E8E0CF' }}>
          <h2 style={subtitle}>
            <span style={{ fontStyle: 'italic', color: '#2F5D3F' }}>
              {currentStage?.label}
            </span>
            {' 단계의 정책'}
          </h2>
        </div>

        {loading ? (
          <div style={emptyMessage}>불러오는 중...</div>
        ) : policies.length === 0 ? (
          <div style={emptyMessage}>이 단계의 정책이 없어요.</div>
        ) : (
          <div style={gridStyle}>
            {policies.map(p => (
              <div key={p.ID} style={cardStyle} onClick={() => navigate('/policy/' + p.ID)}>
                <div style={cardCategory}>{p.CATEGORY}</div>
                <h3 style={cardTitle}>{p.TITLE}</h3>
                <div style={cardOrg}>{p.ORG}</div>
                <div style={cardFoot}>
                  <span style={agePill}>
                    {p.TARGET_AGE_MIN || p.TARGET_AGE_MAX
                      ? (p.TARGET_AGE_MIN || '제한없음') + '~' + (p.TARGET_AGE_MAX || '제한없음') + '세'
                      : '연령 무관'}
                  </span>
                </div>
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

const subtitle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 24, fontWeight: 500, color: '#1F1A14',
  margin: 0, marginTop: 16, letterSpacing: '-0.01em',
};

const stageGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12, marginBottom: 48,
};

const stageCard: React.CSSProperties = {
  padding: '28px 18px', border: '1px solid #D9CDB6',
  backgroundColor: '#FBF8F1', color: '#1F1A14',
  borderRadius: 18, cursor: 'pointer', fontFamily: 'inherit',
  textAlign: 'left', transition: 'all 0.2s ease',
};

const stageCardActive: React.CSSProperties = {
  padding: '28px 18px', border: '1px solid #1F1A14',
  backgroundColor: '#1F1A14', color: '#F5F0E6',
  borderRadius: 18, cursor: 'pointer', fontFamily: 'inherit',
  textAlign: 'left', transition: 'all 0.2s ease',
  transform: 'translateY(-2px)',
  boxShadow: '0 8px 24px rgba(31, 26, 20, 0.15)',
};

const stageLabel: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 18, fontWeight: 500, marginBottom: 6, color: '#1F1A14',
};

const stageLabelActive: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 18, fontWeight: 500, marginBottom: 6, color: '#F5F0E6',
};

const stageDesc: React.CSSProperties = {
  fontSize: 12, color: '#8A7F6D', marginBottom: 12,
};

const stageDescActive: React.CSSProperties = {
  fontSize: 12, color: '#CFC4B0', marginBottom: 12,
};

const stageCount: React.CSSProperties = {
  fontSize: 13, fontStyle: 'italic', color: '#C85A3C',
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
};

const stageCountActive: React.CSSProperties = {
  fontSize: 13, fontStyle: 'italic', color: '#E07A5C',
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
};

const emptyMessage: React.CSSProperties = {
  padding: 60, textAlign: 'center', color: '#8A7F6D',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FBF8F1', border: '1px solid #D9CDB6', borderRadius: 16,
  padding: 20, cursor: 'pointer',
  display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180,
  transition: 'all 0.15s ease',
};

const cardCategory: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.15em',
  textTransform: 'uppercase', fontWeight: 500,
};

const cardTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 18, fontWeight: 500, color: '#1F1A14',
  lineHeight: 1.3, letterSpacing: '-0.01em', margin: 0,
};

const cardOrg: React.CSSProperties = {
  fontSize: 13, color: '#4A4136',
};

const cardFoot: React.CSSProperties = {
  marginTop: 'auto', display: 'flex', gap: 6,
};

const agePill: React.CSSProperties = {
  display: 'inline-block', padding: '4px 12px', borderRadius: 999,
  backgroundColor: '#F5F0E6', border: '1px solid #E8E0CF',
  fontSize: 11, color: '#4A4136',
};