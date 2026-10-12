import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { reviewedWebsiteRevision } from '../scripts/source.mjs';
import * as source from '../scripts/source.mjs';

test('release inputs pin a reviewed revision without editing the checked-in lock',()=>{
 const lock=Object.freeze({productVersion:'v1.5.4',docsCommit:null});
 assert.equal(typeof source.releaseSourceLock,'function');
 assert.deepEqual(source.releaseSourceLock(lock,{
  IOSBK_SITE_DOCS_COMMIT:'a'.repeat(40), IOSBK_SITE_PRODUCT_VERSION:'',
 }),{productVersion:'v1.5.4',docsCommit:'a'.repeat(40)});
 assert.equal(lock.docsCommit,null);
});

test('local release keeps its lock and explicit product inputs can select a new release',()=>{
 const lock={productVersion:'v1.5.4',docsCommit:'b'.repeat(40)};
 assert.equal(typeof source.releaseSourceLock,'function');
 assert.deepEqual(source.releaseSourceLock(lock,{}),lock);
 assert.deepEqual(source.releaseSourceLock(lock,{
  IOSBK_SITE_DOCS_COMMIT:'', IOSBK_SITE_PRODUCT_VERSION:'v1.5.5',
 }),{...lock,productVersion:'v1.5.5'});
});

test('release inputs reject branches, malformed revisions and prerelease tags',()=>{
 assert.equal(typeof source.releaseSourceLock,'function');
 const lock={productVersion:'v1.5.4',docsCommit:null};
 assert.throws(()=>source.releaseSourceLock(lock,{}),/docsCommit/);
 for(const revision of ['main','abc123','a'.repeat(40)+'\n--upload-pack=evil']) {
  assert.throws(()=>source.releaseSourceLock(lock,{IOSBK_SITE_DOCS_COMMIT:revision}),/docsCommit/);
 }
 assert.throws(()=>source.releaseSourceLock(lock,{
  IOSBK_SITE_DOCS_COMMIT:'a'.repeat(40), IOSBK_SITE_PRODUCT_VERSION:'v1.6.0-beta',
 }),/released product tag/);
});

test('release records only a clean website revision, allowing unrelated work',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'iosbackup-site-test-'));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try {
  git('init','--quiet');await mkdir(path.join(root,'website'));
  await writeFile(path.join(root,'website/home.astro'),'Original');
  await writeFile(path.join(root,'website/.gitignore'),'dist/\n');
  await writeFile(path.join(root,'other.go'),'Original');
  git('add','.');git('-c','user.name=Website test','-c','user.email=website-test@example.invalid','commit','--quiet','-m','fixture');
  const expected=git('rev-parse','HEAD');
  await writeFile(path.join(root,'other.go'),'Unrelated work');
  await mkdir(path.join(root,'website/dist'));await writeFile(path.join(root,'website/dist/index.html'),'Ignored output');
  assert.equal(reviewedWebsiteRevision(root),expected);
  await writeFile(path.join(root,'website/home.astro'),'Uncommitted copy');
  assert.throws(()=>reviewedWebsiteRevision(root),/uncommitted website/);
  await writeFile(path.join(root,'website/home.astro'),'Original');
  await writeFile(path.join(root,'website/new.astro'),'Untracked source');
  assert.throws(()=>reviewedWebsiteRevision(root),/uncommitted website/);
 } finally {await rm(root,{recursive:true,force:true})}
});
