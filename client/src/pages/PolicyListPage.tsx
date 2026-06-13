import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPolicies } from '../api/client';
import type { Policy } from '../api/client';

interface Props {
  title: string;
  subtitle: string;
  categories: string[];
}

export default function PolicyListPage(props: Props) {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>(props.categories[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchPolicies({ limit: 30, category: activeCategory })
      .then(res => {
        setPolicies(res.data);
        setTotal(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div style={{ padding: '48px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={eyebrow}>{props.subtitle}</div>
          <h1 style={title}>{props.title}</h1>
          <p style={meta}>
            현재 <strong style={{ color: '#1F1A14', fontWeight: 600 }}>{total.toLocaleString()}건</strong>의 정책이 등록되어 있어요
          </p>
        </div>

        {props.categories.length > 1 ? (
          <div style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {props.categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={activeCategory === cat ? chipActive : chip}
              >
                {cat}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div style={emptyMessage}>불러오는 중...</div>
        ) : policies.length === 0 ? (
          <div style={emptyMessage}>이 카테고리의 정책이 아직 없어요.</div>
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

const chip: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 999, border: '1px solid #D9CDB6',
  backgroundColor: '#FBF8F1', color: '#1F1A14', cursor: 'pointer',
  fontSize: 13, fontFamily: 'inherit',
};

const chipActive: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 999, border: '1px solid #1F1A14',
  backgroundColor: '#1F1A14', color: '#F5F0E6', cursor: 'pointer',
  fontSize: 13, fontFamily: 'inherit',
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