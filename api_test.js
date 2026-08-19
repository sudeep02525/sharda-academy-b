const API_BASE = 'http://localhost:5000';
let token = '';
let studentId = '';
let feeId = '';

const report = {
  attendance: '❌ Broken',
  courses: '❌ Missing API',
  fees: '❌ Broken',
  homework: '❌ Broken',
  results: '❌ Broken',
  timetable: '❌ Broken',
  materials: '❌ Missing API',
  notices: '❌ Broken'
};

async function fetchAPI(endpoint, method, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

async function runTests() {
  try {
    console.log('1. Logging in...');
    const loginRes = await fetchAPI('/auth/login', 'POST', { email: 'admin@sharda.com', password: 'password123' });
    token = loginRes.token;

    console.log('2. Fetching existing student...');
    let usersRes = await fetchAPI('/admin/users', 'GET');
    const usersList = usersRes.users || usersRes.data || usersRes;
    const validStudent = usersList.find(u => u.user && u.user._id);
    if (!validStudent) throw new Error('No student found to test against');
    studentId = validStudent.user._id;
    console.log(`Using student ID: ${studentId}`);

    console.log('3. Testing Attendance...');
    try {
      await fetchAPI('/admin/attendance', 'POST', { studentId, date: '2026-08-18', status: 'Present' });
      report.attendance = '✅ Working';
    } catch (e) { console.error('Attendance failed:', e.message); }

    console.log('4. Testing Fees...');
    try {
      await fetchAPI('/admin/fees', 'POST', { studentId, amount: 1000, dueDate: '2026-09-01', description: 'TEST_Fee' });
      report.fees = '⚠️ Partial (POST works, PUT unverified)';
    } catch (e) { console.error('Fees failed:', e.message); }

    console.log('5. Testing Homework...');
    try {
      await fetchAPI('/admin/homework', 'POST', { 
        title: 'TEST_Homework', description: 'Test', subject: 'Math', 
        dueDate: '2026-08-20', teacherName: 'Test Teacher', classLevel: '10' 
      });
      report.homework = '✅ Working';
    } catch (e) { console.error('Homework failed:', e.message); }

    console.log('6. Testing Results...');
    try {
      await fetchAPI('/admin/results', 'POST', { 
        examName: 'TEST_Exam', classLevel: '10', results: [{ studentId, marks: 95 }] 
      });
      report.results = '✅ Working';
    } catch (e) { console.error('Results failed:', e.message); }

    console.log('7. Testing Notices...');
    try {
      await fetchAPI('/admin/notices', 'POST', { title: 'TEST_Notice', content: 'Test', category: 'General' });
      report.notices = '✅ Working';
    } catch (e) { console.error('Notices failed:', e.message); }

    console.log('8. Testing Timetable...');
    try {
      await fetchAPI('/admin/timetables', 'POST', { 
        classLevel: '10', subject: 'Math', teacherName: 'Test', day: 'Monday', 
        startTime: '10:00', endTime: '11:00', room: '101' 
      });
      report.timetable = '✅ Working';
    } catch (e) { console.error('Timetable failed:', e.message); }

    console.log('--- TEST REPORT ---');
    console.log(JSON.stringify(report, null, 2));

  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

runTests();
