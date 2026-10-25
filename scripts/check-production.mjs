import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const baseURL=process.env.SELFMAP_URL||'http://127.0.0.1:4173/selfmap/';
const output='artifacts/publication';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.SELFMAP_CHROME||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
const report={baseURL,resources:[],viewports:[],errors:[]};
async function files(dir){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${entry.name}`;result.push(...(entry.isDirectory()?await files(path):[path]));}return result;}
try{
 const context=await browser.newContext();
 for(const path of await files('public')){
  const url=new URL(path.slice('public/'.length),baseURL).href;
  const response=await context.request.get(url);
  assert.equal(response.status(),200,`Resource unavailable: ${url}`);
  const bytes=await response.body(),source=await readFile(path);
  assert.ok(bytes.equals(source),`Resource differs from original: ${url}`);
  report.resources.push(path.slice(7));
 }
 await context.close();
 for(const width of[1440,402]){
  const page=await browser.newPage({viewport:{width,height:900},isMobile:width<900,hasTouch:width<900});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
  page.on('requestfailed',request=>report.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response',response=>{if(response.status()>=400)report.errors.push(`${response.status()} ${response.url()}`);});
  page.on('request',request=>{const url=new URL(request.url());if(url.origin===new URL(baseURL).origin&&/^\/(assets|fonts)\//.test(url.pathname))report.errors.push(`Missing repository prefix: ${url.pathname}`);});
  await page.goto(baseURL,{waitUntil:'networkidle'});
  await page.waitForSelector('[data-hero-intro="complete"]');
  await page.locator('[data-scheme-circle="ring"]').evaluate(n=>n.scrollIntoView({block:'center'}));
  await page.waitForSelector('[data-scheme-intro="complete"]');
  for(const group of['boundaries','archetypes']){
   const node=page.locator(`[data-scroll-message="${group}"]`).first();
   await (width>=900?node.locator('svg').first():node).evaluate(n=>n.scrollIntoView({block:'center'}));
   await page.waitForFunction(group=>[...document.querySelectorAll(`[data-scroll-message="${group}"]`)].every(n=>n.dataset.scrollMessageState==='complete'),group);
  }
  await page.locator('.service-button').scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-crack-intro="complete"]');
  await page.mouse.move(0,0);
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));scrollTo(0,0);});
  await page.waitForTimeout(400);
  const state=await page.evaluate(()=>({fonts:[...document.fonts].map(font=>({family:font.family,status:font.status})),images:[...document.images].every(image=>image.complete&&image.naturalWidth>0),overflow:document.documentElement.scrollWidth>innerWidth,nodes:[...document.querySelectorAll('[data-node-id]')].map(n=>{const r=n.getBoundingClientRect();return{id:n.dataset.nodeId,x:r.x,y:r.y,width:r.width,height:r.height};})}));
  assert.ok(state.images);assert.ok(state.fonts.some(f=>f.family==='Arimo'&&f.status==='loaded'));assert.ok(state.fonts.some(f=>f.family==='Elsie'&&f.status==='loaded'));assert.equal(state.overflow,false);
  const baseline=`artifacts/visual/scheme-intro/static-before/nodes-${width}.json`;
  if(existsSync(baseline))assert.deepEqual(state.nodes,JSON.parse(await readFile(baseline,'utf8')),'Approved geometry changed');
  await page.screenshot({path:`${output}/production-${width}.png`,fullPage:true});
  report.viewports.push({width,imagesLoaded:state.images,fonts:state.fonts,noOverflow:true,allIntrosComplete:true,originalGeometryUnchanged:existsSync(baseline)});
  await page.close();
 }
 assert.deepEqual(report.errors,[]);
 await writeFile(`${output}/production-report.json`,JSON.stringify(report,null,2));
 console.log(JSON.stringify({result:'PASS',baseURL,originalResources:report.resources.length,viewports:report.viewports,errors:report.errors},null,2));
}finally{await browser.close();}
