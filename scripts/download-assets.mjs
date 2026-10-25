import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const source = JSON.parse(await readFile(new URL('../design/figma-source.json', import.meta.url), 'utf8'));
const assetDirectory = `public/assets/${source.revision || 'original'}`;
await mkdir(assetDirectory, { recursive: true });
await mkdir('artifacts/visual', { recursive: true });
const jobs = [];
const manifest = [];
for (const frame of source.frames) {
  for (const match of frame.source.matchAll(/const (\w+) = "(https:[^"]+)";/g)) {
    const [, variable, url] = match;
    const extension = new URL(url).pathname.split('.').at(-1);
    const basename = variable.replace(/^img/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    const path = `${assetDirectory}/${frame.name}-${basename}.${extension}`;
    manifest.push({ frame: frame.name, variable, path: path.replace('public/', ''), source: url });
    jobs.push({ url, path });
  }
  if (frame.reference) jobs.push({ url: frame.reference, path: `artifacts/visual/figma-${frame.name}-${source.revision || 'original'}.png` });
}
let next = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < jobs.length) {
    const { url, path } = jobs[next++];
    if (await stat(path).then(s => s.size > 0).catch(() => false)) continue;
    await exec('curl.exe', ['--fail', '--location', '--silent', '--show-error', '--retry', '2', '--output', path, url], { maxBuffer: 1024 * 1024 });
    console.log(`Saved ${path}`);
  }
}));
await writeFile('design/assets.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Saved ${manifest.length} original assets and two Figma references.`);
