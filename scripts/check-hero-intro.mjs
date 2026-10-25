import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {captureHeroFrames} from './capture-hero-frames.mjs';

const output='artifacts/visual/hermes-intro';
const baseURL='http://127.0.0.1:5173/';
const archive='checkpoints/SelfMap — Approved Static Version — 2026-10-25_02-14-17.zip';
const expectedArchiveHash='681E2D902404B0FC8C2AF29A5DA053C5561CF40FC7A8BAE2C95EFC187BCE05FF';
const archiveHash=()=>readFile(archive).then(bytes=>createHash('sha256').update(bytes).digest('hex').toUpperCase());
if(await archiveHash()!==expectedArchiveHash)throw new Error('Approved static archive changed');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const report={viewports:[],reducedMotion:[],frames:{},errors:[],staticComparisons:[]};

async function audit(page){
 page.on('pageerror',error=>report.errors.push(error.message));
 await page.addInitScript(()=>{
  window.introAudit={initial:null,events:[],overflow:false,unrelatedAnimations:[],layoutShifts:[]};
  const observer=new MutationObserver(()=>{
   const main=document.querySelector('[data-hero-intro]'),hermes=document.querySelector('[data-intro-hermes]');
   const dialogs=[...document.querySelectorAll('[data-intro-dialog]')];
   if(!main||!hermes||dialogs.length!==4||window.introAudit.initial)return;
   window.introAudit.initial={state:main.dataset.heroIntro,hermesOpacity:getComputedStyle(hermes).opacity,hermesVisibility:getComputedStyle(hermes).visibility,dialogOpacity:dialogs.map(n=>getComputedStyle(n).opacity)};
  });
  observer.observe(document,{subtree:true,childList:true,attributes:true});
  for(const type of ['animationstart','animationend'])addEventListener(type,event=>{
   if(!['hermes-arrival','hero-dialog-arrival'].includes(event.animationName)){window.introAudit.unrelatedAnimations.push(event.animationName);return;}
   window.introAudit.events.push({type,name:event.animationName,order:event.target.dataset.introDialog??null,time:performance.now()});
  },true);
  const sample=()=>{window.introAudit.overflow ||= document.documentElement.scrollWidth>innerWidth;requestAnimationFrame(sample);};
  requestAnimationFrame(sample);
  try{new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.introAudit.layoutShifts.push(entry.value);}).observe({type:'layout-shift',buffered:true});}catch{}
 });
}
async function ready(page){
 await page.waitForSelector('[data-hero-intro="complete"]');
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
}
function difference(actual,expected,maxHeight=1000){
 if(actual.width!==expected.width||actual.height!==expected.height)throw new Error('Static dimensions changed');
 let pixels=0,antialiasOnlyPixels=0,maximumChannelDifference=0;
 for(let i=0;i<actual.width*Math.min(maxHeight,actual.height)*4;i+=4){
  const delta=Math.max(...[0,1,2].map(c=>Math.abs(actual.data[i+c]-expected.data[i+c])));
  maximumChannelDifference=Math.max(maximumChannelDifference,delta);
  // Separate one/two-level SVG rasterization rounding from visual changes.
  if(delta>2)pixels++;else if(delta)antialiasOnlyPixels++;
 }
 return{pixels,antialiasOnlyPixels,maximumChannelDifference,comparedHeight:Math.min(maxHeight,actual.height)};
}
async function compareStatic(page,width,name){
 const actual=PNG.sync.read(await page.screenshot({fullPage:true,path:`${output}/${name}-${width}.png`}));
 const expected=PNG.sync.read(await readFile(`${output}/static-before/site-${width}.png`));
 // Later scroll-triggered sections are intentionally still hidden here.
 // This regression is scoped to the approved first screen. The scheme test
 // independently compares the entire page after both stages have completed.
 const comparison=difference(actual,expected,1000);
 report.staticComparisons.push({width,name,...comparison});
 const changedPixels=comparison.pixels;
 if(changedPixels)throw new Error(`${name}: ${changedPixels} pixels differ from static at ${width}px`);
 return changedPixels;
}
async function assertStopped(page){
 const state=await page.evaluate(()=>({state:document.querySelector('[data-hero-intro]').dataset.heroIntro,animations:document.getAnimations().filter(a=>a.effect.target.closest('[data-intro-hermes], [data-intro-dialog]')).length,overflow:document.documentElement.scrollWidth>innerWidth}));
 if(state.state!=='complete'||state.animations||state.overflow)throw new Error(`Intro did not stop cleanly: ${JSON.stringify(state)}`);
 return state;
}

try{
 for(const width of [1440,402,320,768,1024,1920]){
  const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:'no-preference'});
  await audit(page);
  await page.goto(baseURL,{waitUntil:'domcontentloaded'});
  await ready(page);
  const data=await page.evaluate(()=>window.introAudit);
  if(data.initial?.hermesOpacity!=='0'||data.initial?.dialogOpacity.some(value=>value!=='0'))throw new Error(`Initial flash at ${width}`);
  if(data.overflow||data.unrelatedAnimations.length)throw new Error(`Out-of-scope animation/overflow at ${width}`);
  if(data.layoutShifts.some(value=>value>.00001))throw new Error(`Layout shift during intro at ${width}`);
  const hermesStart=data.events.find(e=>e.name==='hermes-arrival'&&e.type==='animationstart');
  const hermesEnd=data.events.find(e=>e.name==='hermes-arrival'&&e.type==='animationend');
  const messages=data.events.filter(e=>e.name==='hero-dialog-arrival'&&e.type==='animationstart');
  if(!hermesStart||!hermesEnd||Math.abs(hermesEnd.time-hermesStart.time-1100)>150)throw new Error('Wrong Hermes duration');
  if(messages.map(e=>e.order).join(',')!=='0,1,2,3'||messages[0].time<hermesEnd.time)throw new Error('Wrong dialogue order');
  for(let i=1;i<messages.length;i++)if(Math.abs(messages[i].time-messages[i-1].time-250)>100)throw new Error('Wrong dialogue interval');
  const changedPixels=[1440,402].includes(width)?await compareStatic(page,width,'final'):undefined;
  await page.evaluate(()=>scrollTo(0,2100));await page.evaluate(()=>scrollTo(0,0));
  await assertStopped(page);
  report.viewports.push({width,initial:data.initial,duration:hermesEnd.time-hermesStart.time,messageStarts:messages.map(e=>({order:e.order,ms:e.time-hermesStart.time})),changedPixels,scrollReplay:false,overflow:false});
  console.log(`${width}px: initial state hidden; 1.1s Hermes; four ordered messages; no overflow/replay; static pixels changed: ${changedPixels??'not applicable'}`);
  await page.close();
 }
 for(const width of [1440,402]){
  const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
  await audit(page);await page.goto(baseURL,{waitUntil:'domcontentloaded'});await ready(page);
  const data=await page.evaluate(()=>window.introAudit);
  if(data.initial?.state!=='complete'||data.initial.hermesOpacity!=='1'||data.events.length)throw new Error('Reduced motion did not show static immediately');
  await assertStopped(page);const changedPixels=await compareStatic(page,width,'reduced');
  report.reducedMotion.push({width,immediateStatic:true,changedPixels});await page.close();
 }
 // A breakpoint change or a preference change during the intro must not replay it.
 for(const action of ['resize','reduce']){
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  await page.goto(baseURL,{waitUntil:'domcontentloaded'});await page.waitForSelector('[data-hero-intro="running"]');
  if(action==='resize')await page.setViewportSize({width:402,height:1000});else await page.emulateMedia({reducedMotion:'reduce'});
  await ready(page);await assertStopped(page);report[action+'DuringIntro']='finishes without replay';await page.close();
 }
 report.frames=await captureHeroFrames(browser,baseURL,output);
 if(report.errors.length)throw new Error(report.errors.join('\n'));
 report.approvedArchiveUnchanged=await archiveHash()===expectedArchiveHash;
 if(!report.approvedArchiveUnchanged)throw new Error('Approved static archive was overwritten');
 await writeFile(`${output}/report.json`,JSON.stringify(report,null,2)+'\n');
 console.log('Reduced motion, live resize/preference changes, frame sequences, and approved archive integrity passed.');
}finally{await browser.close();}
