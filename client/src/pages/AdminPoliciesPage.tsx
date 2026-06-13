import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminPolicies, deleteAdminPolicy } from '../api/adminClient';
import type { AdminPolicy } from '../api/adminClient';
import { getAdminUser, clearAdminAuth } from '../utils/adminAuth';

export default function AdminPoliciesPage() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<AdminPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getAdminUser();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminPolicies();
      setPolicies(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 정책을 삭제할까요?`)) return;
    try {
      await deleteAdminPolicy(id);
      load();
    } catch (err: any) {
      alert('삭제 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = () => {
    clearAdminAuth();
    navigate('/admin/login');
  };

  const activePolicies = policies.filter(p => p.STATUS === 'ACTIVE');

  return (
    <div>
      <AdminTopbar tenantName={user?.tenantName || ''} onLogout={handleLogout} />

      <div style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={headerRow}>
            <div>
              <div style={eyebrow}>정책 관리</div>
              <h1 style={title}>자체 등록 정책</h1>
              <p style={meta}>
                활성 {activePolicies.length}건 · 전체 {policies.length}건
              </p>
            </div>
            <button onClick={() => navigate('/admin/policies/new')} style={btnAddStyle}>
              + 새 정책 등록
            </button>
          </div>

          {loading ? (
            <div style={emptyStyle}>불러오는 중...</div>
          ) : policies.length === 0 ? (
            <div style={emptyBoxStyle}>
              <div style={{ fontSize: 48, color: '#D9CDB6', marginBottom: 16 }}>📋</div>
              <h3 style={emptyTitle}>아직 등록된 정책이 없어요</h3>
              <p style={emptyText}>첫 번째 자체 정책을 등록해보세요.</p>
              <button onClick={() => navigate('/admin/policies/new')} style={btnAddStyle}>
                + 새 정책 등록
              </button>
            </div>
          ) : (
            <div style={tableStyle}>
              <div style={tableHeadStyle}>
                <div>제목</div>
                <div>카테고리</div>
                <div>상태</div>
                <div>수정일</div>
                <div></div>
              </div>
              {policies.map(p => (
                <div key={p.ID} style={tableRowStyle}>
                  <div>
                    <div style={rowTitleStyle}>{p.TITLE}</div>
                    <div style={rowMetaStyle}>
                      {p.ORG} {p.REGION ? '· ' + p.REGION : ''}
                    </div>
                  </div>
                  <div style={rowCellStyle}>
                    <span style={categoryPillStyle}>{p.CATEGORY}</span>
                  </div>
                  <div style={rowCellStyle}>
                    <span style={p.STATUS === 'ACTIVE' ? statusActiveStyle : statusDeletedStyle}>
                      {p.STATUS === 'ACTIVE' ? '활성' : '삭제됨'}
                    </span>
                  </div>
                  <div style={{ ...rowCellStyle, fontSize: 12, color: '#8A7F6D' }}>
                    {p.UPDATED_AT ? new Date(p.UPDATED_AT).toLocaleDateString('ko-KR') : '-'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => navigate('/admin/policies/' + p.ID)}
                      style={btnTinyStyle}
                    >
                      수정
                    </button>
                    {p.STATUS === 'ACTIVE' ? (
                      <button
                        onClick={() => handleDelete(p.ID, p.TITLE)}
                        style={btnTinyDangerStyle}
                      >
                        삭제
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminTopbar(props: { tenantName: string; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <nav style={topbarStyle}>
      <div style={topbarInnerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 18, color: '#C85A3C' }}>✦</span>
          <div>
            <div style={brandTextStyle}>BenefitAtlas Admin</div>
            <div style={brandSubStyle}>{props.tenantName}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => navigate('/admin/policies')} style={navBtnStyle}>정책 관리</button>
          <button onClick={() => window.open('/', '_blank')} style={navBtnStyle}>주민 화면 보기</button>
          <button onClick={props.onLogout} style={navBtnStyle}>로그아웃</button>
        </div>
      </div>
    </nav>
  );
}

const topbarStyle: React.CSSProperties = {
  borderBottom: '1px solid #D9CDB6',
  backgroundColor: 'rgba(245, 240, 230, 0.92)',
  position: 'sticky', top: 0, zIndex: 50,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const topbarInnerStyle: React.CSSProperties = {
  maxWidth: 1280, margin: '0 auto', padding: '14px 24px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};

const brandTextStyle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 17, fontWeight: 500, fontStyle: 'italic',
  color: '#1F1A14', lineHeight: 1.2,
};

const brandSubStyle: React.CSSProperties = {
  fontSize: 11, color: '#8A7F6D', letterSpacing: '0.1em',
  textTransform: 'uppercase',
};

const navBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none',
  color: '#4A4136', fontSize: 13, cursor: 'pointer',
  fontFamily: 'inherit', padding: '6px 10px',
};

const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
  marginBottom: 32, gap: 16, flexWrap: 'wrap',
};

const eyebrow: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.2em',
  textTransform: 'uppercase', marginBottom: 12, fontWeight: 500,
};

const title: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 38, fontWeight: 500, color: '#1F1A14',
  margin: 0, marginBottom: 12, letterSpacing: '-0.015em',
};

const meta: React.CSSProperties = {
  color: '#4A4136', fontSize: 14,
};

const btnAddStyle: React.CSSProperties = {
  padding: '12px 20px', backgroundColor: '#2F5D3F',
  color: '#F5F0E6', border: 'none', borderRadius: 999,
  fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
  fontWeight: 500,
};

const emptyStyle: React.CSSProperties = {
  padding: 60, textAlign: 'center', color: '#8A7F6D',
};

const emptyBoxStyle: React.CSSProperties = {
  padding: '80px 20px', textAlign: 'center',
  backgroundColor: '#FBF8F1', border: '1px dashed #D9CDB6', borderRadius: 18,
};

const emptyTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 22, fontWeight: 500, color: '#1F1A14', marginBottom: 12,
};

const emptyText: React.CSSProperties = {
  fontSize: 14, color: '#4A4136', marginBottom: 24,
};

const tableStyle: React.CSSProperties = {
  backgroundColor: '#FBF8F1', border: '1px solid #D9CDB6',
  borderRadius: 16, overflow: 'hidden',
};

const tableHeadStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 80px 100px 110px',
  gap: 16, padding: '14px 20px',
  backgroundColor: '#EFE8D8', fontSize: 11,
  color: '#4A4136', letterSpacing: '0.1em',
  textTransform: 'uppercase', fontWeight: 500,
  borderBottom: '1px solid #D9CDB6',
};

const tableRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 80px 100px 110px',
  gap: 16, padding: '16px 20px',
  alignItems: 'center', borderBottom: '1px solid #E8E0CF',
};

const rowTitleStyle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 15, color: '#1F1A14', fontWeight: 500, marginBottom: 2,
};

const rowMetaStyle: React.CSSProperties = {
  fontSize: 12, color: '#4A4136',
};

const rowCellStyle: React.CSSProperties = {
  fontSize: 13, color: '#1F1A14',
};

const categoryPillStyle: React.CSSProperties = {
  display: 'inline-block', padding: '3px 10px', borderRadius: 999,
  backgroundColor: '#F5F0E6', border: '1px solid #E8E0CF',
  fontSize: 11, color: '#4A4136',
};

const statusActiveStyle: React.CSSProperties = {
  display: 'inline-block', padding: '3px 10px', borderRadius: 999,
  backgroundColor: '#EEF4EE', color: '#2F5D3F',
  fontSize: 11, fontWeight: 500,
};

const statusDeletedStyle: React.CSSProperties = {
  display: 'inline-block', padding: '3px 10px', borderRadius: 999,
  backgroundColor: '#F5E5DD', color: '#C85A3C',
  fontSize: 11, fontWeight: 500,
};

const btnTinyStyle: React.CSSProperties = {
  padding: '6px 12px', backgroundColor: 'transparent',
  border: '1px solid #D9CDB6', color: '#1F1A14',
  borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
};

const btnTinyDangerStyle: React.CSSProperties = {
  padding: '6px 12px', backgroundColor: 'transparent',
  border: '1px solid #E07A5C', color: '#C85A3C',
  borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
};