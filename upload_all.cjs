require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const https = require('https');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const IMAGES = {
  faculty_ananya: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600",
  faculty_rajesh: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=600",
  faculty_sneha: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=600",
  director: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  event_1: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop",
  event_2: "https://images.unsplash.com/photo-1523580494112-071dcb92a71d?q=80&w=800&auto=format&fit=crop",
  event_3: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=800&auto=format&fit=crop",
  hero: "https://images.unsplash.com/photo-1523580494112-071dcb92a71d?q=80&w=1200&auto=format&fit=crop",
  gallery_1: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop",
  gallery_2: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop",
  gallery_3: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
  gallery_4: "https://images.unsplash.com/photo-1523580494112-071dcb92a71d?q=80&w=800&auto=format&fit=crop",
  gallery_5: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop",
  gallery_6: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=800&auto=format&fit=crop",
  gallery_7: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800&auto=format&fit=crop",
  gallery_8: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=800&auto=format&fit=crop",
  gallery_9: "https://images.unsplash.com/photo-1523580494112-071dcb92a71d?q=80&w=800&auto=format&fit=crop",
};

const uploadToCloudinary = (url, folder) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
        return;
      }
      
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folder, resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      
      res.pipe(uploadStream);
    }).on('error', (err) => reject(err));
  });
};

async function main() {
  const results = {};
  for (const [key, url] of Object.entries(IMAGES)) {
    try {
      console.log(`Uploading ${key}...`);
      const secureUrl = await uploadToCloudinary(url, 'sharda_academy_official');
      results[key] = secureUrl;
      console.log(`Success ${key}: ${secureUrl}`);
    } catch (error) {
      console.error(`Failed ${key}:`, error);
    }
  }
  
  console.log("\n--- FINAL JSON MAPPING ---");
  console.log(JSON.stringify(results, null, 2));
}

main();
