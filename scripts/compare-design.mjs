import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parse} from '@babel/parser';
const old=JSON.parse(await readFile('design/history/2026-10-24/figma-source.json','utf8'));
const current=JSON.parse(await readFile('design/figma-source.json','utf8'));
const textLayout=JSON.parse(await readFile('design/history/2026-10-24/text-layout.json','utf8'));
const normalize=s=>s.replace(/\u200b/g,'').replace(/\s+/g,' ').trim();
function nodes(code){
 const result=new Map();
 const ast=parse(code,{sourceType:'module',plugins:['jsx']});
 function text(n){
  if(n.type==='JSXText')return n.value.trim()+' ';
  if(n.type==='StringLiteral')return n.value;
  if(n.type==='TemplateLiteral')return n.quasis.map(q=>q.value.cooked).join('');
  if(n.type==='JSXExpressionContainer')return text(n.expression);
  return (n.children||[]).map(text).join(' ');
 }
 function walk(n){if(!n||typeof n!=='object')return;if(n.type==='JSXElement'){
  const attrs=Object.fromEntries(n.openingElement.attributes.filter(a=>a.type==='JSXAttribute').map(a=>[a.name.name,a.value?.value]));
  if(attrs['data-node-id'])result.set(attrs['data-node-id'],{id:attrs['data-node-id'],classes:attrs.className,text:normalize(text(n)),images:[...code.slice(n.start,n.end).matchAll(/src=\{(\w+)\}/g)].map(m=>m[1])});
 }for(const [k,v]of Object.entries(n)){if(k==='loc')continue;if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}
 walk(ast);return result;
}
const report={revision:current.revision,frames:[],textMetricsReused:[],textMetricsRebuilt:[]};
const reusable={};
for(const frame of current.frames){
 const before=nodes(old.frames.find(f=>f.name===frame.name).source),after=nodes(frame.source);
 const added=[],removed=[],changed=[];
 for(const [id,n]of after){const prev=before.get(id);if(!prev)added.push(n);else if(JSON.stringify(prev)!==JSON.stringify(n))changed.push({id,before:prev,after:n});
  const t=textLayout[id];
  if(t&&/font-/.test(n.classes||'')){
   const fontSize=Number(n.classes.match(/text-\[(\d+(?:\.\d+)?)px\]/)?.[1]);
   const width=Number(n.classes.match(/w-\[([\d.]+)px\]/)?.[1]||t.width);
   const sameMetrics=prev&&fontSize===t.fontSize&&width===t.width&&normalize(t.text)===n.text&&prev.classes.match(/leading-\[[^\]]+\]/)?.[0]===n.classes.match(/leading-\[[^\]]+\]/)?.[0];
   if(sameMetrics){reusable[id]=t;report.textMetricsReused.push(id);}else report.textMetricsRebuilt.push(id);
  }
 }
 for(const [id,n]of before)if(!after.has(id))removed.push(n);
 report.frames.push({name:frame.name,width:frame.width,height:frame.height,added,removed,changed});
}
const previousAssets=JSON.parse(await readFile('design/history/2026-10-24/assets.json','utf8'));
const assets=JSON.parse(await readFile('design/assets.json','utf8'));
const hash=async a=>createHash('sha256').update(await readFile(`public/${a.path}`)).digest('hex');
const previousHashes=new Set(await Promise.all(previousAssets.map(hash)));
report.assets=await Promise.all(assets.map(async a=>({...a,unchangedContent:previousHashes.has(await hash(a))})));
report.limitations=['Figma Starter call quota prevented fresh per-node baseline exports and full-resolution mobile screenshot. Reused text baselines only when fresh context confirms identical text, font size, width and line spacing. Mobile visual comparison uses current integration preview.'];
await writeFile('design/change-report.json',JSON.stringify(report,null,2)+'\n');
await writeFile('src/data/text-layout.json',JSON.stringify(reusable,null,2)+'\n');
for(const f of report.frames)console.log(`${f.name}: ${f.added.length} added, ${f.removed.length} removed, ${f.changed.length} changed layer records`);
console.log(`${Object.keys(reusable).length} validated text layouts reused; ${report.textMetricsRebuilt.length} changed text layouts use current context.`);
console.log(`${report.assets.filter(a=>!a.unchangedContent).length} of ${assets.length} assets have new content.`);
