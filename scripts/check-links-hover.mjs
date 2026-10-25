import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const baseURL=process.env.SELFMAP_URL||'http://127.0.0.1:5173/selfmap/';
const output='artifacts/visual/links-hover';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.SELFMAP_CHROME||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
const report={viewports:[],errors:[],popup:null};
const difference=(a,b)=>{let n=0;assert.equal(a.data.length,b.data.length);for(let i=0;i<a.data.length;i+=4)if(a.data.slice(i,i+4).some((v,j)=>v!==b.data[i+j]))n++;return n;};
async function style(page){return page.locator('.service-button').evaluate(n=>{const s=getComputedStyle(n),p=getComputedStyle(n,'::after'),r=n.getBoundingClientRect();const a=document.querySelector('[data-service-arrow]');return{background:s.backgroundColor,contour:p.borderTopColor,duration:s.transitionDuration,arrow:getComputedStyle(a).translate,geometry:[r.x,r.y+scrollY,r.width,r.height]};});}
async function finishAll(page,width){
 await page.waitForSelector('[data-hero-intro="complete"]');
 await page.locator('[data-scheme-circle="ring"]').scrollIntoViewIfNeeded();
 await page.waitForSelector('[data-scheme-intro="complete"]');
 for(const group of['boundaries','archetypes']){
  const node=page.locator(`[data-scroll-message="${group}"]`).first();
  await (width>=900?node.locator('svg').first():node).evaluate(n=>n.scrollIntoView({block:'center',inline:'nearest'}));
  await page.waitForFunction(group=>[...document.querySelectorAll(`[data-scroll-message="${group}"]`)].every(n=>n.dataset.scrollMessageState==='complete'),group);
 }
 await page.locator('.service-button').scrollIntoViewIfNeeded();
 await page.waitForSelector('[data-crack-intro="complete"]');
}
try{
 for(const width of[1440,402,320,768,1024,1920]){
  console.log(`Checking ${width}px`);
  const touch=width<900;
  const context=await browser.newContext({viewport:{width,height:900},isMobile:touch,hasTouch:touch});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(baseURL,{waitUntil:'networkidle'});
  await finishAll(page,width);
  const normal=await style(page);
  assert.equal(normal.background,'rgb(247, 159, 79)');
  assert.equal(normal.contour,'rgba(0, 0, 0, 0)');
  const inactive=page.locator('.prepared-link:not([href])');
  assert.equal(await inactive.count(),touch?1:5);
  for(const n of await inactive.all()){
   assert.equal(await n.getAttribute('aria-disabled'),'true');
   assert.equal(await n.getAttribute('target'),null);
  }
  assert.equal(await page.locator('a[href="#"], a[href=""]').count(),0);
  assert.equal(await page.locator('.service-button').getAttribute('href'),null);
  const originalURL=page.url();
  await page.locator('.service-button').click({force:true});
  assert.equal(page.url(),originalURL);assert.equal(context.pages().length,1);
  await page.mouse.move(0,0);await page.waitForTimeout(400);
  if([1440,402].includes(width))await page.screenshot({path:`${output}/normal-${width}.png`});
  await page.locator('.service-button').hover();await page.waitForTimeout(420);
  const hovered=await style(page);
  assert.deepEqual(hovered.geometry,normal.geometry);
  if(touch){assert.equal(hovered.background,normal.background);assert.equal(hovered.contour,normal.contour);assert.equal(hovered.arrow,'none');}
  else{assert.notEqual(hovered.background,normal.background);assert.equal(hovered.contour,'rgb(145, 93, 46)');assert.equal(hovered.arrow,'3px');assert.equal(hovered.duration,'0.35s');}
  if([1440,402].includes(width))await page.screenshot({path:`${output}/hover-${width}.png`});
  await page.mouse.move(0,0);await page.waitForTimeout(420);
  const returned=await style(page);
  assert.equal(returned.background,normal.background);assert.equal(returned.contour,normal.contour);assert.deepEqual(returned.geometry,normal.geometry);
  if([1440,402].includes(width)){
   await page.evaluate(()=>scrollTo(0,0));
   const nodes=await page.locator('[data-node-id]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{id:n.dataset.nodeId,x:r.x,y:r.y,width:r.width,height:r.height};}));
   const baselinePath=`artifacts/visual/scheme-intro/static-before/nodes-${width}.json`;
   if(existsSync(baselinePath))assert.deepEqual(nodes,JSON.parse(await readFile(baselinePath,'utf8')));
  }
  if(width===1440){
   const link=page.getByRole('link',{name:'Дзен',exact:true});
   assert.equal(await link.getAttribute('href'),'https://dzen.ru/selfmap');
   assert.equal(await link.getAttribute('target'),'_blank');
   assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
   const navigation=[];
   context.on('request',r=>{if(r.isNavigationRequest()&&r.url().startsWith('https://dzen.ru/selfmap'))navigation.push(r.url());});
   const popupPromise=page.waitForEvent('popup');
   await link.click();const popup=await popupPromise;
   let loadError=null;
   await popup.waitForLoadState('domcontentloaded',{timeout:12000}).catch(e=>{loadError=e.message.split('\n')[0];});
   assert.ok(navigation.includes('https://dzen.ru/selfmap'));
   const opener=await popup.evaluate(()=>window.opener===null).catch(()=>null);
   if(opener!==null)assert.equal(opener,true);
   report.popup={requestedURL:navigation[0],actualURL:popup.url(),newTab:true,openerIsNull:opener,loadError};
   await popup.close();
  }
  await page.getByRole('link',{name:'Политика конфиденциальности',exact:true}).click({force:true});
  assert.equal(page.url(),originalURL);assert.equal(context.pages().length,1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.locator('[data-scroll-message-state="complete"]').count(),5);
  report.viewports.push({width,touch,normal,hovered,returned,allFourIntrosComplete:true,noOverflow:true});
  await context.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await page.goto(baseURL,{waitUntil:'networkidle'});
 await page.locator('.service-button').scrollIntoViewIfNeeded();await page.locator('.service-button').hover();
 const reduced=await style(page);assert.equal(reduced.duration,'0s');assert.equal(reduced.arrow,'none');
 report.reducedMotion={instantColorChange:true,noArrowMovement:true};
 await page.close();assert.deepEqual(report.errors,[]);
 await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
 console.log(JSON.stringify({result:'PASS',popup:report.popup,widths:report.viewports.map(v=>v.width),errors:report.errors},null,2));
}finally{await browser.close();}
