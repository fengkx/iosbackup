import { readFile, writeFile, mkdir, rm, copyFile, mkdtemp, lstat, realpath } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { pages, repository } from '../content-map.mjs';
import { transform } from './content.mjs';
import { releaseSourceLock, reviewedWebsiteRevision } from './source.mjs';

const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root=path.resolve(site,'..');
const release=process.argv.includes('--release');
const savedLock=JSON.parse(await readFile(path.join(site,'source-lock.json'),'utf8'));
// 先验证生产输入；未审核来源时不下载，也不覆盖已有预览产物。
const lock=release ? releaseSourceLock(savedLock,process.env) : savedLock;
const git=(args,cwd=root)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
let sourceRoot=root, temporary, websiteCommit=null;
try {
if(release) {
  websiteCommit=reviewedWebsiteRevision(root);
  temporary=await mkdtemp(path.join(tmpdir(),'iosbackup-site-'));
  sourceRoot=temporary;
  git(['init','--quiet'],sourceRoot);
  git(['remote','add','origin',`${repository}.git`],sourceRoot);
  git(['fetch','--quiet','--no-tags','origin',lock.docsCommit],sourceRoot);
  git(['checkout','--quiet','--detach','FETCH_HEAD'],sourceRoot);
  git(['fetch','--quiet','--no-tags','origin',`refs/tags/${lock.productVersion}:refs/tags/${lock.productVersion}`],sourceRoot);
  const versionFile=await readFile(path.join(sourceRoot,'release/manifest.env'),'utf8');
  if(!versionFile.split('\n').includes(`IOSBK_VERSION=${lock.productVersion}`))
    throw new Error('Reviewed docs commit describes a different product version');
}
  const contentDir=path.join(site,'src/content/docs');
  const assetDir=path.join(site,'public/manual-assets');
  await rm(contentDir,{recursive:true,force:true});
  await rm(assetDir,{recursive:true,force:true});
  await mkdir(path.join(site,'src/generated'),{recursive:true});
  const meta={mode:release?'release':'workspace-preview', productVersion:lock.productVersion,
    docsCommit:release?lock.docsCommit:null, websiteCommit, pages:[]};
  const assets=new Set();
  async function safeRead(source) {
    const file=path.join(sourceRoot,source);
    if(!(await lstat(file)).isFile() || !(await realpath(file)).startsWith(`${await realpath(sourceRoot)}${path.sep}`))
      throw new Error(`Source must be a regular file inside repository: ${source}`);
    return readFile(file);
  }
  for(const page of pages) {
    const input=await safeRead(page.source);
    const converted=await transform(input.toString(),{...page,pages,productVersion:lock.productVersion,docsRef:release?lock.docsCommit:'main'});
    for(const asset of converted.assets) assets.add(asset);
    let updated=false;
    const tracked=git(['ls-files','--',page.source],sourceRoot);
    const changed=!release && (git(['status','--porcelain','--',page.source],sourceRoot) !== '');
    if(tracked && !changed) updated=git(['log','-1','--format=%cI','--',page.source],sourceRoot) || false;
    const sha256=createHash('sha256').update(input).digest('hex');
    meta.pages.push({...page,title:converted.title,updated,sha256});
    const frontmatter={title:converted.title,description:page.label,editUrl:`${repository}/edit/main/${page.source}`,
      lastUpdated:updated, sidebar:{label:page.label}};
    // JSON 的字符串标量也是有效 YAML，避免标题/路径中的引号破坏 frontmatter。
    const yaml=Object.entries(frontmatter).map(([key,value])=>`${key}: ${key==='lastUpdated' && value ? value : JSON.stringify(value)}`).join('\n');
    const output=path.join(contentDir,page.locale,'docs',`${page.id}.md`);
    await mkdir(path.dirname(output),{recursive:true});
    await writeFile(output,`---\n${yaml}\n---\n\n${converted.body}`);
  }
  for(const asset of assets) {
    const data=await safeRead(asset);
    const dest=path.join(assetDir,asset);
    await mkdir(path.dirname(dest),{recursive:true});
    await writeFile(dest,data);
  }
  await writeFile(path.join(site,'src/generated/build.json'),JSON.stringify(meta,null,2)+'\n');
  await copyFile(path.join(site,'src/generated/build.json'),path.join(site,'public/source.json'));
  await writeFile(path.join(site,'public/robots.txt'),release ? 'User-agent: *\nAllow: /\nSitemap: https://iosbackup.isw.app/sitemap-index.xml\n' : 'User-agent: *\nDisallow: /\n');
  await writeFile(path.join(site,'public/_headers'),`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n${release?'':'  X-Robots-Tag: noindex, nofollow\n'}`);
  console.log(`Prepared ${pages.length} pages and ${assets.size} referenced images (${meta.mode}).`);
} finally {
  if(temporary) await rm(temporary,{recursive:true,force:true});
}
