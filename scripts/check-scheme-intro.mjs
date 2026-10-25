import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const output='artifacts/visual/scheme-intro';
const baseURL='http://127.0.0.1:5173/';
await mkdir(output,{recursive:true});
const hash=path=>readFile(path).then(bytes=>createHash('sha256').update(bytes).digest('hex').toUpperCase());
const archives=[
 {path:'checkpoints/SelfMap — Approved Static Version — 2026-10-25_02-14-17.zip',sha256:'681E2D902404B0FC8C2AF29A5DA053C5561CF40FC7A8BAE2C95EFC187BCE05FF'},
 {path:'checkpoints/SelfMap — Animation 01 — Hermes Approved — 2026-10-25_02-32-54.zip',sha256:'1C074B041064B4DE4216C8C3C283CB6479AF2830AD443FCED0412593C5C8FAFE'},
];
const heroFiles=JSON.parse(await readFile('design/patches/scheme-intro/hermes-approved-files.json','utf8'));
for(const file of [...archives,...heroFiles])if(await hash(file.path)!==file.sha256)throw new Error(`Protected file changed: ${file.path}`);
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const report={viewports:[],reducedMotion:[],frames:{},errors:[],hermesFilesUnchanged:true};

async function audit(page){
 page.on('pageerror',error=>report.errors.push(error.message));
 await page.addInitScript(()=>{
  window.schemeAudit={events:[],overflow:false,started:null};
  for(const type of ['animationstart','animationend'])addEventListener(type,event=>{
   if(!event.animationName.startsWith('scheme-'))return;
   const target=event.target;
   const part=target.closest('[data-scheme-label]')?.dataset.schemeLabel||target.dataset.schemeLine||target.dataset.schemeCircle||'decor';
   window.schemeAudit.events.push({type,name:event.animationName,part,time:performance.now()});
   if(type==='animationstart'&&event.animationName==='scheme-circle-reveal')window.schemeAudit.started=performance.now();
  },true);
  const sample=()=>{window.schemeAudit.overflow ||= document.documentElement.scrollWidth>innerWidth;requestAnimationFrame(sample);};requestAnimationFrame(sample);
 });
}
async function loaded(page){
 await page.waitForSelector('[data-hero-intro="complete"]');
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));});
}
async function schemeData(page){return page.evaluate(()=>{
 const ring=document.querySelector('[data-scheme-circle="ring"]').getBoundingClientRect();
 const scene=document.querySelector('[data-layout]'),sceneWidth=scene.dataset.layout==='desktop'?1440:402;
 const scale=document.querySelector('.scene-viewport').getBoundingClientRect().width/sceneWidth;
 return{
  state:document.querySelector('.selfmap').dataset.schemeIntro,
  circleOpacity:getComputedStyle(document.querySelector('[data-scheme-circle="ring"]')).opacity,
  lines:[...document.querySelectorAll('[data-scheme-line]:not([data-scheme-line="stem"])')].map(n=>{
   const style=getComputedStyle(n),rect=n.getBoundingClientRect();
   const maskX=rect.x+parseFloat(style.getPropertyValue('--scheme-x'))*scale;
   const maskY=rect.y+parseFloat(style.getPropertyValue('--scheme-y'))*scale;
   return{name:n.dataset.schemeLine,clip:style.clipPath,opacity:style.opacity,visibility:style.visibility,originError:Math.hypot(maskX-ring.x-ring.width/2,maskY-ring.y-ring.height/2)};
  }),
  labels:[...document.querySelectorAll('[data-scheme-label]')].map(n=>({name:n.dataset.schemeLabel,opacity:getComputedStyle(n.querySelector('p')).opacity})),
 };
});}
async function compareStatic(page,width,name){
 await page.evaluate(()=>scrollTo(0,0));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const actual=PNG.sync.read(await page.screenshot({fullPage:true,path:`${output}/${name}-${width}.png`}));
 const expected=PNG.sync.read(await readFile(`${output}/static-before/site-${width}.png`));
 if(actual.width!==expected.width||actual.height!==expected.height)throw new Error('Final page geometry changed');
 let changed=0;for(let i=0;i<actual.data.length;i+=4)if([0,1,2].some(c=>actual.data[i+c]!==expected.data[i+c]))changed++;
 if(changed)throw new Error(`${width}px: ${changed} final pixels differ from the approved composition`);
 return changed;
}
async function assertFinished(page){
 const data=await page.evaluate(()=>({state:document.querySelector('.selfmap').dataset.schemeIntro,animations:document.getAnimations().filter(a=>a.animationName?.startsWith('scheme-')).length,overflow:document.documentElement.scrollWidth>innerWidth}));
 if(data.state!=='complete'||data.animations||data.overflow)throw new Error(`Scheme did not settle: ${JSON.stringify(data)}`);
}

try{
 for(const width of [1440,402,320,768,1024,1920]){
  const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:'no-preference'});
  await audit(page);await page.goto(baseURL,{waitUntil:'domcontentloaded'});await loaded(page);
  const initial=await schemeData(page);
  if(initial.state!=='idle'||initial.circleOpacity!=='0'||initial.labels.some(n=>n.opacity!=='0'))throw new Error(`Scheme started on first screen at ${width}`);
  if((await page.evaluate(()=>window.schemeAudit.events.length))!==0)throw new Error('Early scheme animation');
  const mobile=width<900;
  const scroll=mobile?1150*Math.min(width,820)/402:1100*Math.min(width,2160)/1440;
  await page.evaluate(y=>scrollTo(0,y),scroll);
  await page.waitForSelector('[data-scheme-intro="running"]');
  await page.waitForFunction(()=>window.schemeAudit.started!==null);
  const samples=[],frames=[];
  for(const target of [0,350,800,1300,1800,2300]){
   const elapsed=await page.evaluate(()=>performance.now()-window.schemeAudit.started);
   if(target>elapsed)await page.waitForTimeout(target-elapsed);
   const data=await schemeData(page);samples.push({ms:target,...data});
   if([1440,402].includes(width)){
    const path=`${output}/frame-${width}-${target}.png`;
    const clip=width===1440?{x:680,y:0,width:760,height:910}:{x:0,y:0,width:402,height:510};
    await page.screenshot({path,clip,animations:'allow'});frames.push({ms:target,path});
   }
  }
  const middle=samples.find(s=>s.ms===800);
  if(middle.lines.some(line=>line.opacity!=='1'||line.originError>.08||!line.clip.startsWith('circle(')))throw new Error(`Guides not growing from the circle at ${width}`);
  if(middle.labels.some(label=>label.opacity!=='0'))throw new Error('Labels appeared before branch growth');
  const later=samples.find(s=>s.ms===1300);
  if(later.labels.find(label=>label.name==='archetypes').opacity==='0'||later.labels.find(label=>label.name==='philosophy').opacity!=='0')throw new Error('Label staging incorrect');
  await page.waitForSelector('[data-scheme-intro="complete"]');await assertFinished(page);
  const events=await page.evaluate(()=>window.schemeAudit.events);
  const circle=events.find(e=>e.name==='scheme-circle-reveal'&&e.type==='animationstart');
  const ends=events.filter(e=>e.name==='scheme-label-reveal'&&e.part==='philosophy'&&e.type==='animationend');
  const duration=ends[0]?.time-circle.time;
  if(duration<2000||duration>2500)throw new Error(`Wrong scheme duration: ${duration}`);
  const branches=events.filter(e=>e.name==='scheme-branch-grow'&&e.type==='animationstart'&&e.part!=='decor');
  if(branches.map(e=>e.part).join(',')!=='archetypes,numerology,astrology,philosophy')throw new Error('Incorrect branch ordering');
  const changedPixels=[1440,402].includes(width)?await compareStatic(page,width,'final'):undefined;
  await page.evaluate(()=>scrollTo(0,0));await page.evaluate(y=>scrollTo(0,y),scroll);await page.waitForTimeout(100);await assertFinished(page);
  const after=await page.evaluate(()=>window.schemeAudit);
  if(after.events.length!==events.length||after.overflow)throw new Error('Scheme replay or horizontal overflow');
  report.viewports.push({width,duration,changedPixels,noEarlyStart:true,replay:false,overflow:false,samples});
  if(frames.length)report.frames[width]=frames;
  console.log(`${width}px: waits for scroll; radial stroke growth; staged labels; ${Math.round(duration)}ms; final pixels changed: ${changedPixels??'not applicable'}; no replay/overflow`);
  await page.close();
 }
 for(const width of [1440,402]){
  const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
  await audit(page);await page.goto(baseURL,{waitUntil:'domcontentloaded'});await loaded(page);
  await assertFinished(page);const changedPixels=await compareStatic(page,width,'reduced');
  if((await page.evaluate(()=>window.schemeAudit.events.length))!==0)throw new Error('Reduced-motion scheme animated');
  report.reducedMotion.push({width,immediateStatic:true,changedPixels});await page.close();
 }
 const tall=await browser.newPage({viewport:{width:402,height:2000}});
 await tall.goto(baseURL,{waitUntil:'domcontentloaded'});await loaded(tall);
 if(await tall.locator('.selfmap').getAttribute('data-scheme-intro')!=='idle')throw new Error('Tall first viewport triggered scheme before scrolling');
 await tall.close();report.tallViewportWaitsForScroll=true;
 for(const action of ['resize','reduce']){
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  await page.goto(baseURL,{waitUntil:'domcontentloaded'});await loaded(page);await page.evaluate(()=>scrollTo(0,1100));await page.waitForSelector('[data-scheme-intro="running"]');
  if(action==='resize')await page.setViewportSize({width:402,height:1000});else await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForSelector('[data-scheme-intro="complete"]');await assertFinished(page);report[action+'DuringScheme']='settles without replay';await page.close();
 }
 for(const width of [1440,402]){
  const cards=await Promise.all(report.frames[width].map(async frame=>`<figure><figcaption>${frame.ms} мс</figcaption><img src="data:image/png;base64,${(await readFile(frame.path)).toString('base64')}" /></figure>`));
  const sheet=await browser.newPage({viewport:{width:width===1440?1140:603,height:1200}});
  await sheet.setContent(`<html lang="ru"><style>*{box-sizing:border-box}body{margin:0;background:#101010;color:#fff;font:16px Arial}main{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}figure{margin:0}figcaption{height:30px;padding:6px 10px}img{display:block;width:100%;height:auto}</style><main>${cards.join('')}</main></html>`);
  await sheet.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));await sheet.locator('main').screenshot({path:`${output}/sequence-${width}.png`});await sheet.close();
 }
 for(const file of [...archives,...heroFiles])if(await hash(file.path)!==file.sha256)throw new Error(`Protected file changed: ${file.path}`);
 if(report.errors.length)throw new Error(report.errors.join('\n'));
 report.approvedArchivesUnchanged=true;
 await writeFile(`${output}/report.json`,JSON.stringify(report,null,2)+'\n');
 console.log('Reduced motion, viewport changes, immutable approved archives and Hermes source files passed.');
}finally{await browser.close();}
