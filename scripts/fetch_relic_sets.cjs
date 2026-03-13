const fs = require('fs');
const path = require('path');
const https = require('https');

const ASSETS_DIR = path.join(__dirname, '../public/assets/relics');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Node.js' } }, (response) => {
        if (response.statusCode === 200) {
          const file = fs.createWriteStream(dest);
          response.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
          });
        } else {
          reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        }
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';

https
  .get(
    'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/relic_sets.json',
    { headers: { 'User-Agent': 'Node.js' } },
    (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const sets = [];
          const downloadTasks = [];

          for (const [id, info] of Object.entries(data)) {
            if (!info || typeof info !== 'object') continue;

            const localIconPath = `/assets/relics/${id}.png`;
            const dest = path.join(ASSETS_DIR, `${id}.png`);

            sets.push({
              id: id,
              name: info.name,
              icon: localIconPath,
            });

            if (info.icon) {
              downloadTasks.push(
                downloadImage(`${IMAGE_BASE_URL}${info.icon}`, dest).catch((e) =>
                  console.error(`Skipped icon ${id} - ${e.message}`),
                ),
              );
            }
          }

          // Sort alphabetically by name
          sets.sort((a, b) => a.name.localeCompare(b.name));

          const tsContent = `// Auto-generated from StarRailRes
import { type RelicSet } from './relics';

export const ALL_RELIC_SETS: RelicSet[] = ${JSON.stringify(sets, null, 2)};
`;
          fs.writeFileSync(path.join(__dirname, '../src/data/relic_sets.ts'), tsContent);
          console.log('Successfully saved to src/data/relic_sets.ts');

          console.log(`Downloading ${downloadTasks.length} relic icons...`);
          await Promise.all(downloadTasks);
          console.log('Finished downloading all relic icons.');
        } catch (e) {
          console.error('Failed to parse or save relic sets:', e);
        }
      });
    },
  )
  .on('error', (e) => {
    console.error('Got error: ' + e.message);
  });
