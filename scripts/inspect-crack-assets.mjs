import {chromium} from 'playwright';
import {readFile,mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
const page=await browser.newPage({viewport:{width:500,height:900}});
const body=await readFile('public/assets/crack-animation/vessel-clean-mobile.svg','utf8');
const crack=await readFile('public/assets/crack-animation/crack-mobile.svg','utf8');
await page.setContent(`<style>body{margin:0;background:#fffaf5}svg{position:absolute;left:0;top:0}</style>${body}${crack}`);
console.log(await page.locator('path').evaluateAll(nodes=>nodes.map(node=>{let r=node.getBBox();return{x:r.x,y:r.y,width:r.width,height:r.height};})));
await mkdir('artifacts/visual/crack-intro',{recursive:true});
await page.screenshot({path:'artifacts/visual/crack-intro/supplied-layers.png'});
}finally{await browser.close();}
