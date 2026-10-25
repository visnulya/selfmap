import{chromium}from'playwright';
import assert from'node:assert/strict';
import{writeFile}from'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const report=[];
try{for(const width of[1440,402]){
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.addInitScript(()=>{window.crackAudit=[];for(const type of['animationstart','animationend'])addEventListener(type,e=>{if(e.animationName==='crack-development')window.crackAudit.push({type,time:performance.now()});},true);});
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 await page.waitForSelector('[data-hero-intro="complete"]');
 await page.locator(width>=900?'[data-node-id="1529:55"]':'[data-node-id="1567:208"]').scrollIntoViewIfNeeded();
 await page.waitForSelector('[data-crack-intro="complete"]');
 const events=await page.evaluate(()=>window.crackAudit);
 assert.equal(events.length,2);assert.equal(events[0].type,'animationstart');assert.equal(events[1].type,'animationend');
 const duration=events[1].time-events[0].time;assert.ok(Math.abs(duration-1800)<150);
 await page.evaluate(()=>scrollTo(0,0));await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>window.crackAudit.length),2);
 report.push({width,duration,noReplay:true});await page.close();
}
await writeFile('artifacts/visual/crack-intro/timing.json',JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close();}
