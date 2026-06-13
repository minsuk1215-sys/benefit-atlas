import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { toggleSavedPolicy, isPolicySaved, addSchedule, getSchedulesForPolicy, removeSchedule } from '../utils/storage';
import type { UserSchedule } from '../utils/storage';

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
  const [policySchedules, setPolicySchedules] = useState<UserSchedule[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setSaved(isPolicySaved(id));
    setPolicySchedules(getSchedulesForPolicy(id));
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

  const refreshSchedules = () => {
    if (!id) return;
    setPolicySchedules(getSchedulesForPolicy(id));
  };

  if (loading) {
    return <div style={{ padding: 80, textAlign: 'center', color: '#8A7F6D' }}>불러오는 중...</div>;
  }

  if (error || !policy) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div style={{ color: '#C85A3C', marginBottom: 20 }}>{error || '정책을 찾을 수 없어요'}</div>
        <button onClick={() => navigate(-1)} style={btnPrimary}>돌아가기</button>
      </div>
    );
  }

  const ageLabel = policy.TARGET_AGE_MIN || policy.TARGET_AGE_MAX
    ? (policy.TARGET_AGE_MIN || '제한없음') + ' ~ ' + (policy.TARGET_AGE_MAX || '제한없음') + '세'
    : '제한 없음';

  const deadlineLabel = policy.APPLY_END
    ? new Date(policy.APPLY_END).toLocaleDateString('ko-KR')
    : '상시 신청';

  const lifecycleMap: Record<string, string> = {
    birth: '출생', care: '돌봄', youth: '청년',
    marry: '신혼', senior: '시니어', all: '모두',
  };
  const lifecycleLabel = (policy.LIFECYCLE || '').split(',').map(s => lifecycleMap[s] || s).join(', ');

  const tags = policy.TAGS ? policy.TAGS.split(',').filter(Boolean) : [];

  return (
    <div style={{ padding: '48px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} style={backBtn}>돌아가기</button>

        <div style={categoryLabel}>{policy.CATEGORY}</div>
        <h1 style={title}>{policy.TITLE}</h1>

        <div style={headerRow}>
          <div style={{ fontSize: 15, color: '#4A4136' }}>
            <strong style={{ color: '#1F1A14', fontWeight: 500 }}>{policy.ORG}</strong>
            {policy.REGION ? <span style={{ color: '#8A7F6D' }}>{' · ' + policy.REGION}</span> : null}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowScheduleModal(true)} style={btnSchedule}>일정 추가</button>
            <button onClick={handleToggleSave} style={saved ? btnSaved : btnSaveOff}>
              {saved ? '저장됨' : '관심저장'}
            </button>
          </div>
        </div>

        {policySchedules.length > 0 ? (
          <div style={scheduleBox}>
            <div style={scheduleBoxLabel}>내가 추가한 일정</div>
            {policySchedules.map(s => (
              <div key={s.id} style={scheduleItem}>
                <div>
                  <div style={{ fontSize: 14, color: '#1F1A14', fontWeight: 500 }}>
                    {new Date(s.applyDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                  </div>
                  {s.memo ? <div style={scheduleMemo}>"{s.memo}"</div> : null}
                </div>
                <button onClick={() => { removeSchedule(s.id); refreshSchedules(); }} style={btnRemove}>
                  삭제
                </button>
              </div>
            ))}
          </div>
        ) : null}

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
          <div style={{ marginBottom: 40 }}>
            <h3 style={sectionTitle}>지원 내용</h3>
            <div style={sectionText}>{policy.DESCRIPTION}</div>
          </div>
        ) : null}

        {policy.TARGET_TEXT ? (
          <div style={{ marginBottom: 40 }}>
            <h3 style={sectionTitle}>지원 대상 · 자격 조건</h3>
            <div style={sectionText}>{policy.TARGET_TEXT}</div>
          </div>
        ) : null}

        {tags.length > 0 ? (
          <div style={{ marginBottom: 40 }}>
            <div style={tagsLabel}>관련 키워드</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {tags.map(tag => <span key={tag} style={tagStyle}>{tag}</span>)}
            </div>
          </div>
        ) : null}

        {policy.APPLY_URL ? (
          <div style={ctaBox}>
            <div style={ctaLabel}>다음 단계</div>
            <h3 style={ctaTitle}>정부24에서 직접 신청하실 수 있어요</h3>
            <p style={ctaDesc}>자격 조건이 맞는다면 아래에서 바로 신청이 가능합니다.</p>
            <a href={policy.APPLY_URL} target="_blank" rel="noopener noreferrer" style={ctaLink}>
              정부24에서 신청하기
            </a>
          </div>
        ) : null}
      </div>

      {showScheduleModal ? (
        <ScheduleModal
          policy={policy}
          onClose={() => setShowScheduleModal(false)}
          onAdded={() => { refreshSchedules(); setShowScheduleModal(false); }}
        />
      ) : null}
    </div>
  );
}

function ScheduleModal(props: {
  policy: PolicyDetail;
  onClose: () => void;
  onAdded: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [memo, setMemo] = useState('');

  const handleSubmit = () => {
    addSchedule({
      policyId: props.policy.ID,
      policyTitle: props.policy.TITLE,
      policyOrg: props.policy.ORG || '',
      applyDate: date,
      memo: memo.trim(),
    });
    props.onAdded();
  };

  return (
    <div style={modalBackdrop} onClick={props.onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={modalTitle}>신청 일정 추가</h3>
        <div style={modalPolicy}>{props.policy.TITLE}</div>

        <div style={{ marginBottom: 20 }}>
          <label style={modalLabel}>신청 예정일</label>
          <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)} style={modalInput} />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={modalLabel}>메모 (선택)</label>
          <input type="text" value={memo} onChange={e => setMemo(e.target.value)} placeholder="예: 점심시간에 신청" style={modalInput} />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={props.onClose} style={btnCancel}>취소</button>
          <button onClick={handleSubmit} style={btnAccent}>추가</button>
        </div>
      </div>
    </div>
  );
}

const backBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: '#4A4136',
  fontSize: 13, cursor: 'pointer', padding: '8px 0',
  fontFamily: 'inherit', marginBottom: 16, letterSpacing: '0.02em',
};

const categoryLabel: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.2em',
  textTransform: 'uppercase', marginBottom: 12, fontWeight: 500,
};

const title: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 40, fontWeight: 500, color: '#1F1A14',
  margin: 0, marginBottom: 24, lineHeight: 1.2, letterSpacing: '-0.015em',
};

const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  gap: 16, marginBottom: 40, paddingBottom: 24,
  borderBottom: '1px solid #D9CDB6', flexWrap: 'wrap',
};

const btnSchedule: React.CSSProperties = {
  padding: '10px 18px', borderRadius: 999, border: '1px solid #2F5D3F',
  backgroundColor: 'transparent', color: '#2F5D3F', cursor: 'pointer',
  fontSize: 13, fontFamily: 'inherit',
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

const scheduleBox: React.CSSProperties = {
  marginBottom: 32, padding: 20,
  backgroundColor: '#EEF4EE', border: '1px solid #2F5D3F', borderRadius: 14,
};

const scheduleBoxLabel: React.CSSProperties = {
  fontSize: 11, color: '#2F5D3F', letterSpacing: '0.15em',
  textTransform: 'uppercase', marginBottom: 12, fontWeight: 500,
};

const scheduleItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '8px 0',
};

const scheduleMemo: React.CSSProperties = {
  fontSize: 12, color: '#4A4136', marginTop: 4, fontStyle: 'italic',
};

const btnRemove: React.CSSProperties = {
  background: 'none', border: 'none', color: '#8A7F6D',
  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
};

const infoBox: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 16, marginBottom: 40, padding: 24,
  backgroundColor: '#FBF8F1', border: '1px solid #D9CDB6', borderRadius: 18,
};

const infoLabel: React.CSSProperties = {
  fontSize: 10, color: '#8A7F6D', letterSpacing: '0.15em',
  textTransform: 'uppercase', marginBottom: 6, fontWeight: 500,
};

const infoValue: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 18, color: '#1F1A14', fontWeight: 500,
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 22, fontWeight: 500, color: '#1F1A14',
  marginBottom: 16, letterSpacing: '-0.01em',
};

const sectionText: React.CSSProperties = {
  fontSize: 15, color: '#1F1A14', lineHeight: 1.75, whiteSpace: 'pre-wrap',
};

const tagsLabel: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.2em',
  textTransform: 'uppercase', marginBottom: 12, fontWeight: 500,
};

const tagStyle: React.CSSProperties = {
  padding: '5px 12px', backgroundColor: '#FBF8F1', color: '#4A4136',
  borderRadius: 999, fontSize: 12, border: '1px solid #D9CDB6',
};

const ctaBox: React.CSSProperties = {
  marginTop: 56, padding: '32px 32px 36px',
  backgroundColor: '#1F1A14', borderRadius: 24,
};

const ctaLabel: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.2em',
  textTransform: 'uppercase', fontWeight: 500, marginBottom: 12,
};

const ctaTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 24, fontWeight: 500, color: '#F5F0E6',
  margin: 0, marginBottom: 12, lineHeight: 1.3,
};

const ctaDesc: React.CSSProperties = {
  color: '#CFC4B0', fontSize: 14, lineHeight: 1.6, marginBottom: 24,
};

const ctaLink: React.CSSProperties = {
  display: 'inline-block', padding: '14px 28px',
  backgroundColor: '#C85A3C', color: '#F5F0E6', borderRadius: 999,
  fontSize: 15, textDecoration: 'none', fontWeight: 500,
};

const btnPrimary: React.CSSProperties = {
  padding: '12px 24px', backgroundColor: '#1F1A14', color: '#F5F0E6',
  border: 'none', borderRadius: 999, fontSize: 14, cursor: 'pointer',
  fontFamily: 'inherit',
};

const modalBackdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(31, 26, 20, 0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 100, padding: 20,
};

const modalBox: React.CSSProperties = {
  backgroundColor: '#FBF8F1', borderRadius: 24, padding: 36,
  maxWidth: 440, width: '100%',
};

const modalTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 24, fontWeight: 500, color: '#1F1A14', margin: 0,
  marginBottom: 8, letterSpacing: '-0.01em',
};

const modalPolicy: React.CSSProperties = {
  fontSize: 13, color: '#4A4136', marginBottom: 28,
  paddingBottom: 20, borderBottom: '1px solid #D9CDB6',
};

const modalLabel: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#4A4136', marginBottom: 8,
  letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500,
};

const modalInput: React.CSSProperties = {
  width: '100%', padding: 12, fontSize: 14, fontFamily: 'inherit',
  border: '1px solid #D9CDB6', borderRadius: 14,
  backgroundColor: '#FFFFFF', color: '#1F1A14', boxSizing: 'border-box',
};

const btnCancel: React.CSSProperties = {
  padding: '12px 20px', backgroundColor: 'transparent',
  border: '1px solid #D9CDB6', color: '#1F1A14',
  borderRadius: 999, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
};

const btnAccent: React.CSSProperties = {
  padding: '12px 20px', backgroundColor: '#2F5D3F', color: '#F5F0E6',
  border: 'none', borderRadius: 999, fontSize: 13, cursor: 'pointer',
  fontFamily: 'inherit', fontWeight: 500,
};