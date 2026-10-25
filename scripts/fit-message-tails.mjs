// Fit smooth native vector curves to the newly supplied PNG bubble outlines.
// The reference image is only measured; no screenshot pixels are used in the site.
import {readFile,writeFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
const image=PNG.sync.read(await readFile('design/patches/latest-png/mobile.png'));
const messages=JSON.parse(await readFile('src/data/mobile-messages.json','utf8'));
for(const message of messages){
 const edges=[];
 for(let y=0;y<message.height;y++){
  const xs=[];
  for(let x=Math.max(0,message.x-40);x<Math.min(image.width,message.x+message.width+40);x++){
   const i=((message.y+y)*image.width+x)*4;
   if(image.data[i]===217&&image.data[i+1]===217&&image.data[i+2]===217)xs.push(x);
  }
  edges.push(message.side==='right'?Math.max(...xs)+.95-message.x-message.width:message.x-Math.min(...xs)-.05);
 }
 let best;
 const min=message.id==='boundaries-found'?6:message.height>80?20:12;
 const max=message.id==='boundaries-found'?12:message.height>80?40:23;
 for(let tailHeight=min;tailHeight<=max;tailHeight+=.5){
  let aa=0,ab=0,bb=0,ad=0,bd=0;
  for(let y=Math.ceil(message.height-tailHeight);y<message.height;y++){
   const t=(y+.5-message.height+tailHeight)/tailHeight,a=3*t*t*(1-t),b=t*t*t,d=edges[y];
   aa+=a*a;ab+=a*b;bb+=b*b;ad+=a*d;bd+=b*d;
  }
  const determinant=aa*bb-ab*ab;
  const control=(ad*bb-bd*ab)/determinant,tailWidth=(bd*aa-ad*ab)/determinant;
  if(tailWidth<2||tailWidth>35||control < -4||control>tailWidth*.5)continue;
  let error=0;
  for(let y=Math.ceil(message.height-tailHeight);y<message.height;y++){
   const t=(y+.5-message.height+tailHeight)/tailHeight;
   const predicted=3*control*t*t*(1-t)+tailWidth*t*t*t;
   error+=(predicted-edges[y])**2;
  }
  error/=tailHeight;
  if(!best||error<best.error)best={tailHeight,tailWidth,tailControl:control,error};
 }
 for(const key of ['tailHeight','tailWidth','tailControl'])message[key]=Math.round(best[key]*1000)/1000;
 console.log(message.id,JSON.stringify(best));
}
await writeFile('src/data/mobile-messages.json',JSON.stringify(messages,null,2)+'\n');
