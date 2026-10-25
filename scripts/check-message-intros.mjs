import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const output='artifacts/visual/message-intros';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const report=[];
function difference(a,b){let pixels=0;for(let i=0;i<a.data.length;i+=4)if(a.data.slice(i,i+4).some((v,j)=>v!==b.data[i+j]))pixels++;return pixels;}
try {
 for(const width of [1440,402,320,768,1024,1920]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.addInitScript(()=>{window.messageEvents=[];addEventListener('animationstart',e=>{if(e.target.dataset.scrollMessage)window.messageEvents.push({group:e.target.dataset.scrollMessage,order:+e.target.dataset.scrollMessageOrder,time:performance.now()});},true);});
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForSelector('[data-hero-intro="complete"]');
  assert.equal(await page.locator('[data-scroll-message-state="idle"]').count(),5);
  const figures='[data-node-id="1537:123"], [data-node-id="1545:32"], [data-node-id="1567:32"], [data-node-id="1567:167"]';
  const positions=()=>page.locator(figures).evaluateAll(nodes=>nodes.map(n=>{let r=n.getBoundingClientRect();return [r.x,r.y+scrollY,r.width,r.height,getComputedStyle(n).transform];}));
  const before=await positions();
  for(const group of ['boundaries','archetypes']){
   const node=page.locator(`[data-scroll-message="${group}"]`).first();
   const target=width>=900?node.locator('svg').first():node;
   await target.scrollIntoViewIfNeeded();
   if([1440,402].includes(width)){
    await page.waitForTimeout(180);
    await page.screenshot({path:`${output}/${group}-${width}-appearing.png`});
   }
   await page.waitForFunction(group=>[...document.querySelectorAll(`[data-scroll-message="${group}"]`)].every(n=>n.dataset.scrollMessageState==='complete'),group);
   if([1440,402].includes(width))await page.screenshot({path:`${output}/${group}-${width}-complete.png`});
  }
  assert.deepEqual(await positions(),before,'Figures moved');
  const events=await page.evaluate(()=>window.messageEvents);
  assert.equal(events.length,5);
  assert.deepEqual(events.filter(e=>e.group==='boundaries').map(e=>e.order),[0,1,2,3]);
  for(let i=1;i<4;i++)assert.ok(Math.abs(events[i].time-events[i-1].time-250)<90,'Wrong stagger');
  await page.evaluate(()=>scrollTo(0,0));
  await page.locator('[data-scheme-circle="ring"]').scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-scheme-intro="complete"]');
  await page.evaluate(()=>scrollTo(0,0));
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  let finalPixels;
  if([1440,402].includes(width)){
   const final=await page.screenshot({path:`${output}/final-${width}.png`,fullPage:true});
   const baseline=await readFile(`artifacts/visual/scheme-intro/static-before/site-${width}.png`);
   finalPixels=difference(PNG.sync.read(final),PNG.sync.read(baseline));
   const baselineNodes=JSON.parse(await readFile(`artifacts/visual/scheme-intro/static-before/nodes-${width}.json`,'utf8'));
   const actualNodes=await page.locator('[data-node-id]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {id:n.dataset.nodeId,x:r.x,y:r.y,width:r.width,height:r.height};}));
   assert.deepEqual(actualNodes,baselineNodes,'Approved geometry changed');
  }
  await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>window.messageEvents.length),5,'Replayed');
  await page.setViewportSize({width:width>=900?402:1440,height:900});
  await page.waitForTimeout(200);
  assert.equal(await page.locator('[data-scroll-message-state="complete"]').count(),5,'Replayed across breakpoint');
  report.push({width,events,finalPixels,figuresUnchanged:true,noOverflow:true,noReplay:true});
  await page.close();
 }
 for(const width of [1440,402]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  assert.equal(await page.locator('[data-scroll-message-state="complete"]').count(),5);
  const final=PNG.sync.read(await page.screenshot({path:`${output}/reduced-${width}.png`,fullPage:true}));
  const baseline=PNG.sync.read(await readFile(`artifacts/visual/scheme-intro/static-before/site-${width}.png`));
  assert.equal(difference(final,baseline),0);
  await page.close();
 }
 await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
 console.log('PASS: five messages, six widths, exact geometry and reduced frames, stationary figures, stagger and no replay. Normal-motion raster differences recorded separately.');
}finally{await browser.close();}
