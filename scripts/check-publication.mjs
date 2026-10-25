import {execFileSync} from 'node:child_process';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
const files=execFileSync('git',['ls-files','--cached','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
if(!files.length)throw new Error('Stage the intended publication files first.');
const findings=[];
const tokens=[/gh[pousr]_[A-Za-z0-9]{30,}/,/github_pat_[A-Za-z0-9_]{50,}/,/AKIA[0-9A-Z]{16}/,/xox[baprs]-[A-Za-z0-9-]{20,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];
let bytes=0;
for(const path of files){
 if(/(?:^|\/)(?:node_modules|dist|artifacts|checkpoints|design|\.vite|\.cache|\.aws|\.codex)(?:\/|$)|(?:^|\/)\.env(?:\.|$)|\.(?:zip|7z|log|tmp|base64|pem|key|p12|pfx)$/i.test(path))findings.push({path,reason:'Excluded local file staged'});
 const info=await stat(path);bytes+=info.size;
 if(info.size>=95*1024*1024)findings.push({path,reason:'Oversized file'});
 if(!/\.(?:png|jpg|jpeg|webp|gif|ttf|woff2?|ico)$/i.test(path)){
  const text=execFileSync('git',['show',`:${path}`],{encoding:'utf8',maxBuffer:8*1024*1024});
  if(tokens.some(pattern=>pattern.test(text)))findings.push({path,reason:'Possible credential; inspect before publication'});
 }
}
await mkdir('artifacts/publication',{recursive:true});
await writeFile('artifacts/publication/staged-files.txt',files.join('\n')+'\n');
await writeFile('artifacts/publication/preflight.json',JSON.stringify({files:files.length,bytes,findings},null,2));
if(findings.length)throw new Error(JSON.stringify(findings));
console.log(JSON.stringify({result:'PASS',stagedFiles:files.length,bytes,credentialPatternsFound:0,excludedFilesStaged:0},null,2));
