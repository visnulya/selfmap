import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export async function captureHeroFrames(browser,baseURL='http://127.0.0.1:5173/',output='artifacts/visual/hermes-intro'){
 const sequences={};await mkdir(output,{recursive:true});
 for(const width of [1440,402]){
  const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:'no-preference'});
  await page.addInitScript(()=>{window.hermesStart=null;addEventListener('animationstart',event=>{if(event.animationName==='hermes-arrival')window.hermesStart=performance.now();},true);});
  // Hold just the Hermes image request for the first photograph. This captures
  // the real pending state on a slow connection, before starting the timeline.
  let release;
  const imageGate=new Promise(resolve=>{release=resolve;});
  await page.route(width===1440?'**/desktop-12.png':'**/mobile-11.png',async route=>{await imageGate;await route.continue();});
  const frames=[];
  try{
   await page.goto(baseURL,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('[data-hero-intro="pending"]');
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(image=>!image.closest('[data-intro-hermes]')).map(image=>image.decode().catch(()=>{})));});
   const first=`${output}/frame-${width}-0.png`;
   await page.screenshot({path:first,animations:'allow'});frames.push({target:0,ms:0,state:'pending',path:first});
   release();
   await page.waitForFunction(()=>window.hermesStart!==null);
   for(const target of [150,450,900,1200,1450,1700,1950,2400]){
    const elapsed=await page.evaluate(()=>performance.now()-window.hermesStart);
    if(target>elapsed)await page.waitForTimeout(target-elapsed);
    const ms=Math.round(await page.evaluate(()=>performance.now()-window.hermesStart));
    const path=`${output}/frame-${width}-${target}.png`;
    await page.screenshot({path,animations:'allow'});frames.push({target,ms,path});
   }
  }finally{release();await page.close();}
  sequences[width]=frames;
  const selected=[frames[0],frames[2],frames[3],frames[5],frames[7],frames[8]];
  const cards=await Promise.all(selected.map(async frame=>`<figure><figcaption>${frame.ms} мс</figcaption><img src="data:image/png;base64,${(await readFile(frame.path)).toString('base64')}" /></figure>`));
  const sheet=await browser.newPage({viewport:{width:width===1440?1440:603,height:1200},deviceScaleFactor:1});
  await sheet.setContent(`<html lang="ru"><style>*{box-sizing:border-box}body{margin:0;background:#101010;color:#fff;font:16px Arial}main{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}figure{margin:0}figcaption{height:30px;padding:6px 10px}img{display:block;width:100%;height:auto}</style><main>${cards.join('')}</main></html>`);
  await sheet.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
  await sheet.locator('main').screenshot({path:`${output}/sequence-${width}.png`});await sheet.close();
 }
 return sequences;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{const frames=await captureHeroFrames(browser);await writeFile('artifacts/visual/hermes-intro/frames.json',JSON.stringify(frames,null,2)+'\n');console.log('Saved desktop/mobile real-time frame sequences, including the hidden initial state.');}finally{await browser.close();}
}
