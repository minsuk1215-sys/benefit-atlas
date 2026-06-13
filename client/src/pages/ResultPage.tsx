import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Policy } from '../api/client';
import { toggleSavedPolicy, getSavedPolicies } from '../utils/storage';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = location.state?.profile;

  const [policies, setPolicies] = useState<(Policy & { _score: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(getSavedPolicies());
  }, []);

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

  const handleToggleSave = (policyId: string) => {
    const next = toggleSavedPolicy(policyId);
    setSavedIds(next);
  };

  // 프로필 요약 칩 만들기
  const profileChips: string[] = [];
  if (profile.age) profileChips.push('만 ' + profile.age + '세');
  if (profile.gender && profile.gender !== '선택안함') profileChips.push(profile.gender);
  if (profile.job) profileChips.push(profile.job);
  if (profile.region) profileChips.push(profile.region);
  if (profile.marriage) profileChips.push(profile.marriage);
  if (profile.children && profile.children !== '없음') {
    profileChips.push('자녀 ' + profile.children);
  }

  return (
    <div className="page">
      <div className="container-narrow" style={{ maxWidth: 880 }}>
        <button onClick={() => navigate('/search')} style={backBtnStyle}>
          ← 조건 수정
        </button>

        {/* 헤더 */}
        <div style={{ marginBottom: 40 }}>
          <div className="page-eyebrow">맞춤 추천 결과</div>
          <h1 style={titleStyle}>
            당신을 위한 <em style={emStyle}>{policies.length}개</em>의 혜택
          </h1>

          {/* 프로필 요약 칩 */}
          <div style={chipWrapStyle}>
            {profileChips.map((chip, i) => (
              <span key={i} style={profileChipStyle}>{chip}</span>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={loadingStyle}>
            <div style={{ fontSize: 13, color: 'var(--ink-faint)', letterSpacing: '0.05em' }}>
              맞춤 혜택을 찾고 있어요...
            </div>
          </div>
        ) : null}

        {!loading && policies.length === 0 ? (
          <div style={emptyStyle}>
            <div style={{ fontSize: 48, color: 'var(--line)', marginBottom: 16 }}>✦</div>
            <h3 style={emptyTitleStyle}>조건에 맞는 혜택이 없어요</h3>
            <p style={emptyTextStyle}>
              조건을 조금 완화하거나 다른 필터를 시도해보세요.
            </p>
            <button onClick={() => navigate('/search')} className="btn btn-primary">
              조건 다시 입력
            </button>
          </div>
        ) : null}

        <div className="fade-in" style={listStyle}>
          {policies.map((p, idx) => {
            const isSaved = savedIds.includes(p.ID);
            return (
              <article key={p.ID} style={itemStyle}>
                {/* 순위 */}
                <div style={rankStyle}>
                  <div style={rankNumStyle}>{idx + 1}</div>
                  {idx < 3 ? <div style={topBadgeStyle}>TOP</div> : null}
                </div>

                {/* 내용 (클릭 가능) */}
                <div
                  onClick={() => navigate('/policy/' + p.ID)}
                  style={contentStyle}
                >
                  <div className="label-caps" style={{ marginBottom: 6 }}>
                    {p.CATEGORY}
                  </div>
                  <h4 style={cardTitleStyle}>{p.TITLE}</h4>
                  <div style={cardMetaStyle}>
                    {p.ORG}
                    {p.TARGET_AGE_MIN || p.TARGET_AGE_MAX ? (
                      <span style={{ color: 'var(--ink-faint)' }}>
                        {' · 만 '}{p.TARGET_AGE_MIN ?? '제한없음'}~{p.TARGET_AGE_MAX ?? '제한없음'}세
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* 점수 */}
                <div style={scoreColStyle}>
                  <div style={scoreLabelStyle}>매칭</div>
                  <div style={scoreValueStyle}>{p._score}</div>
                </div>

                {/* ♡ 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSave(p.ID);
                  }}
                  style={isSaved ? heartActiveStyle : heartStyle}
                  aria-label={isSaved ? '저장 취소' : '관심 저장'}
                >
                  ♡
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#4A4136',
  fontSize: 13,
  cursor: 'pointer',
  padding: '8px 0',
  fontFamily: 'inherit',
  marginBottom: 16,
  letterSpacing: '0.02em',
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 40,
  fontWeight: 500,
  color: '#1F1A14',
  lineHeight: 1.2,
  letterSpacing: '-0.015em',
  margin: 0,
  marginBottom: 20,
};

const emStyle: React.CSSProperties = {
  fontStyle: 'italic',
  color: '#2F5D3F',
  fontWeight: 500,
};

const chipWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
};

const profileChipStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '5px 12px',
  borderRadius: 999,
  backgroundColor: 'transparent',
  border: '1px solid #D9CDB6',
  fontSize: 12,
  color: '#4A4136',
  letterSpacing: '0.02em',
};

const loadingStyle: React.CSSProperties = {
  padding: '80px 20px',
  textAlign: 'center',
};

const emptyStyle: React.CSSProperties = {
  padding: '80px 20px',
  textAlign: 'center',
  backgroundColor: '#FBF8F1',
  border: '1px dashed #D9CDB6',
  borderRadius: 18,
};

const emptyTitleStyle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 22,
  color: '#1F1A14',
  marginBottom: 12,
  fontWeight: 500,
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#4A4136',
  marginBottom: 24,
  lineHeight: 1.6,
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const itemStyle: React.CSSProperties = {
  backgroundColor: '#FBF8F1',
  border: '1px solid #D9CDB6',
  borderRadius: 18,
  padding: '20px 24px',
  display: 'grid',
  gridTemplateColumns: '56px 1fr auto 48px',
  gap: 20,
  alignItems: 'center',
  transition: 'all 0.15s ease',
};

const rankStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
};

const rankNumStyle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 28,
  fontStyle: 'italic',
  color: '#C85A3C',
  fontWeight: 500,
  lineHeight: 1,
};

const topBadgeStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: '0.15em',
  color: '#C85A3C',
  fontWeight: 600,
  backgroundColor: '#F5E5DD',
  padding: '2px 6px',
  borderRadius: 4,
};

const contentStyle: React.CSSProperties = {
  cursor: 'pointer',
  minWidth: 0,
};

const cardTitleStyle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 19,
  fontWeight: 500,
  color: '#1F1A14',
  letterSpacing: '-0.01em',
  margin: 0,
  marginBottom: 4,
  lineHeight: 1.3,
};

const cardMetaStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#4A4136',
};

const scoreColStyle: React.CSSProperties = {
  textAlign: 'right',
  minWidth: 60,
};

const scoreLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#8A7F6D',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: 2,
};

const scoreValueStyle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 26,
  fontStyle: 'italic',
  color: '#2F5D3F',
  fontWeight: 500,
  lineHeight: 1,
};

const heartStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: '1px solid #D9CDB6',
  backgroundColor: 'transparent',
  color: '#1F1A14',
  cursor: 'pointer',
  fontSize: 18,
  fontFamily: 'inherit',
  transition: 'all 0.15s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const heartActiveStyle: React.CSSProperties = {
  ...heartStyle,
  backgroundColor: '#C85A3C',
  borderColor: '#C85A3C',
  color: '#F5F0E6',
};