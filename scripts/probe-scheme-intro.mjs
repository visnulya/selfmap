import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('artifacts/visual/scheme-intro/probe',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{for(const width of [1440,402]){
 const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('[data-hero-intro="complete"]');
 console.log(width,'at top',await page.locator('.selfmap').getAttribute('data-scheme-intro'));
 const scroll=width===1440?1100:1150;
 await page.evaluate(y=>scrollTo(0,y),scroll);
 await page.waitForSelector('[data-scheme-intro="running"]');
 const start=Date.now();
 for(const target of [0,450,800,1300,1850,2350]){
  if(Date.now()-start<target)await page.waitForTimeout(target-(Date.now()-start));
  const data=await page.evaluate(()=>({state:document.querySelector('.selfmap').dataset.schemeIntro,lines:[...document.querySelectorAll('[data-scheme-line]')].map(n=>({name:n.dataset.schemeLine,clip:getComputedStyle(n).clipPath,opacity:getComputedStyle(n).opacity,visibility:getComputedStyle(n).visibility})),labels:[...document.querySelectorAll('[data-scheme-label]')].map(n=>({name:n.dataset.schemeLabel,opacity:getComputedStyle(n.querySelector('p')).opacity}))}));
  console.log(width,target,JSON.stringify(data));
  await page.screenshot({path:`artifacts/visual/scheme-intro/probe/${width}-${target}.png`});
 }
 await page.close();
}}finally{await browser.close();}
