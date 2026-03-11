import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHARACTERS_JSON_URL = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/characters.json';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'assets', 'characters');

// Local representation of ALL_CHARACTERS to map our ID to actual names
const LOCAL_CHARACTERS = [
  // 5-Stars
  { id: 'acheron', name: 'Acheron' },
  { id: 'argent', name: 'Argenti' },
  { id: 'aventurine', name: 'Aventurine' },
  { id: 'bailu', name: 'Bailu' },
  { id: 'black_swan', name: 'Black Swan' },
  { id: 'blade', name: 'Blade' },
  { id: 'bronya', name: 'Bronya' },
  { id: 'clara', name: 'Clara' },
  { id: 'dan_heng_il', name: 'Dan Heng • Imbibitor Lunae' },
  { id: 'dr_ratio', name: 'Dr. Ratio' },
  { id: 'firefly', name: 'Firefly' },
  { id: 'fu_xuan', name: 'Fu Xuan' },
  { id: 'gepard', name: 'Gepard' },
  { id: 'himeko', name: 'Himeko' },
  { id: 'huohuo', name: 'Huohuo' },
  { id: 'jing_yuan', name: 'Jing Yuan' },
  { id: 'jingliu', name: 'Jingliu' },
  { id: 'kafka', name: 'Kafka' },
  { id: 'luocha', name: 'Luocha' },
  { id: 'ruan_mei', name: 'Ruan Mei' },
  { id: 'seele', name: 'Seele' },
  { id: 'silver_wolf', name: 'Silver Wolf' },
  { id: 'sparkle', name: 'Sparkle' },
  { id: 'topaz', name: 'Topaz & Numby' },
  { id: 'welt', name: 'Welt' },
  { id: 'yanqing', name: 'Yanqing' },
  // 4-Stars
  { id: 'arlan', name: 'Arlan' },
  { id: 'asta', name: 'Asta' },
  { id: 'dan_heng', name: 'Dan Heng' },
  { id: 'gallagher', name: 'Gallagher' },
  { id: 'guinaifen', name: 'Guinaifen' },
  { id: 'hanya', name: 'Hanya' },
  { id: 'herta', name: 'Herta' },
  { id: 'hook', name: 'Hook' },
  { id: 'luka', name: 'Luka' },
  { id: 'lynx', name: 'Lynx' },
  { id: 'march_7th', name: 'March 7th' },
  { id: 'march_7th_hunt', name: 'March 7th (Hunt)' },
  { id: 'misha', name: 'Misha' },
  { id: 'moze', name: 'Moze' },
  { id: 'natasha', name: 'Natasha' },
  { id: 'pela', name: 'Pela' },
  { id: 'qingque', name: 'Qingque' },
  { id: 'sampo', name: 'Sampo' },
  { id: 'serval', name: 'Serval' },
  { id: 'sushang', name: 'Sushang' },
  { id: 'tingyun', name: 'Tingyun' },
  { id: 'xueyi', name: 'Xueyi' },
  { id: 'yukong', name: 'Yukong' }
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  console.log('Fetching StarRailRes characters.json...');
  try {
    const charactersData = await fetchJson(CHARACTERS_JSON_URL);
    console.log(`Successfully fetched data for ${Object.keys(charactersData).length} characters.`);
    
    // Create mapping of character name -> icon path
    const nameToIconPath = {};
    for (const [id, charInfo] of Object.entries(charactersData)) {
      // Provide an alias for Trailblazer or March 7th forms if needed, but the basic names usually match
      nameToIconPath[charInfo.name] = charInfo.icon;
      
      // Handle special cases
      if (charInfo.name === 'Dan Heng • Imbibitor Lunae') {
        nameToIconPath['Dan Heng • Imbibitor Lunae'] = charInfo.icon;
      }
      if (id === '1224') { // March 7th (Hunt)
          nameToIconPath['March 7th (Hunt)'] = charInfo.icon;
      }
    }

    console.log('Downloading images...');
    let successCount = 0;
    
    for (const localChar of LOCAL_CHARACTERS) {
      const iconPath = nameToIconPath[localChar.name];
      const destPath = path.join(OUTPUT_DIR, `${localChar.id}.webp`);
      
      if (!iconPath) {
        console.warn(`⚠️ Could not find remote icon mapping for: ${localChar.name}`);
        continue;
      }

      const imageUrl = `${IMAGE_BASE_URL}${iconPath}`;
      console.log(`Downloading ${localChar.name} -> ${imageUrl}`);
      
      try {
        await downloadImage(imageUrl, destPath);
        // It's technically downloading as .png based on source, but saving as .webp extension
        // For standard HTML <img> tags, this usually still works in modern browsers if the content-type is an image, 
        // regardless of extension. However, to be completely proper, let's keep it as .webp extension in our characters.ts
        // and just save the downloaded file as .webp (the browser will sniff the PNG content and render it).
        successCount++;
      } catch (e) {
        console.error(`❌ Failed to download ${localChar.name}:`, e.message);
      }
    }
    
    console.log(`\n✅ Completed! Successfully downloaded ${successCount}/${LOCAL_CHARACTERS.length} profile pictures.`);
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

main();
