import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {traditionalPatterns} from '../app/traditional-pattern-data.ts';

const target=new URL('../public/traditional-patterns/',import.meta.url);
await mkdir(target,{recursive:true});

for(const pattern of traditionalPatterns){
  const paths=pattern.regions.map(region=>`<path id="${region.id}" d="${region.path}" fill="#fffef9" stroke="#232a35" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>`).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/>${paths}</svg>`;
  const base=pattern.preview.split('/').at(-1).replace('.png','');
  await writeFile(new URL(`${base}.svg`,target),svg);
  await sharp(Buffer.from(svg)).resize(800,800).png().toFile(fileURLToPath(new URL(`${base}.png`,target)));
}
