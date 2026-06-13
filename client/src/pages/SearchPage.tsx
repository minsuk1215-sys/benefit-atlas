import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveProfile, loadProfile } from '../utils/storage';

export interface UserProfile {
  age?: number;
  gender?: string;
  job?: string;
  region?: string;
  marriage?: string;
  children?: string;
  childAge?: number;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({});

  useEffect(() => {
    const saved = loadProfile();
    if (saved) setProfile(saved);
  }, []);

  const update = (k: keyof UserProfile, v: any) =>
    setProfile(prev => ({ ...prev, [k]: v }));

  const handleSubmit = () => {
    saveProfile(profile);
    navigate('/result', { state: { profile } });
  };

  return (
    <div className="page">
      <div className="container-narrow">
        {/* 진행 표시 */}
        <div style={progressWrapStyle}>
          <div style={{
            ...progressBarStyle,
            backgroundColor: step >= 1 ? 'var(--ink)' : 'var(--line)',
          }} />
          <div style={{
            ...progressBarStyle,
            backgroundColor: step >= 2 ? 'var(--ink)' : 'var(--line)',
          }} />
        </div>

        <div style={stepLabelStyle}>STEP {step} / 2</div>

        {step === 1 ? (
          <div className="fade-in" key="step1">
            <h1 style={titleStyle}>
              먼저, <em style={emStyle}>기본 정보</em>를<br />
              알려주세요.
            </h1>

            <Field label="나이">
              <input
                type="number"
                placeholder="예: 29"
                value={profile.age ?? ''}
                onChange={e => update('age', parseInt(e.target.value) || undefined)}
                className="input"
              />
            </Field>

            <Field label="성별">
              <ChipRow
                options={['여성', '남성', '선택안함']}
                selected={profile.gender}
                onSelect={v => update('gender', v)}
              />
            </Field>

            <Field label="현재 직업 상태">
              <ChipRow
                options={['재직자', '구직자', '학생', '자영업', '예비창업', '무직']}
                selected={profile.job}
                onSelect={v => update('job', v)}
              />
            </Field>

            <Field label="거주 지역">
              <select
                value={profile.region || ''}
                onChange={e => update('region', e.target.value)}
                className="input"
              >
                <option value="">선택</option>
                {['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>

            <div style={navRowEndStyle}>
              <button
                onClick={() => setStep(2)}
                disabled={!profile.age}
                className="btn btn-primary"
                style={{ opacity: profile.age ? 1 : 0.4, cursor: profile.age ? 'pointer' : 'not-allowed' }}
              >
                다음 →
              </button>
            </div>
          </div>
        ) : (
          <div className="fade-in" key="step2">
            <h1 style={titleStyle}>
              <em style={emStyle}>가구 상황</em>을<br />
              알려주세요.
            </h1>

            <Field label="혼인상태">
              <ChipRow
                options={['미혼', '기혼', '예비', '한부모']}
                selected={profile.marriage}
                onSelect={v => update('marriage', v)}
              />
            </Field>

            <Field label="자녀">
              <ChipRow
                options={['없음', '임신중', '1명', '2명', '3명 이상']}
                selected={profile.children}
                onSelect={v => update('children', v)}
              />
            </Field>

            {profile.children && profile.children !== '없음' && profile.children !== '임신중' ? (
              <Field label="막내 자녀 나이">
                <input
                  type="number"
                  placeholder="예: 3"
                  value={profile.childAge ?? ''}
                  onChange={e => update('childAge', parseInt(e.target.value) || undefined)}
                  className="input"
                />
              </Field>
            ) : null}

            <div style={navRowBetweenStyle}>
              <button onClick={() => setStep(1)} className="btn btn-secondary">
                ← 이전
              </button>
              <button onClick={handleSubmit} className="btn btn-accent">
                결과 보기 →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={fieldStyle}>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

function ChipRow({
  options, selected, onSelect,
}: {
  options: string[];
  selected?: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div style={chipRowStyle}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={'chip' + (selected === opt ? ' chip-active' : '')}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const progressWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 24,
};

const progressBarStyle: React.CSSProperties = {
  flex: 1,
  height: 3,
  borderRadius: 2,
  transition: 'background-color 0.3s ease',
};

const stepLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#C85A3C',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  fontWeight: 500,
  marginBottom: 16,
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 40,
  fontWeight: 500,
  color: '#1F1A14',
  lineHeight: 1.2,
  letterSpacing: '-0.015em',
  marginBottom: 40,
};

const emStyle: React.CSSProperties = {
  fontStyle: 'italic',
  color: '#2F5D3F',
  fontWeight: 500,
};

const fieldStyle: React.CSSProperties = {
  marginBottom: 28,
};

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#4A4136',
  letterSpacing: '0.05em',
  marginBottom: 10,
  fontWeight: 500,
};

const chipRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const navRowEndStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 48,
};

const navRowBetweenStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 48,
};