import { PNG } from 'pngjs';
import { readFile, writeFile } from 'node:fs/promises';
const slots=[['mobile',402,0,980,402,200],['mobile',402,0,1650,402,250],['mobile',402,0,3270,402,280],['desktop',1440,65,1060,620,520],['desktop',1440,1010,80,425,560]];
for(let i=0;i<slots.length;i++){
  const [name,width,x,y,w,h]=slots[i];
  const ref=PNG.sync.read(await readFile(`artifacts/visual/figma-${name}.png`));
  const site=PNG.sync.read(await readFile(`artifacts/visual/site-${width}.png`));
  const out=new PNG({width:w*2,height:h});
  PNG.bitblt(ref,out,x,y,w,h,0,0);PNG.bitblt(site,out,x,y,w,h,w,0);
  await writeFile(`artifacts/visual/detail-${i}.png`,PNG.sync.write(out));
}
