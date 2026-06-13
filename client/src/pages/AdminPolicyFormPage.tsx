import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchAdminPolicy, createAdminPolicy, updateAdminPolicy
} from '../api/adminClient';

const CATEGORIES = [
  '보육·교육', '주거·자립', '고용·창업', '건강·의료',
  '문화·여가', '생활안정', '농수산', '출산지원', '보호·돌봄', '행정·환경', '기타'
];

const LIFECYCLES = [
  { value: 'all', label: '전체 대상' },
  { value: 'birth', label: '출생·임신' },
  { value: 'care', label: '돌봄·보육' },
  { value: 'youth', label: '청년' },
  { value: 'marry', label: '신혼' },
  { value: 'senior', label: '시니어' },
];

interface FormData {
  title: string;
  category: string;
  lifecycle: string;
  org: string;
  region: string;
  description: string;
  targetText: string;
  targetAgeMin: string;
  targetAgeMax: string;
  applyEnd: string;
  applyUrl: string;
  tags: string;
}

const emptyForm: FormData = {
  title: '', category: CATEGORIES[0], lifecycle: 'all',
  org: '데모 지자체', region: '',
  description: '', targetText: '',
  targetAgeMin: '', targetAgeMax: '',
  applyEnd: '', applyUrl: '', tags: '',
};

export default function AdminPolicyFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchAdminPolicy(id)
      .then(res => {
        const p = res.data;
        setForm({
          title: p.TITLE || '',
          category: p.CATEGORY || CATEGORIES[0],
          lifecycle: p.LIFECYCLE || 'all',
          org: p.ORG || '데모 지자체',
          region: p.REGION || '',
          description: p.DESCRIPTION || '',
          targetText: p.TARGET_TEXT || '',
          targetAgeMin: p.TARGET_AGE_MIN != null ? String(p.TARGET_AGE_MIN) : '',
          targetAgeMax: p.TARGET_AGE_MAX != null ? String(p.TARGET_AGE_MAX) : '',
          applyEnd: p.APPLY_END ? new Date(p.APPLY_END).toISOString().split('T')[0] : '',
          applyUrl: p.APPLY_URL || '',
          tags: p.TAGS || '',
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (k: keyof FormData, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('제목을 입력하세요');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      category: form.category,
      lifecycle: form.lifecycle,
      org: form.org.trim() || '데모 지자체',
      region: form.region.trim(),
      description: form.description.trim(),
      targetText: form.targetText.trim(),
      targetAgeMin: form.targetAgeMin ? parseInt(form.targetAgeMin) : null,
      targetAgeMax: form.targetAgeMax ? parseInt(form.targetAgeMax) : null,
      applyEnd: form.applyEnd || null,
      applyUrl: form.applyUrl.trim(),
      tags: form.tags.trim(),
    };

    try {
      if (isEdit && id) {
        await updateAdminPolicy(id, payload);
      } else {
        await createAdminPolicy(payload);
      }
      navigate('/admin/policies');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 80, textAlign: 'center', color: '#8A7F6D' }}>불러오는 중...</div>;
  }

  return (
    <div style={{ padding: '40px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <button onClick={() => navigate('/admin/policies')} style={backBtnStyle}>
          ← 목록으로
        </button>

        <div style={{ marginBottom: 32 }}>
          <div style={eyebrowStyle}>{isEdit ? '정책 수정' : '새 정책 등록'}</div>
          <h1 style={titleStyle}>
            {isEdit ? '정책 정보 수정' : '자체 정책 등록'}
          </h1>
          <p style={metaStyle}>
            등록된 정책은 즉시 주민 화면에 노출됩니다.
          </p>
        </div>

        <Field label="제목" required>
          <input
            type="text"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            placeholder="예: 청년 월세 추가지원금"
            style={inputStyle}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="카테고리" required>
            <select
              value={form.category}
              onChange={e => update('category', e.target.value)}
              style={inputStyle}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="생애주기">
            <select
              value={form.lifecycle}
              onChange={e => update('lifecycle', e.target.value)}
              style={inputStyle}
            >
              {LIFECYCLES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="주관 기관">
            <input
              type="text"
              value={form.org}
              onChange={e => update('org', e.target.value)}
              placeholder="데모 지자체"
              style={inputStyle}
            />
          </Field>

          <Field label="대상 지역">
            <input
              type="text"
              value={form.region}
              onChange={e => update('region', e.target.value)}
              placeholder="예: 서울특별시 종로구"
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="지원 내용">
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            placeholder="어떤 혜택이 제공되는지 자세히 적어주세요"
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
          />
        </Field>

        <Field label="지원 대상 · 자격 조건">
          <textarea
            value={form.targetText}
            onChange={e => update('targetText', e.target.value)}
            placeholder="만 19~34세, 무주택자, 거주지 등 자격 요건"
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="대상 최소 연령">
            <input
              type="number"
              value={form.targetAgeMin}
              onChange={e => update('targetAgeMin', e.target.value)}
              placeholder="예: 19"
              style={inputStyle}
            />
          </Field>

          <Field label="대상 최대 연령">
            <input
              type="number"
              value={form.targetAgeMax}
              onChange={e => update('targetAgeMax', e.target.value)}
              placeholder="예: 34"
              style={inputStyle}
            />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="신청 마감일">
            <input
              type="date"
              value={form.applyEnd}
              onChange={e => update('applyEnd', e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="신청 URL">
            <input
              type="url"
              value={form.applyUrl}
              onChange={e => update('applyUrl', e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="태그 (쉼표로 구분)">
          <input
            type="text"
            value={form.tags}
            onChange={e => update('tags', e.target.value)}
            placeholder="예: 현금,청년,1인가구"
            style={inputStyle}
          />
        </Field>

        {error ? (
          <div style={errorStyle}>{error}</div>
        ) : null}

        <div style={btnRowStyle}>
          <button onClick={() => navigate('/admin/policies')} style={btnCancelStyle}>
            취소
          </button>
          <button onClick={handleSubmit} disabled={saving} style={btnPrimaryStyle}>
            {saving ? '저장 중...' : isEdit ? '수정 완료' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field(props: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={fieldStyle}>
      <label style={fieldLabelStyle}>
        {props.label}
        {props.required ? <span style={{ color: '#C85A3C', marginLeft: 4 }}>*</span> : null}
      </label>
      {props.children}
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#4A4136',
  fontSize: 13, cursor: 'pointer', padding: '8px 0',
  fontFamily: 'inherit', marginBottom: 16,
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.2em',
  textTransform: 'uppercase', marginBottom: 12, fontWeight: 500,
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 32, fontWeight: 500, color: '#1F1A14',
  margin: 0, marginBottom: 12, letterSpacing: '-0.015em',
};

const metaStyle: React.CSSProperties = {
  color: '#4A4136', fontSize: 14,
};

const fieldStyle: React.CSSProperties = {
  marginBottom: 20,
};

const fieldLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#4A4136',
  letterSpacing: '0.1em', textTransform: 'uppercase',
  marginBottom: 8, fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: 12, fontSize: 14, fontFamily: 'inherit',
  border: '1px solid #D9CDB6', borderRadius: 12,
  backgroundColor: '#FFFFFF', color: '#1F1A14', boxSizing: 'border-box',
};

const errorStyle: React.CSSProperties = {
  padding: 12, marginTop: 12, marginBottom: 12,
  backgroundColor: '#F5E5DD', color: '#C85A3C',
  border: '1px solid #E07A5C', borderRadius: 10, fontSize: 13,
};

const btnRowStyle: React.CSSProperties = {
  display: 'flex', gap: 8, justifyContent: 'flex-end',
  marginTop: 32, paddingTop: 24, borderTop: '1px solid #D9CDB6',
};

const btnCancelStyle: React.CSSProperties = {
  padding: '12px 24px', backgroundColor: 'transparent',
  border: '1px solid #D9CDB6', color: '#1F1A14',
  borderRadius: 999, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: '12px 28px', backgroundColor: '#2F5D3F',
  color: '#F5F0E6', border: 'none', borderRadius: 999,
  fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
  fontWeight: 500,
};