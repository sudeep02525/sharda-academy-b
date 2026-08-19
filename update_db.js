const MAPPING = {
  faculty_ananya: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795271/sharda_academy_official/dln9bysotzefaqkw7kns.jpg",
  faculty_rajesh: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795272/sharda_academy_official/w5rf8up3ihhs2q68ciaw.jpg",
  faculty_sneha: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795273/sharda_academy_official/ojesiahpgjrdguz3zvnk.jpg",
  director: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795274/sharda_academy_official/q4dtrxb6ebwrxexlm1r3.jpg",
  event_1: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795276/sharda_academy_official/dq4zszixrhhhx4k4qhyk.jpg",
  event_2: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795280/sharda_academy_official/mwulfx7cqpamrujgbnsf.jpg",
  event_3: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795278/sharda_academy_official/uiipvz0kzakd1ckq4dpm.jpg",
  gallery_1: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795280/sharda_academy_official/mwulfx7cqpamrujgbnsf.jpg",
  gallery_2: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795281/sharda_academy_official/fefwd9hjaiafgecckfki.jpg",
  gallery_3: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795282/sharda_academy_official/pxsdcgzn0c8kcmwtj8ir.jpg",
  gallery_4: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795281/sharda_academy_official/fefwd9hjaiafgecckfki.jpg",
  gallery_5: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795283/sharda_academy_official/wuupsouawcl18uon6sc7.jpg",
  gallery_6: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795284/sharda_academy_official/epmbtoks4x02b10k1jjf.jpg",
  gallery_7: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795285/sharda_academy_official/wuj0sqgdvwtmeylvi6uw.jpg",
  gallery_8: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795286/sharda_academy_official/qgpmmre5jxel9ndtilfp.jpg",
  gallery_9: "https://res.cloudinary.com/ybzctfb3/image/upload/v1784795282/sharda_academy_official/pxsdcgzn0c8kcmwtj8ir.jpg",
};

async function updateSection(page, section, transformData) {
  try {
    const res = await fetch(`https://api.shardaacademyofficial.in/api/cms/${page}/${section}`);
    if (!res.ok) return console.log(`[SKIP] ${page}/${section} (not found)`);
    const json = await res.json();
    if (!json.data) return console.log(`[SKIP] ${page}/${section} (no data)`);
    
    const transformed = transformData(json.data);
    
    const putRes = await fetch(`https://api.shardaacademyofficial.in/api/cms/${page}/${section}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: transformed, isPublished: true })
    });
    
    if (putRes.ok) console.log(`[SUCCESS] ${page}/${section} updated!`);
    else console.log(`[ERROR] Failed to update ${page}/${section}`);
  } catch(e) {
    console.error(`[ERROR] ${page}/${section}`, e);
  }
}

async function main() {
  // 1. home/faculty
  await updateSection('home', 'faculty', (data) => {
    if (data.faculty && data.faculty.length >= 3) {
      data.faculty[0].imageUrl = MAPPING.faculty_ananya;
      data.faculty[1].imageUrl = MAPPING.faculty_rajesh;
      data.faculty[2].imageUrl = MAPPING.faculty_sneha;
    }
    return data;
  });

  // 2. home/events
  await updateSection('home', 'events', (data) => {
    if (data.events && data.events.length >= 3) {
      data.events[0].imageUrl = MAPPING.event_1;
      data.events[1].imageUrl = MAPPING.event_2;
      data.events[2].imageUrl = MAPPING.event_3;
    }
    return data;
  });

  // 3. about/director-message
  await updateSection('about', 'director-message', (data) => {
    data.imageUrl = MAPPING.director;
    return data;
  });
  
  // 4. gallery/images (if they stored it under page='gallery', section='images')
  await updateSection('gallery', 'images', (data) => {
    if (data.images && data.images.length >= 9) {
      for (let i=0; i<9; i++) {
        data.images[i].imageUrl = MAPPING[`gallery_${i+1}`];
      }
    }
    return data;
  });
}

main();
