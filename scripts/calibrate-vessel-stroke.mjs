import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {readFile,writeFile} from 'node:fs/promises';
const reference=PNG.sync.read(await readFile('design/patches/latest-png/mobile.png'));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:402,height:900},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));window.scrollTo(0,4000);});
 for(const strokeWidth of [1,1.125,1.25,1.375,1.5,1.625,1.75,1.875,2]){
  await page.locator('[data-correction="vessel-connection"] path').evaluate((path,value)=>path.setAttribute('stroke-width',value),strokeWidth);
  const scrollTop=await page.evaluate(()=>scrollY);
  const clip=PNG.sync.read(await page.screenshot({clip:{x:210,y:4108-scrollTop,width:40,height:32}}));
  let error=0;
  for(let y=3;y<27;y++)for(let x=0;x<40;x++)for(let c=0;c<3;c++){
    const i=(y*40+x)*4+c,j=((4108+y)*402+210+x)*4+c;
    error+=(clip.data[i]-reference.data[j])**2;
  }
  results.push({strokeWidth,error});
 }
}finally{await browser.close();}
results.sort((a,b)=>a.error-b.error);
const join=JSON.parse(await readFile('src/data/vessel-join.json','utf8'));
join.strokeWidth=results[0].strokeWidth;
await writeFile('src/data/vessel-join.json',JSON.stringify(join,null,2)+'\n');
await writeFile('design/patches/letter-vessel/stroke-comparison.json',JSON.stringify(results,null,2)+'\n');
console.log(results);
