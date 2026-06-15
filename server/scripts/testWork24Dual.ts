cd C:\benefit-atlas\server
npx ts-node -e "
import('dotenv/config').then(async () => {
  const { fetchEmployerTrainingCourses } = await import('./src/services/work24');
  const today = new Date();
  const future = new Date();
  future.setMonth(future.getMonth() + 1);
  const ymd = (d) => d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
  try {
    const data = await fetchEmployerTrainingCourses({
      pageNum: 1, pageSize: 3,
      srchTraStDt: ymd(today), srchTraEndDt: ymd(future),
    });
    console.log('응답:', JSON.stringify(data).substring(0, 200));
  } catch (e) {
    console.log('실패:', e.message);
  }
});
"