import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Policy } from '../api/client';

export default function SearchKeywordPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.trim()) {
      doSearch(q.trim());
    }
  }, [searchParams]);

  const doSearch = async (q: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get('/api/search', { params: { q, limit: 30 } });
      setResults(res.data.data || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearchParams({ q: query.trim() });
  };

  const suggestionKeywords = [
    '청년월세', 'AI', '창업', '육아', '취업', '디지털', '주거', '50+', '신혼'
  ];

  return (
    <div style={{ padding: '48px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={eyebrow}>키워드 검색</div>
          <h1 style={title}>찾고 있는 정책이 있나요?</h1>
          <p style={meta}>
            정책명, 키워드, 기관명, 설명에서 검색합니다
          </p>
        </div>

        {/* 검색 박스 */}
        <div style={searchBoxStyle}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="예: 청년월세, AI, 창업, 육아..."
            style={inputStyle}
            autoFocus
          />
          <button onClick={handleSearch} style={btnPrimary}>
            검색
          </button>
        </div>

        {/* 추천 키워드 */}
        {!hasSearched ? (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: '#8A7F6D', marginBottom: 10 }}>
              자주 찾는 키워드
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {suggestionKeywords.map(kw => (
                <button
                  key={kw}
                  onClick={() => {
                    setQuery(kw);
                    setSearchParams({ q: kw });
                  }}
                  style={chipStyle}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* 결과 */}
        {loading ? (
          <div style={loadingStyle}>검색 중...</div>
        ) : hasSearched && results.length === 0 ? (
          <div style={emptyStyle}>
            <div style={{ fontSize: 48, color: '#D9CDB6', marginBottom: 16 }}>🔍</div>
            <h3 style={emptyTitle}>'{query}' 검색 결과가 없어요</h3>
            <p style={emptyText}>다른 키워드로 시도해보세요.</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <div style={{ fontSize: 13, color: '#4A4136', marginBottom: 16 }}>
              <strong style={{ color: '#1F1A14', fontWeight: 600 }}>
                '{query}'
              </strong> 검색 결과 <strong style={{ color: '#1F1A14', fontWeight: 600 }}>
                {results.length}건
              </strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {results.map(p => (
                <div
                  key={p.ID}
                  style={cardStyle}
                  onClick={() => navigate('/policy/' + p.ID)}
                >
                  <div style={cardCategory}>{p.CATEGORY}</div>
                  <h3 style={cardTitle}>{p.TITLE}</h3>
                  <div style={cardOrg}>{p.ORG}</div>
                  <div style={cardFoot}>
                    <span style={agePill}>
                      {p.TARGET_AGE_MIN || p.TARGET_AGE_MAX
                        ? (p.TARGET_AGE_MIN || '제한없음') + '~' + (p.TARGET_AGE_MAX || '제한없음') + '세'
                        : '연령 무관'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.2em',
  textTransform: 'uppercase', marginBottom: 16, fontWeight: 500,
};

const title: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 40, fontWeight: 500, color: '#1F1A14',
  margin: 0, marginBottom: 16, lineHeight: 1.15, letterSpacing: '-0.015em',
};

const meta: React.CSSProperties = {
  color: '#4A4136', fontSize: 15,
};

const searchBoxStyle: React.CSSProperties = {
  display: 'flex', gap: 8, marginBottom: 24,
};

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '14px 20px', fontSize: 16, fontFamily: 'inherit',
  border: '1px solid #D9CDB6', borderRadius: 14,
  backgroundColor: '#FFFFFF', color: '#1F1A14', boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  padding: '14px 28px', backgroundColor: '#1F1A14', color: '#F5F0E6',
  border: 'none', borderRadius: 14, fontSize: 15, cursor: 'pointer',
  fontFamily: 'inherit', fontWeight: 500,
};

const chipStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 999, border: '1px solid #D9CDB6',
  backgroundColor: '#FBF8F1', color: '#1F1A14', cursor: 'pointer',
  fontSize: 13, fontFamily: 'inherit',
};

const loadingStyle: React.CSSProperties = {
  padding: 60, textAlign: 'center', color: '#8A7F6D',
};

const emptyStyle: React.CSSProperties = {
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

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FBF8F1', border: '1px solid #D9CDB6', borderRadius: 16,
  padding: 20, cursor: 'pointer',
  display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180,
  transition: 'all 0.15s ease',
};

const cardCategory: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.15em',
  textTransform: 'uppercase', fontWeight: 500,
};

const cardTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 18, fontWeight: 500, color: '#1F1A14',
  lineHeight: 1.3, letterSpacing: '-0.01em', margin: 0,
};

const cardOrg: React.CSSProperties = {
  fontSize: 13, color: '#4A4136',
};

const cardFoot: React.CSSProperties = {
  marginTop: 'auto', display: 'flex', gap: 6,
};

const agePill: React.CSSProperties = {
  display: 'inline-block', padding: '4px 12px', borderRadius: 999,
  backgroundColor: '#F5F0E6', border: '1px solid #E8E0CF',
  fontSize: 11, color: '#4A4136',
};