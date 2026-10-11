import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { pages } from '../content-map.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const meta=JSON.parse(await readFile(path.join(root,'source.json'),'utf8'));
const errors=[];
async function files(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(path.join(dir,e.name)):path.join(dir,e.name)))).flat()}
const htmlFiles=(await files(root)).filter(f=>f.endsWith('.html'));
const documents=new Map();
for(const file of htmlFiles) documents.set(file,load(await readFile(file,'utf8')));
for(const page of pages) if(!documents.has(path.join(root,page.route,'index.html'))) errors.push(`Missing page: ${page.route}`);
for(const [file,$] of documents) {
 const relative=path.relative(root,file);
 const pagePath='/'+relative.replace(/index\.html$/,'');
 if(!relative.includes('404') && $('h1').length!==1) errors.push(`${relative}: expected one h1`);
 if(/^en\//.test(relative) && $('html').attr('lang')!=='en') errors.push(`${relative}: English language missing`);
 if(/^zh-cn\//.test(relative) && $('html').attr('lang')!=='zh-CN') errors.push(`${relative}: Chinese language missing`);
 if(meta.mode!=='release' && !$('meta[name="robots"]').attr('content')?.includes('noindex')) errors.push(`${relative}: preview indexable`);
 const ids=new Set();
 $('[id]').each((_,el)=>{const id=$(el).attr('id');if(ids.has(id))errors.push(`${relative}: duplicate #${id}`);ids.add(id)});
 for(const el of $('a[href],img[src],script[src],link[href]').toArray()){
  const value=$(el).attr('href')||$(el).attr('src');
  if(!value || /^(mailto:|data:)/.test(value))continue;
  let url;try{url=new URL(value,`https://iosbackup.isw.app${pagePath}`)}catch{errors.push(`${relative}: bad URL ${value}`);continue}
  if(url.origin!=='https://iosbackup.isw.app')continue;
  const pathname=decodeURIComponent(url.pathname);
  const dest=path.join(root,pathname.endsWith('/')?pathname+'index.html':pathname);
  let exists=true;try{await stat(dest)}catch{exists=false}
  if(!exists){errors.push(`${relative}: missing ${value}`);continue}
  if(url.hash && documents.has(dest) && !documents.get(dest)(`[id="${decodeURIComponent(url.hash.slice(1)).replaceAll('"','\\"')}"]`).length)
    errors.push(`${relative}: missing anchor ${value}`);
 }
}
const forbidden=/(^|\/)(CONTEXT\.md|AGENTS\.md|adr|qa|plans|research|designs)(\/|$)/;
for(const file of await files(root))if(forbidden.test(path.relative(root,file)))errors.push(`Private output: ${file}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Checked ${htmlFiles.length} HTML pages: local links, assets, anchors, language, metadata, private paths. Mode: ${meta.mode}.`);

// 根入口仅分流语言；语言首页在 sitemap 内应有唯一、对称的替代地址。
const sitemap=load(await readFile(path.join(root,'sitemap-0.xml'),'utf8'),{xml:true});
let localizedHomes=0;
for(const entry of sitemap('url').toArray()) {
 const item=sitemap(entry),loc=item.find('loc').text();
 if(loc==='https://iosbackup.isw.app/') throw new Error('Language router must not duplicate the English sitemap home');
 const alternatives=item.find('xhtml\\:link').toArray().map(link=>sitemap(link).attr('hreflang'));
 if(new Set(alternatives).size!==alternatives.length)throw new Error(`Duplicate hreflang in sitemap: ${loc}`);
 if(/^https:\/\/iosbackup\.isw\.app\/(en|zh-cn)\/$/.test(loc)) {
  localizedHomes++;
  if(!alternatives.includes('en')||!alternatives.includes('zh-CN'))throw new Error(`Missing homepage translation: ${loc}`);
 }
}
if(localizedHomes!==2)throw new Error('Sitemap must contain both localized homepages');
console.log('Sitemap language alternatives are unique and both homepages are present.');
