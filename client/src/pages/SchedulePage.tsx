import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSchedules, removeSchedule } from '../utils/storage';
import type { UserSchedule } from '../utils/storage';

export default function SchedulePage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<UserSchedule[]>([]);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setSchedules(getSchedules().sort((a, b) => a.applyDate.localeCompare(b.applyDate)));
  };

  const handleRemove = (scheduleId: string) => {
    if (!confirm('이 일정을 삭제할까요?')) return;
    removeSchedule(scheduleId);
    refresh();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = schedules.filter(s => new Date(s.applyDate) >= today);
  const passed = schedules.filter(s => new Date(s.applyDate) < today);

  const firstDay = new Date(viewMonth.year, viewMonth.month, 1);
  const lastDay = new Date(viewMonth.year, viewMonth.month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const schedulesByDay: Record<number, UserSchedule[]> = {};
  schedules.forEach(s => {
    const d = new Date(s.applyDate);
    if (d.getFullYear() === viewMonth.year && d.getMonth() === viewMonth.month) {
      const day = d.getDate();
      if (!schedulesByDay[day]) schedulesByDay[day] = [];
      schedulesByDay[day].push(s);
    }
  });

  const changeMonth = (delta: number) => {
    let m = viewMonth.month + delta;
    let y = viewMonth.year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth({ year: y, month: m });
  };

  return (
    <div style={{ padding: '48px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={eyebrow}>내가 직접 추가한 신청 일정</div>
          <h1 style={title}>나의 신청 일정</h1>
          <p style={meta}>
            총 {schedules.length}건의 일정 · 다가오는 {upcoming.length}건
          </p>
        </div>

        {schedules.length === 0 ? (
          <div style={emptyStyle}>
            <div style={{ fontSize: 48, color: '#D9CDB6', marginBottom: 16 }}>📅</div>
            <h3 style={emptyTitle}>아직 추가한 일정이 없어요</h3>
            <p style={emptyText}>
              관심 있는 정책 상세에서<br/>
              <strong>일정 추가</strong> 버튼을 눌러보세요
            </p>
            <button onClick={() => navigate('/')} style={btnPrimary}>
              정책 둘러보기
            </button>
          </div>
        ) : (
          <>
            {upcoming.length > 0 ? (
              <div style={{ marginBottom: 40 }}>
                <div style={sectionEyebrow}>곧 다가오는 일정</div>
                <div style={upcomingGrid}>
                  {upcoming.slice(0, 3).map(s => {
                    const date = new Date(s.applyDate);
                    const dDay = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const urgent = dDay <= 7;
                    return (
                      <div
                        key={s.id}
                        onClick={() => navigate('/policy/' + s.policyId)}
                        style={urgent ? urgentCard : upcomingCard}
                      >
                        <div style={dDayLabel}>D-{dDay === 0 ? 'DAY' : dDay}</div>
                        <div style={upcomingTitle}>{s.policyTitle}</div>
                        <div style={upcomingMeta}>
                          {s.policyOrg} · {date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div style={calendarBox}>
              <div style={calendarHeader}>
                <button onClick={() => changeMonth(-1)} style={btnArrow}>‹ 이전</button>
                <div style={monthLabel}>
                  {viewMonth.year}년 {viewMonth.month + 1}월
                </div>
                <button onClick={() => changeMonth(1)} style={btnArrow}>다음 ›</button>
              </div>

              <div style={weekdayRow}>
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                  <div key={d} style={{
                    textAlign: 'center', fontSize: 11, fontWeight: 500, padding: '8px 0',
                    letterSpacing: '0.1em',
                    color: i === 0 ? '#C85A3C' : i === 6 ? '#5B7A8F' : '#4A4136',
                  }}>
                    {d}
                  </div>
                ))}
              </div>

              <div style={calendarGrid}>
                {cells.map((day, idx) => {
                  if (day === null) {
                    return <div key={'empty-' + idx} style={{ minHeight: 88 }} />;
                  }
                  const cellDate = new Date(viewMonth.year, viewMonth.month, day);
                  const isToday = cellDate.toDateString() === new Date().toDateString();
                  const items = schedulesByDay[day] || [];
                  const dayOfWeek = cellDate.getDay();
                  return (
                    <div key={day} style={{
                      minHeight: 88, padding: 8, borderRadius: 10,
                      backgroundColor: isToday ? '#EEF4EE' : '#FBF8F1',
                      border: isToday ? '1px solid #2F5D3F' : '1px solid #E8E0CF',
                      display: 'flex', flexDirection: 'column',
                    }}>
                      <div style={{
                        fontSize: 13, fontWeight: isToday ? 600 : 500,
                        color: dayOfWeek === 0 ? '#C85A3C' : dayOfWeek === 6 ? '#5B7A8F' : '#1F1A14',
                        marginBottom: 6,
                      }}>
                        {day}
                      </div>
                      {items.slice(0, 2).map(s => (
                        <div
                          key={s.id}
                          onClick={() => navigate('/policy/' + s.policyId)}
                          style={dayItem}
                          title={s.policyTitle}
                        >
                          {s.policyTitle}
                        </div>
                      ))}
                      {items.length > 2 ? (
                        <div style={{ fontSize: 10, color: '#8A7F6D', marginTop: 2 }}>
                          +{items.length - 2}건
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {upcoming.length > 0 ? (
              <div style={{ marginTop: 48 }}>
                <div style={sectionEyebrow}>다가오는 일정</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {upcoming.map(s => (
                    <ScheduleRow key={s.id} schedule={s} onRemove={handleRemove} onNavigate={navigate} />
                  ))}
                </div>
              </div>
            ) : null}

            {passed.length > 0 ? (
              <div style={{ marginTop: 48, opacity: 0.6 }}>
                <div style={sectionEyebrow}>지난 일정</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {passed.map(s => (
                    <ScheduleRow key={s.id} schedule={s} onRemove={handleRemove} onNavigate={navigate} />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function ScheduleRow(props: {
  schedule: UserSchedule;
  onRemove: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  const s = props.schedule;
  const date = new Date(s.applyDate);
  return (
    <div style={rowStyle}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#8A7F6D' }}>{date.getFullYear()}</div>
        <div style={dateMonth}>
          {date.getMonth() + 1}월 {date.getDate()}일
        </div>
        <div style={{ fontSize: 11, color: '#8A7F6D' }}>
          {['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}요일
        </div>
      </div>
      <div onClick={() => props.onNavigate('/policy/' + s.policyId)} style={{ cursor: 'pointer' }}>
        <div style={rowTitle}>{s.policyTitle}</div>
        <div style={rowMeta}>{s.policyOrg}</div>
        {s.memo ? <div style={rowMemo}>"{s.memo}"</div> : null}
      </div>
      <button onClick={() => props.onRemove(s.id)} style={btnRemove}>삭제</button>
    </div>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.2em',
  textTransform: 'uppercase', marginBottom: 16, fontWeight: 500,
};

const sectionEyebrow: React.CSSProperties = {
  fontSize: 11, color: '#C85A3C', letterSpacing: '0.2em',
  textTransform: 'uppercase', marginBottom: 16, fontWeight: 500,
};

const title: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 44, fontWeight: 500, color: '#1F1A14',
  margin: 0, marginBottom: 16, lineHeight: 1.15, letterSpacing: '-0.015em',
};

const meta: React.CSSProperties = {
  color: '#4A4136', fontSize: 15,
};

const emptyStyle: React.CSSProperties = {
  padding: '100px 20px', textAlign: 'center',
  backgroundColor: '#FBF8F1', border: '1px dashed #D9CDB6', borderRadius: 18,
};

const emptyTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 22, fontWeight: 500, color: '#1F1A14', marginBottom: 12,
};

const emptyText: React.CSSProperties = {
  fontSize: 14, color: '#4A4136', marginBottom: 24, lineHeight: 1.6,
};

const btnPrimary: React.CSSProperties = {
  padding: '12px 24px', backgroundColor: '#1F1A14', color: '#F5F0E6',
  border: 'none', borderRadius: 999, fontSize: 14, cursor: 'pointer',
  fontFamily: 'inherit',
};

const upcomingGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 12,
};

const upcomingCard: React.CSSProperties = {
  padding: 24, borderRadius: 18,
  backgroundColor: '#FBF8F1', color: '#1F1A14',
  border: '1px solid #D9CDB6', cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const urgentCard: React.CSSProperties = {
  padding: 24, borderRadius: 18,
  backgroundColor: '#C85A3C', color: '#F5F0E6',
  border: '1px solid #C85A3C', cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const dDayLabel: React.CSSProperties = {
  fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
  marginBottom: 10, opacity: 0.85, fontWeight: 500,
};

const upcomingTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 18, fontWeight: 500, marginBottom: 8, letterSpacing: '-0.01em',
};

const upcomingMeta: React.CSSProperties = {
  fontSize: 12, opacity: 0.85,
};

const calendarBox: React.CSSProperties = {
  padding: 28,
  backgroundColor: '#FBF8F1',
  border: '1px solid #D9CDB6',
  borderRadius: 24,
};

const calendarHeader: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between',
  alignItems: 'center', marginBottom: 20,
};

const monthLabel: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 22, fontWeight: 500, color: '#1F1A14',
  letterSpacing: '-0.01em',
};

const btnArrow: React.CSSProperties = {
  background: 'none', border: '1px solid #D9CDB6', color: '#1F1A14',
  padding: '8px 16px', borderRadius: 999, fontSize: 13,
  cursor: 'pointer', fontFamily: 'inherit',
};

const weekdayRow: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 4, marginBottom: 8,
};

const calendarGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
};

const dayItem: React.CSSProperties = {
  fontSize: 10, padding: '3px 6px', marginTop: 2,
  borderRadius: 4, backgroundColor: '#2F5D3F', color: '#F5F0E6',
  cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const rowStyle: React.CSSProperties = {
  padding: 20,
  backgroundColor: '#FBF8F1',
  border: '1px solid #D9CDB6',
  borderRadius: 18,
  display: 'grid', gridTemplateColumns: '90px 1fr auto',
  gap: 20, alignItems: 'center',
};

const dateMonth: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 18, color: '#1F1A14', fontWeight: 500,
  letterSpacing: '-0.01em',
};

const rowTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, "Noto Serif KR", Georgia, serif',
  fontSize: 17, color: '#1F1A14', fontWeight: 500,
  marginBottom: 4, letterSpacing: '-0.01em',
};

const rowMeta: React.CSSProperties = {
  fontSize: 13, color: '#4A4136',
};

const rowMemo: React.CSSProperties = {
  fontSize: 12, color: '#8A7F6D', marginTop: 8, fontStyle: 'italic',
};

const btnRemove: React.CSSProperties = {
  background: 'none', border: 'none', color: '#8A7F6D',
  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
};