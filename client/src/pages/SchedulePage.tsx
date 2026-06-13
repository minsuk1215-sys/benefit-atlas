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

  // 마감 임박 (오늘 포함 이후)
  const upcoming = schedules.filter(s => new Date(s.applyDate) >= today);
  const passed = schedules.filter(s => new Date(s.applyDate) < today);

  // 캘린더 데이터 계산
  const firstDay = new Date(viewMonth.year, viewMonth.month, 1);
  const lastDay = new Date(viewMonth.year, viewMonth.month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // 셀 배열 생성 (앞 빈칸 + 날짜)
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // 날짜별 일정 매핑
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
    <div style={{ padding: '40px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 11, color: '#C85A3C', letterSpacing: '0.2em',
            textTransform: 'uppercase', marginBottom: 16, fontWeight: 500,
          }}>
            내가 직접 추가한 신청 일정
          </div>
          <h1 style={{
            fontSize: 44, color: '#1F1A14', margin: 0,
            lineHeight: 1.2, fontWeight: 500,
          }}>
            나의 <span style={{ color: '#2F5D3F', fontStyle: 'italic' }}>신청 일정</span>
          </h1>
          <p style={{ color: '#4A4136', marginTop: 16, fontSize: 15 }}>
            총 {schedules.length}건의 일정 · 다가오는 {upcoming.length}건
          </p>
        </div>

        {schedules.length === 0 ? (
          <EmptyState onNavigate={() => navigate('/')} />
        ) : (
          <>
            {/* 마감 임박 카드 (상위 3건) */}
            {upcoming.length > 0 ? (
              <UpcomingSection schedules={upcoming.slice(0, 3)} onNavigate={navigate} />
            ) : null}

            {/* 캘린더 */}
            <div style={calendarBox}>
              <div style={calendarHeader}>
                <button onClick={() => changeMonth(-1)} style={btnArrow}>‹ 이전</button>
                <div style={{ fontSize: 20, fontWeight: 500, color: '#1F1A14' }}>
                  {viewMonth.year}년 {viewMonth.month + 1}월
                </div>
                <button onClick={() => changeMonth(1)} style={btnArrow}>다음 ›</button>
              </div>

              <div style={weekdayRow}>
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                  <div key={d} style={{
                    ...weekdayCell,
                    color: i === 0 ? '#C85A3C' : i === 6 ? '#5B7A8F' : '#4A4136',
                  }}>
                    {d}
                  </div>
                ))}
              </div>

              <div style={calendarGrid}>
                {cells.map((day, idx) => {
                  if (day === null) {
                    return <div key={'empty-' + idx} style={emptyCell} />;
                  }
                  const cellDate = new Date(viewMonth.year, viewMonth.month, day);
                  const isToday = cellDate.toDateString() === new Date().toDateString();
                  const items = schedulesByDay[day] || [];
                  const dayOfWeek = cellDate.getDay();
                  return (
                    <div key={day} style={{
                      ...dayCell,
                      backgroundColor: isToday ? '#EEF4EE' : '#FBF8F1',
                      borderColor: isToday ? '#2F5D3F' : '#D9CDB6',
                    }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: isToday ? 600 : 500,
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

            {/* 전체 리스트 */}
            {upcoming.length > 0 ? (
              <div style={{ marginTop: 40 }}>
                <h2 style={sectionTitle}>다가오는 일정</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {upcoming.map(s => (
                    <ScheduleItem key={s.id} schedule={s} onRemove={handleRemove} onNavigate={navigate} />
                  ))}
                </div>
              </div>
            ) : null}

            {passed.length > 0 ? (
              <div style={{ marginTop: 40, opacity: 0.6 }}>
                <h2 style={sectionTitle}>지난 일정</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {passed.map(s => (
                    <ScheduleItem key={s.id} schedule={s} onRemove={handleRemove} onNavigate={navigate} />
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

function EmptyState({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div style={{
      padding: '80px 20px',
      textAlign: 'center',
      backgroundColor: '#FBF8F1',
      borderRadius: 18,
      border: '1px dashed #D9CDB6',
    }}>
      <div style={{ fontSize: 48, color: '#D9CDB6', marginBottom: 16 }}>📅</div>
      <h3 style={{ fontSize: 20, color: '#1F1A14', marginBottom: 12, fontWeight: 500 }}>
        아직 추가한 일정이 없어요
      </h3>
      <p style={{ fontSize: 14, color: '#4A4136', marginBottom: 24 }}>
        관심 있는 정책 상세에서<br/>
        <strong>📅 일정 추가</strong> 버튼을 눌러보세요
      </p>
      <button
        onClick={onNavigate}
        style={{
          padding: '12px 24px', backgroundColor: '#1F1A14', color: '#F5F0E6',
          border: 'none', borderRadius: 999, fontSize: 14, cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        정책 둘러보기
      </button>
    </div>
  );
}

function UpcomingSection({
  schedules, onNavigate,
}: {
  schedules: UserSchedule[];
  onNavigate: (path: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: 13, color: '#C85A3C', letterSpacing: '0.1em',
        textTransform: 'uppercase', marginBottom: 12, fontWeight: 500,
      }}>
        곧 다가오는 일정
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 12,
      }}>
        {schedules.map(s => {
          const date = new Date(s.applyDate);
          const dDay = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const urgent = dDay <= 7;
          return (
            <div
              key={s.id}
              onClick={() => onNavigate('/policy/' + s.policyId)}
              style={{
                padding: 20,
                borderRadius: 14,
                backgroundColor: urgent ? '#C85A3C' : '#FBF8F1',
                color: urgent ? '#F5F0E6' : '#1F1A14',
                border: urgent ? '1px solid #C85A3C' : '1px solid #D9CDB6',
                cursor: 'pointer',
              }}
            >
              <div style={{
                fontSize: 11, opacity: 0.8, letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: 8,
              }}>
                D-{dDay === 0 ? 'DAY' : dDay}
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>
                {s.policyTitle}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {s.policyOrg} · {date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleItem({
  schedule, onRemove, onNavigate,
}: {
  schedule: UserSchedule;
  onRemove: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  const date = new Date(schedule.applyDate);
  return (
    <div style={{
      padding: 16,
      backgroundColor: '#FBF8F1',
      border: '1px solid #D9CDB6',
      borderRadius: 14,
      display: 'grid',
      gridTemplateColumns: '90px 1fr auto',
      gap: 16,
      alignItems: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#8A7F6D' }}>{date.getFullYear()}</div>
        <div style={{ fontSize: 18, color: '#1F1A14', fontWeight: 500 }}>
          {date.getMonth() + 1}월 {date.getDate()}일
        </div>
        <div style={{ fontSize: 11, color: '#8A7F6D' }}>
          {['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}요일
        </div>
      </div>
      <div
        onClick={() => onNavigate('/policy/' + schedule.policyId)}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ fontSize: 15, color: '#1F1A14', fontWeight: 500, marginBottom: 4 }}>
          {schedule.policyTitle}
        </div>
        <div style={{ fontSize: 12, color: '#4A4136' }}>{schedule.policyOrg}</div>
        {schedule.memo ? (
          <div style={{ fontSize: 12, color: '#8A7F6D', marginTop: 6, fontStyle: 'italic' }}>
            "{schedule.memo}"
          </div>
        ) : null}
      </div>
      <button
        onClick={() => onRemove(schedule.id)}
        style={{
          background: 'none', border: 'none', color: '#8A7F6D',
          fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        삭제
      </button>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 13, color: '#C85A3C', letterSpacing: '0.1em',
  textTransform: 'uppercase', marginBottom: 16, fontWeight: 500,
};
const calendarBox: React.CSSProperties = {
  padding: 24,
  backgroundColor: '#FBF8F1',
  border: '1px solid #D9CDB6',
  borderRadius: 18,
};
const calendarHeader: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between',
  alignItems: 'center', marginBottom: 20,
};
const btnArrow: React.CSSProperties = {
  background: 'none', border: '1px solid #D9CDB6', color: '#1F1A14',
  padding: '8px 16px', borderRadius: 999, fontSize: 13,
  cursor: 'pointer', fontFamily: 'inherit',
};
const weekdayRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 4,
  marginBottom: 8,
};
const weekdayCell: React.CSSProperties = {
  textAlign: 'center', fontSize: 12, fontWeight: 500, padding: '8px 0',
};
const calendarGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 4,
};
const emptyCell: React.CSSProperties = {
  minHeight: 80, backgroundColor: 'transparent',
};
const dayCell: React.CSSProperties = {
  minHeight: 80,
  padding: 6,
  borderRadius: 8,
  border: '1px solid',
  display: 'flex',
  flexDirection: 'column',
};
const dayItem: React.CSSProperties = {
  fontSize: 10,
  padding: '2px 6px',
  marginTop: 2,
  borderRadius: 4,
  backgroundColor: '#2F5D3F',
  color: '#F5F0E6',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};