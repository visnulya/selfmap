import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';

const revision = 'letter-vessel';
const output = `artifacts/visual/${revision}/after`;
const baseURL = process.env.SELFMAP_URL || 'http://127.0.0.1:5173';
await mkdir(output, {recursive:true});
const manifest = JSON.parse(await readFile('design/assets.json','utf8'));
for (const asset of manifest) {
  if (!(await stat(`public/${asset.path}`)).size) throw new Error(`Empty asset: ${asset.path}`);
}
const browser = await chromium.launch({
  executablePath: process.env.SELFMAP_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const report = {baseURL, date:new Date().toISOString(), assets:manifest.length, viewports:[]};
const errors=[];
async function finishScheme(page){
  if(await page.locator('.selfmap').getAttribute('data-scheme-intro')!=='complete'){
    await page.locator('[data-scheme-circle="ring"]').scrollIntoViewIfNeeded();
    await page.waitForSelector('[data-scheme-intro="complete"]');
    await page.evaluate(()=>scrollTo(0,0));
  }
}
// These corrections change glyph rendering and one short line segment only.
// No existing Figma frame is allowed to move or resize.
const desktopMovedIds=[];
const joinMeasurements=JSON.parse(await readFile('design/patches/letter-vessel/join-measurements.json','utf8'));
function resizeForPreview(input, width, height) {
  const output = new PNG({width,height});
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const x0=Math.floor(x*input.width/width),x1=Math.max(x0+1,Math.floor((x+1)*input.width/width));
    const y0=Math.floor(y*input.height/height),y1=Math.max(y0+1,Math.floor((y+1)*input.height/height));
    const sums=[0,0,0];let count=0;
    for(let yy=y0;yy<Math.min(y1,input.height);yy++)for(let xx=x0;xx<Math.min(x1,input.width);xx++){
      const i=(yy*input.width+xx)*4;for(let c=0;c<3;c++)sums[c]+=input.data[i+c];count++;
    }
    const i=(y*width+x)*4;for(let c=0;c<3;c++)output.data[i+c]=Math.round(sums[c]/count);output.data[i+3]=255;
  }
  return output;
}
try {
  for (const width of [1440,402,320,375,768,899,900,1024,1280,1920,2560]) {
    const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
    page.on('pageerror',error=>errors.push(`${width}: ${error.message}`));
    const failed=[];
    page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
    await page.goto(baseURL,{waitUntil:'networkidle'});
    await page.waitForSelector('[data-hero-intro="complete"]');
    await finishScheme(page);
    await page.evaluate(async()=>{
      await document.fonts.ready;
      await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
    });
    const geometry=await page.evaluate(()=>({
      width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
      height:document.documentElement.scrollHeight,
      layout:document.querySelector('[data-layout]').dataset.layout,
      fonts:{arimo:document.fonts.check('16px Arimo'),elsie:document.fonts.check('32px Elsie')},
      images:[...document.images].map(i=>({src:new URL(i.src).pathname,loaded:i.complete&&i.naturalWidth>0,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height})),
      remoteResources:performance.getEntriesByType('resource').filter(r=>!r.name.startsWith(location.origin)).map(r=>r.name),
      animations:document.getAnimations().length,
      background: getComputedStyle(document.body).backgroundColor,
      artworkWidth: document.querySelector('.scene-viewport').getBoundingClientRect().width,
    }));
    if(geometry.scrollWidth>width)throw new Error(`Horizontal overflow at ${width}`);
    if(geometry.images.some(i=>!i.loaded))throw new Error(`Broken image at ${width}`);
    if(failed.length)throw new Error(`Failed requests: ${JSON.stringify(failed)}`);
    if(geometry.remoteResources.length)throw new Error('Runtime depends on remote resources');
    if(!geometry.fonts.arimo||!geometry.fonts.elsie)throw new Error('Font unavailable');
    if(geometry.animations)throw new Error('Unexpected animations');
    if(geometry.background!=='rgb(16, 16, 16)')throw new Error('Wrong side background color');
    await page.screenshot({path:`${output}/site-${width}.png`,fullPage:true,animations:'disabled'});
    if(geometry.layout==='mobile'){
      const screenshot=PNG.sync.read(await readFile(`${output}/site-${width}.png`));
      const scale=geometry.artworkWidth/402,offset=(width-geometry.artworkWidth)/2;
      const [a,b,c]=joinMeasurements.coefficients;
      for(let y=4111;y<=4135;y+=1/scale){
        const physicalY=Math.floor(y*scale),t=y-4100;
        const physicalX=Math.floor(offset+(a+b*t+c*t*t)*scale);
        let connected=false;
        for(let dx=-2;dx<=2;dx++){
          const i=(physicalY*screenshot.width+physicalX+dx)*4;
          if(screenshot.data[i]<160&&screenshot.data[i+1]<160&&screenshot.data[i+2]<160)connected=true;
        }
        if(!connected)throw new Error(`Vessel/line gap at ${width}px, source Y=${y}`);
      }
    }
    // Button is a native inert control and must not navigate or jump to the top.
    const button=page.getByRole('button',{name:'Подробнее о сервисе'});
    await button.scrollIntoViewIfNeeded();
    const before=await page.evaluate(()=>({y:scrollY,url:location.href}));
    await button.click({force:true});
    const after=await page.evaluate(()=>({y:scrollY,url:location.href}));
    if(before.y!==after.y||before.url!==after.url)throw new Error('Service button moved the page');
    const links=page.getByRole('link');
    const linkCount=await links.count();
    if(linkCount!==(geometry.layout==='desktop'?6:1))throw new Error(`Missing footer links at ${width}: ${linkCount}`);
    for(let i=0;i<linkCount;i++){
      const link=links.nth(i);
      if(await link.getAttribute('href')!==null)throw new Error('Placeholder link unexpectedly has href');
      await link.scrollIntoViewIfNeeded();
      const previous=await page.evaluate(()=>({y:scrollY,url:location.href}));
      await link.click({force:true});
      const current=await page.evaluate(()=>({y:scrollY,url:location.href}));
      if(previous.y!==current.y||previous.url!==current.url)throw new Error('Inactive footer link moved the page');
    }
    let comparison;
    if(width===1440||width===402){
      const name=width===1440?'desktop':'mobile';
      const referencePath=`design/patches/latest-png/${name}.png`;
      const reference=PNG.sync.read(await readFile(referencePath));
      const fullSize=PNG.sync.read(await readFile(`${output}/site-${width}.png`));
      if(fullSize.width!==width||fullSize.height!==(width===1440?6269:4980))throw new Error(`Site size mismatch: ${width}`);
      const actual=fullSize;
      if(reference.width!==actual.width||reference.height!==actual.height)throw new Error(`Reference size mismatch: ${width}`);
      const overlay=new PNG({width:actual.width,height:actual.height});
      const diff=new PNG({width:actual.width,height:actual.height});
      let sum=0,different=0;
      for(let i=0;i<actual.data.length;i+=4){
        let max=0;
        for(let c=0;c<3;c++){
          const d=Math.abs(actual.data[i+c]-reference.data[i+c]);sum+=d;max=Math.max(max,d);
          overlay.data[i+c]=Math.round((actual.data[i+c]+reference.data[i+c])/2);
          diff.data[i+c]=c===0?Math.min(255,max*3):Math.round(reference.data[i+c]*.15);
        }
        overlay.data[i+3]=255;diff.data[i+3]=255;
        if(max>20)different++;
      }
      const beforeImage=PNG.sync.read(await readFile(`artifacts/visual/letter-vessel/before/site-${width}.png`));
      const beforeNodes=JSON.parse(await readFile(`artifacts/visual/letter-vessel/before/nodes-${width}.json`,'utf8'));
      const afterNodes=await page.evaluate(()=>[...document.querySelectorAll('[data-node-id]')].map(n=>{const r=n.getBoundingClientRect();return{id:n.dataset.nodeId,x:r.x,y:r.y+scrollY,width:r.width,height:r.height};}));
      // Coordinates are page-relative even after the button/link checks scroll.
      const beforeById=new Map(beforeNodes.map(n=>[n.id,n]));
      const afterById=new Map(afterNodes.map(n=>[n.id,n]));
      const allowed=width===1440?[
        {x:710,y:1490,width:320,height:175},
        {x:675,y:1320,width:425,height:165},
        {x:940,y:1105,width:330,height:315},
        {x:1270,y:1210,width:145,height:370},
      ]:[{x:220,y:4107,width:20,height:34}];
      let outsidePatchPixels=0;
      for(let y=0;y<actual.height;y++)for(let x=0;x<actual.width;x++){
        if(allowed.some(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height))continue;
        const i=(y*actual.width+x)*4;
        if([0,1,2].some(c=>actual.data[i+c]!==beforeImage.data[i+c]))outsidePatchPixels++;
      }
      const movedUnexpectedly=afterNodes.filter(n=>{
        if(width===1440&&desktopMovedIds.includes(n.id))return false;
        const b=beforeById.get(n.id);if(b&&!b.width&&!b.height&&!n.width&&!n.height)return false;
        return b&&['x','y','width','height'].some(k=>Math.abs(n[k]-b[k])>.01);
      });
      if(outsidePatchPixels||movedUnexpectedly.length)throw new Error(`Out-of-scope change at ${width}: ${outsidePatchPixels} pixels, ${movedUnexpectedly.length} nodes`);
      comparison={resolution:'full-user-png',meanAbsoluteChannelDifference:sum/(actual.width*actual.height*3),pixelsDifferentOver20Percent:different/(actual.width*actual.height)*100,outsidePatchPixels,unexpectedlyMovedNodes:movedUnexpectedly.length};
      await writeFile(`${output}/overlay-${name}.png`,PNG.sync.write(overlay));
      await writeFile(`${output}/difference-${name}.png`,PNG.sync.write(diff));
    }
    report.viewports.push({...geometry,comparison,buttonStable:true,inactiveLinks:linkCount,vesselConnected:geometry.layout==='mobile'?true:undefined});
    console.log(`${width}px: ${geometry.layout}, height ${geometry.height}, ${geometry.images.length} images; ${comparison?JSON.stringify(comparison):'responsive checks passed'}`);
    await page.close();
  }
  const resizingPage=await browser.newPage({viewport:{width:402,height:900},deviceScaleFactor:1});
  resizingPage.on('pageerror',error=>errors.push(error.message));
  await resizingPage.goto(baseURL,{waitUntil:'networkidle'});
  await resizingPage.waitForSelector('[data-hero-intro="complete"]');
  await finishScheme(resizingPage);
  report.liveResizing=[];
  for(const width of [1440,768,1024,402]){
    await resizingPage.setViewportSize({width,height:900});
    await resizingPage.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const result=await resizingPage.evaluate(()=>{
      const viewport=document.querySelector('.scene-viewport').getBoundingClientRect();
      const artwork=document.querySelector('.figma-scene').getBoundingClientRect();
      return {width:innerWidth,layout:document.querySelector('[data-layout]').dataset.layout,viewportWidth:viewport.width,artworkWidth:artwork.width,overflow:document.documentElement.scrollWidth>innerWidth};
    });
    if(result.overflow||Math.abs(result.viewportWidth-result.artworkWidth)>.1)throw new Error(`Live resizing failed at ${width}`);
    report.liveResizing.push(result);
  }
  await resizingPage.close();
  for(const [name,width,y,clip] of [
    ['desktop-detail-2x',1440,1100,{x:680,y:0,width:760,height:910}],
    ['mobile-detail-2x',402,3845,{x:0,y:0,width:402,height:650}],
  ]){
    const detailPage=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:2});
    await detailPage.goto(baseURL,{waitUntil:'networkidle'});
    await detailPage.waitForSelector('[data-hero-intro="complete"]');
    await finishScheme(detailPage);
    await detailPage.evaluate(async y=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));window.scrollTo(0,y);},y);
    await detailPage.screenshot({path:`${output}/${name}.png`,clip});
    await detailPage.close();
  }
  if(errors.length)throw new Error(errors.join('\n'));
  report.errors=errors;
  await writeFile(`${output}/report.json`,JSON.stringify(report,null,2)+'\n');
} finally {await browser.close();}
