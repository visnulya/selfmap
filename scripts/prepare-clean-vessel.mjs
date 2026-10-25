import{chromium}from'playwright';
import{PNG}from'pngjs';
import{readFile,writeFile}from'node:fs/promises';
const source=PNG.sync.read(await readFile('public/assets/2026-10-25/mobile-group651.png'));
const body=await readFile('public/assets/crack-animation/vessel-clean-mobile.svg','utf8');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:462,height:819},deviceScaleFactor:1});
 const scale=819/628;
 await page.setContent(`<style>html,body{margin:0;background:transparent;overflow:hidden}svg{position:absolute;left:${-26*scale}px;top:${-29*scale}px;width:${400*scale}px;height:${675*scale}px}</style>${body}`);
 const clean=PNG.sync.read(await page.screenshot({omitBackground:true}));
 let changed=0;
 for(let i=0;i<source.data.length;i+=4){
  const [r,g,b,a]=source.data.subarray(i,i+4);
  if(a&&Math.max(r,g,b)>16&&Math.max(r,g,b)-Math.min(r,g,b)<=3){source.data.set(clean.data.subarray(i,i+4),i);changed++;}
 }
 await writeFile('public/assets/crack-animation/mobile-vessel-clean-matched.png',PNG.sync.write(source));
 console.log({replacedCrackPixels:changed,allOtherSourcePixelsUnchanged:true});
}finally{await browser.close();}
