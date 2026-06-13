import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  const update = (k: keyof UserProfile, v: any) => setProfile(prev => ({ ...prev, [k]: v }));

  const handleSubmit = () => {
    // 결과 페이지로 프로필 전달
    navigate('/result', { state: { profile } });
  };

  return (
    <div style={{ padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* 진행도 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          <div style={{ flex: 1, height: '3px', backgroundColor: step >= 1 ? '#1F1A14' : '#D9CDB6', borderRadius: '2px' }}></div>
          <div style={{ flex: 1, height: '3px', backgroundColor: step >= 2 ? '#1F1A14' : '#D9CDB6', borderRadius: '2px' }}></div>
        </div>

        <div style={{ fontSize: '12px', color: '#4A4136', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
          STEP {step} / 2
        </div>

        {step === 1 && (
          <>
            <h2 style={{ fontSize: '32px', color: '#1F1A14', marginTop: 0, marginBottom: '36px', lineHeight: 1.2, fontWeight: 500 }}>
              먼저, <span style={{ color: '#2F5D3F', fontStyle: 'italic' }}>기본 정보</span>를 알려주세요.
            </h2>

            <Field label="나이">
              <input
                type="number"
                placeholder="예: 29"
                value={profile.age ?? ''}
                onChange={e => update('age', parseInt(e.target.value) || undefined)}
                style={inputStyle}
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
                style={inputStyle}
              >
                <option value="">선택</option>
                {['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
              <button
                onClick={() => setStep(2)}
                disabled={!profile.age}
                style={{
                  padding: '14px 28px',
                  backgroundColor: profile.age ? '#1F1A14' : '#D9CDB6',
                  color: '#F5F0E6',
                  border: 'none',
                  borderRadius: '999px',
                  fontSize: '15px',
                  cursor: profile.age ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                }}
              >
                다음 →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: '32px', color: '#1F1A14', marginTop: 0, marginBottom: '36px', lineHeight: 1.2, fontWeight: 500 }}>
              <span style={{ color: '#2F5D3F', fontStyle: 'italic' }}>가구 상황</span>을 알려주세요.
            </h2>

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

            {profile.children && profile.children !== '없음' && profile.children !== '임신중' && (
              <Field label="막내 자녀 나이">
                <input
                  type="number"
                  placeholder="예: 3"
                  value={profile.childAge ?? ''}
                  onChange={e => update('childAge', parseInt(e.target.value) || undefined)}
                  style={inputStyle}
                />
              </Field>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '14px 28px',
                  backgroundColor: 'transparent',
                  color: '#1F1A14',
                  border: '1px solid #D9CDB6',
                  borderRadius: '999px',
                  fontSize: '15px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ← 이전
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '14px 28px',
                  backgroundColor: '#2F5D3F',
                  color: '#F5F0E6',
                  border: 'none',
                  borderRadius: '999px',
                  fontSize: '15px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                }}
              >
                결과 보기 →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  backgroundColor: '#FBF8F1',
  border: '1px solid #D9CDB6',
  borderRadius: '12px',
  fontSize: '15px',
  fontFamily: 'inherit',
  color: '#1F1A14',
  boxSizing: 'border-box',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', fontSize: '13px', color: '#4A4136', marginBottom: '8px' }}>{label}</label>
      {children}
    </div>
  );
}

function ChipRow({ options, selected, onSelect }: { options: string[]; selected?: string; onSelect: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          style={{
            padding: '10px 18px',
            border: selected === opt ? '1px solid #1F1A14' : '1px solid #D9CDB6',
            borderRadius: '999px',
            backgroundColor: selected === opt ? '#1F1A14' : '#FBF8F1',
            color: selected === opt ? '#F5F0E6' : '#1F1A14',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'inherit',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}