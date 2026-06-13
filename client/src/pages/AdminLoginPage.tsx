import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api/adminClient';
import { saveAdminAuth } from '../utils/adminAuth';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('아이디와 비밀번호를 입력하세요');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await adminLogin(username, password);
      if (res.ok) {
        saveAdminAuth(res.token, res.user);
        navigate('/admin/policies');
      } else {
        setError(res.error || '로그인 실패');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={eyebrowStyle}>관리자 콘솔</div>
        <h1 style={titleStyle}>지자체 담당자 로그인</h1>
        <p style={metaStyle}>
          공무원 인증으로 자체 정책을 등록·관리할 수 있어요.
        </p>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>아이디</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="admin"
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="admin"
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error ? (
          <div style={errorBoxStyle}>{error}</div>
        ) : null}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={loading ? btnDisabledStyle : btnPrimaryStyle}
        >
          {loading ? '확인 중...' : '로그인'}
        </button>

        <div style={demoNoticeStyle}>
          <strong>데모 계정</strong>
          <div style={{ marginTop: 6, color: '#4A4136' }}>
            아이디: <code style={codeStyle}>admin</code>
            <br />
            비밀번호: <code style={codeStyle}>admin</code>
          </div>
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', backgroundColor: '#F5F0E6',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20,
};

const containerStyle: React.CSSProperties = {
  maxWidth: 440, width: '100%', padding: 40,
  backgroundColor: '#FBF8F1', border: '1px solid #D9CDB6',
  borderRadius: 24,
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.2em',
  textTransform: 'uppercase', marginBottom: 14, fontWeight: 500,
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 28, fontWeight: 500, color: '#1F1A14',
  margin: 0, marginBottom: 12, letterSpacing: '-0.015em',
};

const metaStyle: React.CSSProperties = {
  color: '#4A4136', fontSize: 14, marginBottom: 32, lineHeight: 1.6,
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#4A4136', marginBottom: 8,
  letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: 14, fontSize: 14, fontFamily: 'inherit',
  border: '1px solid #D9CDB6', borderRadius: 14,
  backgroundColor: '#FFFFFF', color: '#1F1A14', boxSizing: 'border-box',
};

const errorBoxStyle: React.CSSProperties = {
  padding: 12, marginBottom: 16, backgroundColor: '#F5E5DD',
  color: '#C85A3C', borderRadius: 10, fontSize: 13,
  border: '1px solid #E07A5C',
};

const btnPrimaryStyle: React.CSSProperties = {
  width: '100%', padding: 14, backgroundColor: '#1F1A14',
  color: '#F5F0E6', border: 'none', borderRadius: 14,
  fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
};

const btnDisabledStyle: React.CSSProperties = {
  ...btnPrimaryStyle, opacity: 0.5, cursor: 'wait',
};

const demoNoticeStyle: React.CSSProperties = {
  marginTop: 32, padding: 16,
  backgroundColor: '#EEF4EE', border: '1px dashed #2F5D3F',
  borderRadius: 10, fontSize: 13, color: '#2F5D3F',
};
const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace', backgroundColor: '#FBF8F1',
  padding: '2px 6px', borderRadius: 4, color: '#1F1A14',
};