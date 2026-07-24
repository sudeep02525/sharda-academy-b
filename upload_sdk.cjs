require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function main() {
  const snehaPath = "C:\\Users\\aa\\.gemini\\antigravity-ide\\brain\\cc8cc70d-8360-47e1-b085-9d79ab051667\\student_sneha_1784788907614.png";
  const vikramPath = "C:\\Users\\aa\\.gemini\\antigravity-ide\\brain\\cc8cc70d-8360-47e1-b085-9d79ab051667\\student_vikram_1784788936300.png";

  try {
    const res1 = await cloudinary.uploader.upload(snehaPath, { folder: 'sharda_academy', resource_type: 'auto' });
    console.log("Sneha:", res1.secure_url);

    const res2 = await cloudinary.uploader.upload(vikramPath, { folder: 'sharda_academy', resource_type: 'auto' });
    console.log("Vikram:", res2.secure_url);
  } catch(err) {
    console.error(err);
  }
}

main();
