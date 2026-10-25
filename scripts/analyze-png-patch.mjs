import {PNG} from 'pngjs';
import {readFile,writeFile} from 'node:fs/promises';
function boxes(p,predicate,maxY){
 const visited=new Uint8Array(p.width*Math.min(p.height,maxY)),out=[];
 for(let y=0;y<Math.min(p.height,maxY);y++)for(let x=0;x<p.width;x++){
  const index=y*p.width+x;if(visited[index]||!predicate(p.data,index*4))continue;
  const queue=[index];visited[index]=1;let count=0,x0=x,y0=y,x1=x,y1=y;
  while(queue.length){const pos=queue.pop(),px=pos%p.width,py=Math.floor(pos/p.width);count++;x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py);
   for(const next of [px>0?pos-1:-1,px+1<p.width?pos+1:-1,py>0?pos-p.width:-1,py+1<maxY?pos+p.width:-1])if(next>=0&&!visited[next]&&predicate(p.data,next*4)){visited[next]=1;queue.push(next);}
  }
  if(count>100)out.push({x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,count});
 }
 return out;
}
const paths={desktop:'design/patches/latest-png/desktop.png',mobile:'design/patches/latest-png/mobile.png',previousDesktop:'artifacts/visual/figma-desktop-2026-10-25.png'};
const report={};
for(const [name,path]of Object.entries(paths)){
 const p=PNG.sync.read(await readFile(path));
 const grey=(d,i)=>d[i]===217&&d[i+1]===217&&d[i+2]===217;
 const orange=(d,i)=>d[i]>210&&d[i+1]>100&&d[i+1]<190&&d[i+2]<110;
 report[name]={width:p.width,height:p.height,messages:boxes(p,grey,name==='mobile'?3500:900),orange:boxes(p,orange,950)};
 if(name==='mobile')for(const [key,x,y,w,h]of [['hero',0,315,402,620],['boundaries',0,1850,402,720],['archetypes',0,2880,402,390]]){
  const crop=new PNG({width:w,height:h});PNG.bitblt(p,crop,x,y,w,h,0,0);await writeFile(`artifacts/visual/latest-png/reference-${key}.png`,PNG.sync.write(crop));
 }
}
await writeFile('design/patches/latest-png/measurements.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({desktop:report.desktop.messages,previousDesktop:report.previousDesktop.messages,mobile:report.mobile.messages},null,2));
