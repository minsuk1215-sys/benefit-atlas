import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { toggleSavedPolicy, isPolicySaved } from '../utils/storage';

interface PolicyDetail {
  ID: string;
  TITLE: string;
  ORG: string;
  CATEGORY: string;
  LIFECYCLE: string;
  DESCRIPTION: string;
  TARGET_TEXT: string;
  TARGET_AGE_MIN: number | null;
  TARGET_AGE_MAX: number | null;
  APPLY_END: string | null;
  APPLY_URL: string;
  TAGS: string;
  REGION: string;
}

export default function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setSaved(isPolicySaved(id));
    api.get('/api/policies/' + id)
      .then(res => {
        setPolicy(res.data.data);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleSave = () => {
    if (!id) return;
    toggleSavedPolicy(id);
    setSaved(prev => !prev);
  };

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>불러오는 중...</div>;
  }

  if (error || !policy) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ color: '#C85A3C', marginBottom: 16 }}>{error || '정책을 찾을 수 없어요'}</div>
        <button onClick={() => navigate(-1)} style={btnBlack}>돌아가기</button>
      </div>
    );
  }

  const ageLabel = policy.TARGET_AGE_MIN || policy.TARGET_AGE_MAX
    ? (policy.TARGET_AGE_MIN || '제한없음') + ' ~ ' + (policy.TARGET_AGE_MAX || '제한없음') + '세'
    : '제한 없음';

  const deadlineLabel = policy.APPLY_END
    ? new Date(policy.APPLY_END).toLocaleDateString('ko-KR')
    : '상시';

  const lifecycleMap: Record<string, string> = {
    birth: '출생', care: '돌봄', youth: '청년',
    marry: '신혼', senior: '시니어', all: '모두',
  };
  const lifecycleLabel = (policy.LIFECYCLE || '').split(',').map(s => lifecycleMap[s] || s).join(', ');

  const tags = policy.TAGS ? policy.TAGS.split(',').filter(Boolean) : [];

  return (
    <div style={{ padding: '40px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} style={btnBack}>돌아가기</button>

        <div style={catLabel}>{policy.CATEGORY}</div>
        <h1 style={titleStyle}>{policy.TITLE}</h1>

        <div style={headerRow}>
          <div style={{ color: '#4A4136', fontSize: 15 }}>
            <strong>{policy.ORG}</strong>
            {policy.REGION ? <span style={{ color: '#8A7F6D' }}>{' · ' + policy.REGION}</span> : null}
          </div>
          <button onClick={handleToggleSave} style={saved ? btnSaved : btnSaveOff}>
            {saved ? '저장됨' : '관심저장'}
          </button>
        </div>

        <div style={infoBox}>
          <div>
            <div style={infoLabel}>대상 연령</div>
            <div style={infoValue}>{ageLabel}</div>
          </div>
          <div>
            <div style={infoLabel}>신청 마감</div>
            <div style={infoValue}>{deadlineLabel}</div>
          </div>
          <div>
            <div style={infoLabel}>생애주기</div>
            <div style={infoValue}>{lifecycleLabel}</div>
          </div>
        </div>

        {policy.DESCRIPTION ? (
          <div style={{ marginBottom: 32 }}>
            <h3 style={sectionTitle}>지원 내용</h3>
            <div style={sectionText}>{policy.DESCRIPTION}</div>
          </div>
        ) : null}

        {policy.TARGET_TEXT ? (
          <div style={{ marginBottom: 32 }}>
            <h3 style={sectionTitle}>지원 대상 · 자격 조건</h3>
            <div style={sectionText}>{policy.TARGET_TEXT}</div>
          </div>
        ) : null}

        {tags.length > 0 ? (
          <div style={{ marginBottom: 32, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tags.map(tag => <span key={tag} style={tagStyle}>{tag}</span>)}
          </div>
        ) : null}

        {policy.APPLY_URL ? (
          <div style={ctaBox}>
            <div style={{ color: '#CFC4B0', fontSize: 13, marginBottom: 12 }}>
              정부24에서 직접 신청하실 수 있어요
            </div>
            <a href={policy.APPLY_URL} target="_blank" rel="noopener noreferrer" style={ctaLink}>
              정부24에서 신청하기
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const btnBack: React.CSSProperties = {
  background: 'none', border: 'none', color: '#4A4136', fontSize: 13,
  cursor: 'pointer', padding: '8px 0', fontFamily: 'inherit', marginBottom: 16,
};

const btnBlack: React.CSSProperties = {
  padding: '12px 24px', backgroundColor: '#1F1A14', color: '#F5F0E6',
  border: 'none', borderRadius: 999, fontSize: 14, cursor: 'pointer',
  fontFamily: 'inherit',
};

const catLabel: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.2em',
  textTransform: 'uppercase', marginBottom: 12, fontWeight: 500,
};

const titleStyle: React.CSSProperties = {
  fontSize: 36, color: '#1F1A14', margin: 0, marginBottom: 16,
  lineHeight: 1.2, fontWeight: 500,
};

const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  gap: 16, marginBottom: 32, paddingBottom: 24,
  borderBottom: '1px solid #D9CDB6',
};

const btnSaveOff: React.CSSProperties = {
  padding: '10px 18px', borderRadius: 999, border: '1px solid #D9CDB6',
  backgroundColor: 'transparent', color: '#1F1A14', cursor: 'pointer',
  fontSize: 13, fontFamily: 'inherit',
};

const btnSaved: React.CSSProperties = {
  padding: '10px 18px', borderRadius: 999, border: '1px solid #C85A3C',
  backgroundColor: '#C85A3C', color: '#F5F0E6', cursor: 'pointer',
  fontSize: 13, fontFamily: 'inherit',
};

const infoBox: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 16, marginBottom: 32, padding: 20,
  backgroundColor: '#FBF8F1', border: '1px solid #D9CDB6', borderRadius: 14,
};

const infoLabel: React.CSSProperties = {
  fontSize: 11, color: '#8A7F6D', marginBottom: 4,
};

const infoValue: React.CSSProperties = {
  fontSize: 15, color: '#1F1A14', fontWeight: 500,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 13, color: '#C85A3C', letterSpacing: '0.1em',
  textTransform: 'uppercase', marginBottom: 12, fontWeight: 500,
};

const sectionText: React.CSSProperties = {
  fontSize: 15, color: '#1F1A14', lineHeight: 1.7, whiteSpace: 'pre-wrap',
};

const tagStyle: React.CSSProperties = {
  padding: '6px 14px', backgroundColor: '#F5F0E6', color: '#4A4136',
  borderRadius: 999, fontSize: 12, border: '1px solid #D9CDB6',
};

const ctaBox: React.CSSProperties = {
  marginTop: 40, padding: 24, backgroundColor: '#1F1A14',
  borderRadius: 18, textAlign: 'center',
};

const ctaLink: React.CSSProperties = {
  display: 'inline-block', padding: '14px 32px',
  backgroundColor: '#C85A3C', color: '#F5F0E6', borderRadius: 999,
  fontSize: 15, textDecoration: 'none', fontWeight: 500,
};