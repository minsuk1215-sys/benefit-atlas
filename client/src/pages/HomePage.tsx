import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPolicies } from '../api/client';
import type { Policy } from '../api/client';
import { loadProfile } from '../utils/storage';

export default function HomePage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setHasProfile(!!loadProfile());
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPolicies({ limit: 12, category: filterCategory || undefined })
      .then(res => {
        setPolicies(res.data);
        setTotal(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterCategory]);

  const categories = ['', '보육·교육', '주거·자립', '고용·창업', '건강·의료', '문화·여가', '생활안정', '농수산'];

  return (
    <div className="page">
      <div className="container">
        {/* 히어로 */}
        <section style={heroStyle}>
          <div className="page-eyebrow">맞춤형 공공서비스 큐레이션</div>
          <h1 style={heroTitleStyle}>
            나에게 오는 혜택,<br />
            <em style={heroEmStyle}>조용히 놓치지 않게.</em>
          </h1>
          <p style={heroSubStyle}>
            생애주기와 조건을 기반으로 흩어진 정부 정책을 한 곳에 모아드립니다.<br />
            현재 <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>
              {total.toLocaleString()}건
            </strong>의 공공정책이 등록되어 있습니다.
          </p>
          <div style={ctaRowStyle}>
            <button className="btn btn-primary" onClick={() => navigate('/search')}>
              내 혜택 찾기 →
            </button>
            {hasProfile ? (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const profile = loadProfile();
                  navigate('/result', { state: { profile } });
                }}
              >
                이전 추천 다시 보기
              </button>
            ) : null}
          </div>

          {/* 작은 통계 */}
          <div style={statsRowStyle}>
            <StatItem label="등록된 정책" value={total.toLocaleString()} />
            <StatItem label="생애주기 단계" value="5" />
            <StatItem label="공공 데이터 출처" value="3" suffix="기관" />
          </div>
        </section>

        {/* 카테고리 필터 */}
        <div style={filterSectionStyle}>
          <div className="label-caps" style={{ marginBottom: 12 }}>
            카테고리별 둘러보기
          </div>
          <div style={filterRowStyle}>
            {categories.map(cat => (
              <button
                key={cat || 'all'}
                onClick={() => setFilterCategory(cat)}
                className={'chip' + (filterCategory === cat ? ' chip-active' : '')}
              >
                {cat || '전체'}
              </button>
            ))}
          </div>
        </div>

        {/* 정책 그리드 */}
        <div style={gridStyle} className="fade-in" key={filterCategory}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
            : policies.map(p => <PolicyCard key={p.ID} policy={p} />)
          }
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div style={statItemStyle}>
      <div style={statValueStyle}>
        {value}
        {suffix ? <span style={{ fontSize: 13, color: 'var(--ink-faint)', marginLeft: 4 }}>{suffix}</span> : null}
      </div>
      <div style={statLabelStyle}>{label}</div>
    </div>
  );
}

function PolicyCard({ policy: p }: { policy: Policy }) {
  const navigate = useNavigate();
  const ageLabel = p.TARGET_AGE_MIN || p.TARGET_AGE_MAX
    ? (p.TARGET_AGE_MIN ?? '제한없음') + '~' + (p.TARGET_AGE_MAX ?? '제한없음') + '세'
    : '연령 무관';

  return (
    <div
      className="card card-clickable"
      style={cardStyle}
      onClick={() => navigate('/policy/' + p.ID)}
    >
      <div className="label-caps">{p.CATEGORY}</div>
      <h3 style={cardTitleStyle}>{p.TITLE}</h3>
      <div style={cardOrgStyle}>{p.ORG}</div>
      <div style={cardFootStyle}>
        <span style={agePillStyle}>{ageLabel}</span>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div style={{
      ...cardStyle,
      backgroundColor: 'var(--ivory-soft)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ height: 10, width: '40%', backgroundColor: 'var(--line)', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ height: 18, width: '90%', backgroundColor: 'var(--line)', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 12, width: '60%', backgroundColor: 'var(--line)', borderRadius: 4, marginTop: 'auto' }} />
    </div>
  );
}

const heroStyle: React.CSSProperties = {
  marginBottom: 56,
};

const heroTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 56,
  fontWeight: 500,
  lineHeight: 1.1,
  letterSpacing: '-0.02em',
  marginBottom: 24,
};

const heroEmStyle: React.CSSProperties = {
  fontStyle: 'italic',
  color: 'var(--green)',
  fontWeight: 500,
};

const heroSubStyle: React.CSSProperties = {
  color: 'var(--ink-soft)',
  fontSize: 16,
  lineHeight: 1.7,
  maxWidth: 560,
  marginBottom: 32,
};

const ctaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 48,
};

const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  marginTop: 24,
  borderTop: '1px solid var(--line-soft)',
  paddingTop: 24,
  maxWidth: 560,
};

const statItemStyle: React.CSSProperties = {
  flex: 1,
  paddingRight: 24,
};

const statValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 28,
  fontWeight: 500,
  color: 'var(--ink)',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--ink-faint)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginTop: 4,
};

const filterSectionStyle: React.CSSProperties = {
  marginBottom: 24,
};

const filterRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  minHeight: 180,
};

const cardTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 18,
  fontWeight: 500,
  color: 'var(--ink)',
  lineHeight: 1.3,
  letterSpacing: '-0.01em',
  margin: 0,
};

const cardOrgStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--ink-soft)',
};

const cardFootStyle: React.CSSProperties = {
  marginTop: 'auto',
  display: 'flex',
  gap: 6,
};

const agePillStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: 999,
  backgroundColor: 'var(--ivory)',
  border: '1px solid var(--line-soft)',
  fontSize: 11,
  color: 'var(--ink-soft)',
  letterSpacing: '0.02em',
};