import {readFile,writeFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
const before=PNG.sync.read(await readFile('artifacts/visual/letter-vessel/before/site-402.png'));
const reference=PNG.sync.read(await readFile('design/patches/latest-png/mobile.png'));
const rows=[];
for(let y=4070;y<=4140;y++){
 const values=[];
 for(const image of [before,reference]){
  let coverage=0,weightedX=0;
  for(let x=210;x<250;x++){
   const i=(y*image.width+x)*4,weight=Math.max(0,(255-image.data[i])/239);
   if(weight>.1){coverage+=weight;weightedX+=weight*(x+.5);}
  }
  values.push({coverage,x:coverage?weightedX/coverage:null});
 }
 rows.push({y,before:values[0],reference:values[1]});
}
const samples=rows.filter(r=>r.reference.coverage>.2&&r.reference.coverage<3&&r.y<=4134);
const matrix=Array.from({length:3},()=>[0,0,0,0]);
for(const row of samples){const t=row.y+.5-4100,v=[1,t,t*t];for(let i=0;i<3;i++){for(let j=0;j<3;j++)matrix[i][j]+=v[i]*v[j];matrix[i][3]+=v[i]*row.reference.x;}}
for(let col=0;col<3;col++){
 const pivot=matrix[col][col];for(let j=col;j<4;j++)matrix[col][j]/=pivot;
 for(let i=0;i<3;i++){if(i===col)continue;const scale=matrix[i][col];for(let j=col;j<4;j++)matrix[i][j]-=scale*matrix[col][j];}
}
const coefficients=matrix.map(r=>r[3]);
const error=Math.sqrt(samples.reduce((sum,r)=>{const t=r.y+.5-4100;return sum+(r.reference.x-coefficients[0]-coefficients[1]*t-coefficients[2]*t*t)**2;},0)/samples.length);
const data={coefficients,error,rows};
await writeFile('design/patches/letter-vessel/join-measurements.json',JSON.stringify(data,null,2)+'\n');
const [a,b,c]=coefficients;
const y0=4109.5,y1=4137;
const x=y=>a+b*(y-4100)+c*(y-4100)**2;
const control=x(y0)+(b+2*c*(y0-4100))*(y1-y0)/2;
const rounded=n=>Math.round(n*10000)/10000;
await writeFile('src/data/vessel-join.json',JSON.stringify({x:222,y:4108,width:16,height:32,path:`M ${rounded(x(y0))} ${y0} Q ${rounded(control)} ${(y0+y1)/2} ${rounded(x(y1))} ${y1}`,strokeWidth:1.5},null,2)+'\n');
console.log(JSON.stringify({coefficients,error,rows:rows.filter(r=>r.y>=4105)},null,2));
const image=PNG.sync.read(await readFile('artifacts/visual/letter-vessel/after-letters/site-1440.png'));
const crop=new PNG({width:760,height:910});PNG.bitblt(image,crop,680,1100,760,910,0,0);
await writeFile('artifacts/visual/letter-vessel/desktop-after-letters.png',PNG.sync.write(crop));
