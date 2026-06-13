import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPolicies } from '../api/client';
import type { Policy } from '../api/client';

interface Props {
  title: string;
  subtitle: string;
  accentColor: string;
  categories: string[];
}

export default function PolicyListPage({ title, subtitle, accentColor, categories }: Props) {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);
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
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ ...labelStyle, color: accentColor }}>{subtitle}</div>
          <h1 style={titleStyle}>{title}</h1>
          <p style={metaStyle}>
            현재 <strong>{total.toLocaleString()}건</strong>의 정책이 등록되어 있어요
          </p>
        </div>

        {categories.length > 1 ? (
          <div style={filterRowStyle}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={activeCategory === cat ? chipActiveStyle : chipStyle}
              >
                {cat}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div style={emptyStyle}>불러오는 중...</div>
        ) : policies.length === 0 ? (
          <div style={emptyStyle}>이 카테고리의 정책이 아직 없어요.</div>
        ) : (
          <div style={gridStyle}>
            {policies.map(p => (
              <div key={p.ID} style={cardStyle} onClick={() => navigate('/policy/' + p.ID)}>
                <div style={{ fontSize: 11, color: accentColor, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
                  {p.CATEGORY}
                </div>
                <h3 style={cardTitleStyle}>{p.TITLE}</h3>
                <div style={{ fontSize: 13, color: '#4A4136' }}>{p.ORG}</div>
                <div style={cardMetaStyle}>
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

const pageStyle: React.CSSProperties = { padding: '40px 20px' };
const containerStyle: React.CSSProperties = { maxWidth: 1200, margin: '0 auto' };
const labelStyle: React.CSSProperties = {
  fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
  marginBottom: 16, fontWeight: 500,
};
const titleStyle: React.CSSProperties = {
  fontSize: 44, color: '#1F1A14', margin: 0, lineHeight: 1.2, fontWeight: 500,
};
const metaStyle: React.CSSProperties = {
  color: '#4A4136', marginTop: 16, fontSize: 15,
};
const filterRowStyle: React.CSSProperties = {
  marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap',
};
const chipStyle: React.CSSProperties = {
  padding: '8px 18px', borderRadius: 999, border: '1px solid #D9CDB6',
  backgroundColor: '#FBF8F1', color: '#1F1A14', cursor: 'pointer',
  fontSize: 14, fontFamily: 'inherit',
};
const chipActiveStyle: React.CSSProperties = {
  padding: '8px 18px', borderRadius: 999, border: '1px solid #1F1A14',
  backgroundColor: '#1F1A14', color: '#F5F0E6', cursor: 'pointer',
  fontSize: 14, fontFamily: 'inherit',
};
const gridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16,
};
const cardStyle: React.CSSProperties = {
  backgroundColor: '#FBF8F1', border: '1px solid #D9CDB6', borderRadius: 16,
  padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column',
  gap: 10, minHeight: 180,
};
const cardTitleStyle: React.CSSProperties = {
  margin: 0, fontSize: 17, color: '#1F1A14', lineHeight: 1.3, fontWeight: 500,
};
const cardMetaStyle: React.CSSProperties = {
  marginTop: 'auto', fontSize: 12, color: '#8A7F6D',
};
const emptyStyle: React.CSSProperties = {
  padding: 60, textAlign: 'center', color: '#8A7F6D',
};