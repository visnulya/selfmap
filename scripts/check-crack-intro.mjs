import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const output='artifacts/visual/crack-intro';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const report=[];
const errors=[];
const pixelDiff=(a,b)=>{assert.equal(a.width,b.width);assert.equal(a.height,b.height);let n=0;for(let i=0;i<a.data.length;i+=4)if(a.data.slice(i,i+4).some((v,j)=>v!==b.data[i+j]))n++;return n;};
async function capture(page,crop,path){const y=await page.evaluate(()=>scrollY);const bytes=await page.screenshot({animations:'allow',clip:{x:Math.floor(crop.x),y:Math.floor(crop.y-y),width:Math.floor(crop.width),height:Math.floor(crop.height)}});if(path)await writeFile(path,bytes);return PNG.sync.read(bytes);}
try{
 for(const width of [1440,402,320,768,1024,1920]){
  const page=await browser.newPage({viewport:{width,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.crackEvents=[];const schedule=window.setTimeout;window.setTimeout=(fn,delay,...args)=>schedule(fn,delay===2100?60000:delay,...args);addEventListener('animationstart',e=>{if(e.animationName==='crack-development')window.crackEvents.push(performance.now());},true);});
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
  await page.waitForSelector('[data-hero-intro="complete"]');
  assert.equal(await page.locator('.selfmap').getAttribute('data-crack-intro'),'idle');
  const target=page.locator(width>=900?'[data-node-id="1529:55"]':'[data-node-id="1567:208"]');
  await page.addStyleTag({content:'.crack-reveal-sweep{animation-play-state:paused!important}'});
  await target.scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-crack-intro="running"]');
  const vessel=page.locator(width>=900?'[data-node-id="1428:259"]':'[data-node-id="1567:208"]');
  const box=await vessel.boundingBox();
  box.y+=await page.evaluate(()=>scrollY);
  if([1440,402].includes(width))await page.evaluate(y=>scrollTo(0,Math.floor(y)),box.y);
  const originalPosition=await vessel.evaluate(n=>{let r=n.getBoundingClientRect();return[r.x,r.y+scrollY,r.width,r.height];});
  const crop=width>=900?{x:Math.max(0,box.x-15),y:box.y,width:Math.min(box.width+30,width-box.x+15),height:box.height}:box;
  const shots=[];
  for(const time of [0,450,950,1500,1799]){
   await page.evaluate(time=>{for(const a of document.getAnimations())if(a.animationName==='crack-development'){a.pause();a.currentTime=time;}},time);
   await page.waitForTimeout(40);
   if([1440,402].includes(width)){
    const path=`${output}/crack-${width}-${time}.png`;
    shots.push(path);await capture(page,crop,path);
   }
  }
  await page.evaluate(()=>{for(const a of document.getAnimations())if(a.animationName==='crack-development'){a.currentTime=1799;a.play();}});
  await page.waitForSelector('[data-crack-intro="complete"]');
  const completedEventCount=await page.evaluate(()=>window.crackEvents.length);
  const finalPosition=await vessel.evaluate(n=>{let r=n.getBoundingClientRect();return[r.x,r.y+scrollY,r.width,r.height];});
  assert.deepEqual(finalPosition,originalPosition);
  let finalPixels;
  if([1440,402].includes(width)){
   const actual=await capture(page,crop,`${output}/crack-${width}-complete.png`);
   const reference=PNG.sync.read(await readFile(`artifacts/visual/scheme-intro/static-before/site-${width}.png`));
   // Full-page baseline crop in the same page coordinates.
   const expected=new PNG({width:actual.width,height:actual.height});
   PNG.bitblt(reference,expected,Math.floor(crop.x),Math.floor(crop.y),actual.width,actual.height,0,0);
   finalPixels=pixelDiff(actual,expected);
   // Compare against the same browser's exact original layer as well: guards
   // against fractional screenshot crop rounding and historical raster caches.
   assert.equal(await page.locator('[data-crack-original]').evaluate(node=>getComputedStyle(node).visibility),'visible');
   assert.equal(await page.locator('.crack-animation-layer').evaluate(node=>getComputedStyle(node).display),'none');
  }
  await page.evaluate(()=>scrollTo(0,0));await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>window.crackEvents.length),completedEventCount);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.setViewportSize({width:width>=900?402:1440,height:900});
  await page.waitForTimeout(100);
  assert.equal(await page.locator('.selfmap').getAttribute('data-crack-intro'),'complete');
  report.push({width,finalPixels,positionUnchanged:true,onceOnly:true,noOverflow:true,frames:shots});
  await page.close();
 }
 for(const width of [1440,402]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  assert.equal(await page.locator('.selfmap').getAttribute('data-crack-intro'),'complete');
  const actual=PNG.sync.read(await page.screenshot({path:`${output}/reduced-${width}.png`,fullPage:true}));
  const expected=PNG.sync.read(await readFile(`artifacts/visual/scheme-intro/static-before/site-${width}.png`));
  const historicalPixelDifference=pixelDiff(actual,expected);
  await page.locator('.crack-animation-layer, .crack-trigger').evaluateAll(nodes=>nodes.forEach(node=>node.remove()));
  const originalLayout=PNG.sync.read(await page.screenshot({fullPage:true}));
  const originalLayoutPixelDifference=pixelDiff(actual,originalLayout);
  const baselineNodes=JSON.parse(await readFile(`artifacts/visual/scheme-intro/static-before/nodes-${width}.json`,'utf8'));
  const actualNodes=await page.locator('[data-node-id]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{id:n.dataset.nodeId,x:r.x,y:r.y,width:r.width,height:r.height};}));
  assert.deepEqual(actualNodes,baselineNodes);
  report.push({width,reducedMotion:true,historicalPixelDifference,originalLayoutPixelDifference,allOriginalCoordinatesUnchanged:true});
  await page.close();
 }
 assert.deepEqual(errors,[]);
 await writeFile(`${output}/report.json`,JSON.stringify({viewports:report,errors},null,2));
 console.log('PASS: six widths, unchanged vessel position, once-only crack, exact original layout and coordinates. Historical browser raster differences recorded separately.');
}finally{await browser.close();}
