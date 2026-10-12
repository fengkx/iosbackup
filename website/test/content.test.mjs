import test from 'node:test';
import assert from 'node:assert/strict';
import { transform, validateLock, resolveReference } from '../scripts/content.mjs';
const pages = [
 {source:'docs/manual/overview.zh-CN.md', route:'/zh-cn/docs/overview/'},
 {source:'docs/manual/usb-backup.zh-CN.md', route:'/zh-cn/docs/usb-backup/'},
 {source:'docs/manual/overview.md', route:'/en/docs/overview/'}
];
const opts = {source:pages[0].source, pages, productVersion:'v1.5.4', docsRef:'a'.repeat(40)};
test('rewrites relative Markdown and reference links, preserves fragment and code', async()=>{
 const result=await transform('# 环境\n\n[USB](usb-backup.zh-CN.md#准备)\n\n[EN][lang]\n\n[lang]: overview.md\n\n```md\n[x](private.md)\n```\n',opts);
 assert.equal(result.title,'环境');
 assert.match(result.body,/\/zh-cn\/docs\/usb-backup\/#准备/);
 assert.match(result.body,/\/en\/docs\/overview\//);
 assert.match(result.body,/\[x\]\(private.md\)/);
 assert.doesNotMatch(result.body, /^# 环境/m);
});
test('maps images and records only referenced public assets',async()=>{
 const result=await transform('# Title\n\n![USB](images/01-syno-cm.png)',opts);
 assert.match(result.body,/\/manual-assets\/docs\/manual\/images\/01-syno-cm.png/);
 assert.deepEqual([...result.assets],['docs/manual/images/01-syno-cm.png']);
});
test('rejects private files and traversal instead of publishing a GitHub link',()=>{
 for (const ref of ['../../CONTEXT.md','../adr/0001.md','../../../secret.md','images/../../qa/device.png'])
 assert.throws(()=>resolveReference(ref,opts),/not public|outside/);
});
test('pins code downloads to product release and docs links to reviewed revision',()=>{
 assert.equal(resolveReference('../../compose.yaml',opts).url,'https://github.com/razeencheng/iosbackup/blob/v1.5.4/compose.yaml');
 assert.equal(resolveReference('../DEVELOPMENT.md',opts).url,`https://github.com/razeencheng/iosbackup/blob/${'a'.repeat(40)}/docs/DEVELOPMENT.md`);
});
test('production requires exact public docs SHA and valid product tag',()=>{
 const valid={productVersion:'v1.5.4',docsCommit:'a'.repeat(40)};
 assert.doesNotThrow(()=>validateLock(valid));
 for (const docsCommit of [null,'main','abc123','a'.repeat(40)+'\n']) assert.throws(()=>validateLock({...valid,docsCommit}));
 assert.throws(()=>validateLock({...valid,productVersion:'latest'}));
});
test('renders literal UDID placeholders but rejects executable raw HTML',async()=>{
 const result=await transform('# T\n\n| Path |\n| --- |\n| <UDID>/ |',opts);
 assert.match(result.body,/\\<UDID>/);
 await assert.rejects(transform('# T\n\n<script>alert(1)</script>',opts),/Raw HTML/);
});
