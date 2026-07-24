require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const imagesToUpload = [
  { id: 1, name: 'daily_lectures' },
  { id: 2, name: 'doubt_clearing' },
  { id: 3, name: 'mock_tests' },
  { id: 4, name: 'toppers_felicitation' },
  { id: 5, name: 'exam_revision' },
  { id: 6, name: 'parent_teacher' },
  { id: 7, name: 'mentoring' },
  { id: 8, name: 'strategy_seminar' },
  { id: 9, name: 'batch_farewell' }
];

const artifactDir = 'C:\\Users\\aa\\.gemini\\antigravity-ide\\brain\\cc8cc70d-8360-47e1-b085-9d79ab051667';

async function uploadAll() {
  const files = fs.readdirSync(artifactDir);
  const results = [];
  
  for (const img of imagesToUpload) {
    // Find the file that starts with the image name
    const file = files.find(f => f.startsWith(img.name + '_') && f.endsWith('.png'));
    if (!file) {
      console.error(`File not found for ${img.name}`);
      continue;
    }
    
    const filePath = path.join(artifactDir, file);
    try {
      console.log(`Uploading ${filePath}...`);
      const res = await cloudinary.uploader.upload(filePath, {
        folder: 'sharda_academy_gallery',
        use_filename: true,
        unique_filename: false
      });
      
      results.push({
        id: img.id,
        url: res.secure_url,
        public_id: res.public_id
      });
      console.log(`Uploaded ${img.name}: ${res.secure_url}`);
    } catch (err) {
      console.error(`Error uploading ${img.name}:`, err);
    }
  }
  
  console.log('--- RESULTS ---');
  console.log(JSON.stringify(results, null, 2));
}

uploadAll();
