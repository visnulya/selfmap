// Derive a mask, not a replacement drawing: only the original raster's grey
// crack pixels are selected. The original image and both supplied SVGs stay intact.
import {PNG} from 'pngjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const source=PNG.sync.read(await readFile('public/assets/2026-10-25/mobile-group651.png'));
const mask=new PNG({width:source.width,height:source.height});
let count=0;
for(let i=0;i<source.data.length;i+=4){
 const [r,g,b,a]=source.data.subarray(i,i+4);
 const selected=a>0&&r>16&&r===g&&g===b;
 mask.data.set([255,255,255,selected?255:0],i);
 if(selected)count++;
}
await mkdir('src/data',{recursive:true});
await writeFile('public/assets/crack-animation/mobile-crack-pixel-mask.png',PNG.sync.write(mask));
const crack=await readFile('public/assets/2026-10-25/desktop-vector61.svg','utf8');
const path=crack.match(/<path[^>]*d="([^"]+)"/)[1];
// This broad reveal mask follows the original bends; it never draws the crack.
const sweep='M 0 1 L 83 18 Q 94 19 92 42 L 92 57 Q 91 64 105 65 L 144 68 Q 155 68 168 77 L 197 98 Q 230 121 236 138 Q 243 139 266 121 L 289 107 Q 293 104 306 128 L 320 152 Q 324 158 340 167 Q 361 183 376 188 Q 382 190 382 214 Q 384 220 394 229 L 406 237';
await writeFile('src/data/crack-animation.json',JSON.stringify({desktopPath:path,desktopSweep:sweep,mobileSweep:'M 10 340 L 93 364 Q 103 367 99 391 L 97 404 Q 98 412 112 413 L 151 417 Q 163 419 177 430 L 207 453 Q 233 475 240 489 Q 247 492 270 477 L 293 463 Q 297 459 309 484 L 325 509 Q 328 515 343 525 Q 367 543 380 548 Q 383 551 383 569 Q 384 578 394 587 L 405 597',maskPixels:count},null,2));
console.log({maskPixels:count});
