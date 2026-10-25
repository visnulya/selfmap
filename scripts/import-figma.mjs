// One-time importer: translates Figma's reference JSX to ordinary project CSS.
// No Tailwind is installed or used by the site. Re-running restores the imported geometry.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const source = JSON.parse(await readFile('design/figma-source.json', 'utf8'));
const assets = JSON.parse(await readFile('design/assets.json', 'utf8'));
const textLayout = JSON.parse(await readFile('src/data/text-layout.json', 'utf8'));
const exact = {
  absolute: 'position:absolute', relative: 'position:relative', block: 'display:block',
  contents: 'display:contents', flex: 'display:flex', 'flex-none': 'flex:none',
  'items-center': 'align-items:center', 'justify-center': 'justify-content:center',
  'size-full': 'width:100%;height:100%', 'inset-0': 'inset:0',
  'max-w-none': 'max-width:none', 'object-cover': 'object-fit:cover',
  'object-bottom': 'object-position:bottom', 'pointer-events-none': 'pointer-events:none',
  'overflow-hidden': 'overflow:hidden', 'font-normal': 'font-weight:400',
  'not-italic': 'font-style:normal', 'text-center': 'text-align:center',
  'text-white': 'color:#fff', 'text-black': 'color:#000',
  'bg-black': 'background-color:#000', 'whitespace-nowrap': 'white-space:nowrap',
  'whitespace-pre-wrap': 'white-space:pre-wrap', 'mb-0': 'margin-bottom:0',
  'h-0': 'height:0', 'w-0': 'width:0', 'w-full': 'width:100%', 'left-0': 'left:0', 'top-0': 'top:0',
  'opacity-95': 'opacity:.95', uppercase: 'text-transform:uppercase',
  'border-0': 'border-width:0', 'border-solid': 'border-style:solid',
  'border-white': 'border-color:#fff', '[word-break:break-word]': 'overflow-wrap:break-word',
  '-translate-x-1/2': '--layer-translate-x:-50%', '-scale-y-100': '--layer-scale-y:-1',
};
function declarations(classes) {
  const out = []; let transform = false;
  for (const token of classes.split(/\s+/)) {
    if (token in exact) { out.push(exact[token]); if (/translate|scale/.test(token)) transform = true; continue; }
    const font = token.match(/^font-\['([^:]+):([^']+)'\]$/);
    if (font) { out.push(`font-family:'${font[1]}',sans-serif`); continue; }
    const rotation = token.match(/^(-?)rotate-(?:\[([^\]]+)\]|(\d+))$/);
    if (rotation) { out.push(`--layer-rotation:${rotation[1]}${rotation[2] || rotation[3] + 'deg'}`); transform = true; continue; }
    const arbitrary = token.match(/^([a-z]+)-\[(.*)\]$/);
    if (arbitrary) {
      const [, prefix, raw] = arbitrary; const value = raw.replaceAll('_', ' ');
      const property = {h:'height',w:'width',top:'top',left:'left',inset:'inset',rounded:'border-radius',leading:'line-height',bg:'background-color'}[prefix];
      if (property) out.push(`${property}:${value}`);
      else if (prefix === 'size') out.push(`width:${value};height:${value}`);
      else if (prefix === 'text') out.push(`${/^#|transparent/.test(value) ? 'color' : 'font-size'}:${value}`);
      else throw new Error(`Unsupported Figma property: ${token}`);
      continue;
    }
    throw new Error(`Unsupported Figma class: ${token}`);
  }
  if (transform) out.push('transform:translateX(var(--layer-translate-x,0)) rotate(var(--layer-rotation,0deg)) scaleY(var(--layer-scale-y,1))');
  return out.join(';');
}
function splitLayers(body) {
  const layers = []; let depth = 0; let start = 0;
  for (const match of body.matchAll(/<\/?[A-Za-z][^>]*>/g)) {
    const tag = match[0]; const close = tag.startsWith('</'); const self = tag.endsWith('/>');
    if (!close && depth === 0) start = match.index;
    if (close) depth--; else if (!self) depth++;
    if (depth === 0) layers.push(body.slice(start, match.index + tag.length));
  }
  if (depth !== 0) throw new Error('Unbalanced source JSX');
  return layers;
}
const labels = { Hero:'Первый экран', Origins:'Раньше было лучше', Boundaries:'Личные границы', Archetypes:'Женские образы', Vessel:'Человек как сосуд', Projects:'Наши проекты', Footer:'Подвал' };
const headingIds = new Map([['1428:88',1],['1317:119',1],['1428:106',2],['1331:172',2],['1428:168',2],['1426:36',2],['1428:257',2],['1427:38',2],['1428:274',2],['1335:204',2],['1527:41',2]]);
for (const frame of source.frames) {
  const capital = frame.name[0].toUpperCase() + frame.name.slice(1);
  const folder = `src/components/scenes/${frame.name}`;
  await mkdir(folder, {recursive:true});
  const css = []; let classIndex = 0;
  let code = frame.source.replace(/className="([^"]+)"/g, (_, classes) => {
    const name = `${frame.name}-style-${String(++classIndex).padStart(3,'0')}`;
    css.push(`.${name}{${declarations(classes)}}`);
    return `className="${name}"`;
  });
  // Keep text editable while retaining the actual line breaks and baseline
  // positions exported from each TEXT node (not rasterized screenshots).
  for (const nodeId of Object.keys(textLayout)) {
    const opening = code.match(new RegExp('<(p|div)[^>]*data-node-id="' + nodeId + '"[^>]*>'));
    if (!opening) continue;
    let depth = 0; let end;
    for (const tag of code.slice(opening.index).matchAll(/<\/?[A-Za-z][^>]*>/g)) {
      if (tag[0].startsWith('</')) depth--;
      else if (!tag[0].endsWith('/>')) depth++;
      if (depth === 0) { end = opening.index + tag.index + tag[0].length; break; }
    }
    const attributes = opening[0].replace(/^<(p|div)/,'').slice(0,-1);
    code = code.slice(0,opening.index) + `<FigmaText nodeId="${nodeId}"${attributes} />` + code.slice(end);
  }
  const root = code.match(/return \(\s*<div[^>]+>/);
  const rootStart = root.index + root[0].indexOf('<div');
  const openEnd = code.indexOf('>', rootStart) + 1;
  const body = code.slice(openEnd, code.lastIndexOf('</div>'));
  const constants = code.slice(0, code.indexOf('export default')).trim().replace(/const (\w+) = "https:[^"]+";/g, (_, variable) => {
    const asset = assets.find(a => a.frame === frame.name && a.variable === variable);
    if (!asset) throw new Error(`Missing ${variable}`);
    return `const ${variable} = ${JSON.stringify('/' + asset.path)};`;
  });
  const groups = new Map(Object.keys(labels).map(key => [key,[]]));
  let paintOrder = 0;
  for (let layer of splitLayers(body)) {
    const opening = layer.slice(0, layer.indexOf('>') + 1);
    const nodeId = opening.match(/data-node-id="([^"]+)"/)?.[1];
    // The original class still contains the exact canvas Y coordinate.
    const originalOpening = frame.source.match(new RegExp('<[^>]+data-node-id="' + nodeId + '"[^>]*>'))?.[0] || '';
    const y = Number(originalOpening.match(/top-\[([\d.-]+)px\]/)?.[1] || 0);
    let section;
    if (frame.name === 'desktop') section = y >= 5970 ? 'Footer' : y >= 5643 && ['1527:40','1527:41'].includes(nodeId) ? 'Projects' : y >= 4618 ? 'Vessel' : y >= 3099 ? 'Archetypes' : y >= 2000 ? 'Boundaries' : y >= 1000 ? 'Origins' : 'Hero';
    else section = y >= 4740 ? 'Footer' : y >= 3655 ? 'Vessel' : y >= 2865 ? 'Archetypes' : y >= 1914 ? 'Boundaries' : y >= 995 ? 'Origins' : 'Hero';
    const isContents = originalOpening.includes(' contents ');
    layer = layer.replace(/className="([^"]+)"/, `className="$1 figma-layer" style={{ '--paint-order': ${++paintOrder} }}${isContents ? ' data-layer-group="true"' : ''}`);
    if (headingIds.has(nodeId)) layer = layer.replace('data-node-id=', `role="heading" aria-level={${headingIds.get(nodeId)}} data-node-id=`);
    const buttonId = frame.name === 'desktop' ? '1428:270' : '1332:201';
    if (nodeId === buttonId) layer = layer.replace(/^<div/, '<ServiceButton');
    if (['1340:509', '1548:129'].includes(nodeId)) layer = layer.replace('<FigmaText', '<FigmaText as={PreparedLink} linkKey="privacy"');
    if (nodeId === '1527:40') layer = layer.replace('<FigmaText', '<ProjectLinks');
    if (['1428:271','1428:272','1333:202','1335:203'].includes(nodeId)) layer = layer.replace('data-node-id=', 'aria-hidden="true" data-node-id=');
    groups.get(section).push(layer);
  }
  const imports=[]; const children=[];
  for (const [key,layers] of groups) {
    if (!layers.length) continue;
    const name = capital + key;
    imports.push(`import ${name} from './${frame.name}/${key}.jsx';`);
    children.push(`      <${name} />`);
    const sectionMarkup = layers.join('\n      ');
    const sectionConstants = constants.split('\n').filter(line => {
      const variable = line.match(/^const (\w+)/)?.[1];
      return variable && sectionMarkup.includes(`{${variable}}`);
    }).join('\n');
    const buttonImport = sectionMarkup.includes('<ServiceButton') ? "import ServiceButton from '../../ServiceButton.jsx';\n" : '';
    const textImport = sectionMarkup.includes('<FigmaText') ? "import FigmaText from '../../FigmaText.jsx';\n" : '';
    const linkImport = sectionMarkup.includes('as={PreparedLink}') ? "import PreparedLink from '../../PreparedLink.jsx';\n" : '';
    const projectsImport = sectionMarkup.includes('<ProjectLinks') ? "import ProjectLinks from '../../ProjectLinks.jsx';\n" : '';
    await writeFile(`${folder}/${key}.jsx`, `${buttonImport}${textImport}${linkImport}${projectsImport}${sectionConstants}\n\n// Figma layers retain their original global paint order across sections.\nexport default function ${name}() {\n  return (\n    <section className="scene-section" data-section="${key.toLowerCase()}" aria-label="${labels[key]}">\n      ${sectionMarkup}\n    </section>\n  );\n}\n`);
  }
  await writeFile(`src/components/scenes/${capital}Scene.jsx`, `${imports.join('\n')}\nimport './${frame.name}.css';\n\nexport default function ${capital}Scene() {\n  return (\n    <div className="figma-scene figma-scene--${frame.name}" data-node-id="${frame.nodeId}" data-layout="${frame.name}">\n${children.join('\n')}\n    </div>\n  );\n}\n`);
  await writeFile(`src/components/scenes/${frame.name}.css`, `/* Exact geometry from approved Figma frame ${frame.nodeId} (${frame.width} × ${frame.height}). */\n${css.join('\n')}\n`);
}
console.log('Imported both approved Figma scenes into section components and plain CSS.');
