const API_BASE = 'http://localhost:5000';
let token = '';

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
    console.log('--- Logging in ---');
    const loginRes = await fetchAPI('/auth/login', 'POST', { email: 'admin@sharda.com', password: 'password123' });
    token = loginRes.token;

    console.log('\n--- Testing Courses API ---');
    // 1. Add
    const addCourseRes = await fetchAPI('/admin/courses', 'POST', { name: 'TEST_Course', classLevel: '10', description: 'Test' });
    const courseId = addCourseRes.data._id;
    console.log('✅ Add Course');
    // 2. Edit
    await fetchAPI(`/admin/courses/${courseId}`, 'PUT', { name: 'TEST_Course_Updated' });
    console.log('✅ Edit Course');
    // 3. List
    const listCoursesRes = await fetchAPI('/admin/courses', 'GET');
    if (!listCoursesRes.data.some(c => c.name === 'TEST_Course_Updated')) throw new Error('Course not found in list');
    console.log('✅ List Courses');
    // 4. Delete
    await fetchAPI(`/admin/courses/${courseId}`, 'DELETE');
    console.log('✅ Delete Course');

    console.log('\n--- Testing Study Material API ---');
    // 1. Add (Mocking Cloudinary attachmentData using a tiny valid base64 data URI for an image or PDF)
    const mockPDFBase64 = 'data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCj4+Cj4+CiAgL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgo+PgplbmRvYmoKCjUgMCBvYmoKPDwKICAvTGVuZ3RoIDIxCj4+CnN0cmVhbQpCVAovRjEgMjQgVGYKMSAxIFRkCihIZWxsbyBXb3JsZCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNTAgMDAwMDAgbiAKMDAwMDAwMDEzNCAwMDAwMCBuIAowMDAwMDAwMjM5IDAwMDAwIG4gCjAwMDAwMDAzMjYgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDAwCiUlRU9GCg==';
    const addMatRes = await fetchAPI('/admin/study-materials', 'POST', {
      title: 'TEST_Material', subject: 'Math', classLevel: '10', materialType: 'Notes',
      attachmentData: mockPDFBase64, attachmentName: 'test.pdf'
    });
    const matId = addMatRes.data._id;
    console.log('✅ Upload Material (Cloudinary URL:', addMatRes.data.attachmentData, ')');
    // 2. List
    const listMatRes = await fetchAPI('/admin/study-materials', 'GET');
    if (!listMatRes.data.some(m => m.title === 'TEST_Material')) throw new Error('Material not found in list');
    console.log('✅ List Materials');
    // 3. Delete
    await fetchAPI(`/admin/study-materials/${matId}`, 'DELETE');
    console.log('✅ Delete Material');

    console.log('\n--- All Tests Passed ---');
  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

runTests();
