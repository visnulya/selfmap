import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {readFile,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const ref=PNG.sync.read(await readFile('artifacts/visual/figma-mobile.png'));
const cases={default:'',precision:'.figma-scene{text-rendering:geometricPrecision}',legibility:'.figma-scene{text-rendering:optimizeLegibility}',spacing01:'.figma-scene{letter-spacing:.01px}',spacing02:'.figma-scene{letter-spacing:.02px}',spacing03:'.figma-scene{letter-spacing:.03px}',spacing04:'.figma-scene{letter-spacing:.04px}',precisionSpacing:'.figma-scene{text-rendering:geometricPrecision;letter-spacing:.01px}'};
const report=[];
try{for(const [name,css]of Object.entries(cases)){
  const page=await browser.newPage({viewport:{width:402,height:900},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  if(css)await page.addStyleTag({content:css});
  const actual=PNG.sync.read(await page.screenshot({fullPage:true}));
  let sum=0,n=0;
  for(const [x,y,w,h]of [[19,3274,364,290],[23,995,351,200],[23,1675,343,230]]){
    for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++)for(let c=0;c<3;c++){const i=(row*402+col)*4+c;sum+=Math.abs(actual.data[i]-ref.data[i]);n++;}
  }
  report.push({name,meanTextDifference:sum/n});
  await writeFile(`artifacts/visual/probe-${name}.png`,PNG.sync.write(actual));
  await page.close();
}}finally{await browser.close();}
console.log(JSON.stringify(report,null,2));
