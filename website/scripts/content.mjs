import path from 'node:path';
import { remark } from 'remark';
import gfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import { publicReferences, repository } from '../content-map.mjs';

export function validateLock(lock) {
  if (!/^v\d+\.\d+\.\d+$/.test(lock.productVersion || '')) throw new Error('A released product tag is required');
  if (typeof lock.docsCommit !== 'string' || !/^[a-f0-9]{40}$/.test(lock.docsCommit))
    throw new Error('Production requires a reviewed, exact public docsCommit SHA (source-lock.json or IOSBK_SITE_DOCS_COMMIT)');
}

export function resolveReference(url, opts) {
  if (/^(https?:|mailto:)/i.test(url) || url.startsWith('#')) return {url};
  if (/^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith('/') || url.includes('\\')) throw new Error(`Reference not public: ${url}`);
  const match = url.match(/^([^?#]*)(.*)$/);
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(opts.source), decodeURIComponent(match[1])));
  if (target.startsWith('../')) throw new Error(`Reference outside repository: ${url}`);
  const suffix = match[2];
  const page = opts.pages.find(p => p.source === target);
  if (page) return {url:page.route + suffix};
  if (/^docs\/(manual\/images|images\/tutorial)\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp|svg)$/.test(target))
    return {url:`/manual-assets/${target}${suffix}`, asset:target};
  if (!publicReferences.has(target)) throw new Error(`Reference not public: ${opts.source} → ${target}`);
  const ref = target === 'compose.yaml' ? opts.productVersion : opts.docsRef;
  return {url:`${repository}/blob/${ref}/${target}${suffix}`};
}

export async function transform(markdown, opts) {
  const processor = remark().use(gfm);
  const tree = processor.parse(markdown);
  const heading = tree.children.find(n=>n.type === 'heading' && n.depth === 1);
  if (!heading) throw new Error(`Missing page title: ${opts.source}`);
  const title=toString(heading);
  tree.children.splice(tree.children.indexOf(heading),1);
  // 顶部 GitHub 导航由站点语言切换和侧栏取代；正文链接仍正常转换。
  if (tree.children[0]?.type === 'paragraph' && /^(English|简体中文)/.test(toString(tree.children[0]))) tree.children.shift();
  const assets = new Set();
  visit(tree, node=>{
    if (node.type === 'html' && node.value === '<UDID>') node.type='text';
    if (node.type === 'html') throw new Error(`Raw HTML needs explicit review: ${opts.source}`);
    if (['link','image','definition'].includes(node.type)) {
      const resolved=resolveReference(node.url,opts);
      node.url=resolved.url;
      if(resolved.asset) assets.add(resolved.asset);
    }
  });
  return {title, body:processor.stringify(tree), assets};
}
