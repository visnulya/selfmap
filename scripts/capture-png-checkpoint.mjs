import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const output=process.argv[2] || 'artifacts/visual/latest-png/before';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{for(const width of [1440,402]){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
 await page.screenshot({path:`${output}/site-${width}.png`,fullPage:true});
 const nodes=await page.evaluate(()=>[...document.querySelectorAll('[data-node-id]')].map(n=>{const r=n.getBoundingClientRect();return{id:n.dataset.nodeId,x:r.x,y:r.y,width:r.width,height:r.height};}));
 await writeFile(`${output}/nodes-${width}.json`,JSON.stringify(nodes,null,2));await page.close();
}}finally{await browser.close();}
