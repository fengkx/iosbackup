import { execFileSync } from 'node:child_process';
import { validateLock } from './content.mjs';

// CI 在本次运行中锁定来源，不修改受版本控制的锁文件或污染网站源码署名。
export function releaseSourceLock(lock, env = {}) {
  const selected = {
    productVersion: env.IOSBK_SITE_PRODUCT_VERSION || lock.productVersion,
    docsCommit: env.IOSBK_SITE_DOCS_COMMIT || lock.docsCommit,
  };
  validateLock(selected);
  return selected;
}

// 生产署名必须能还原真正参与 Astro 构建的源码；其他服务代码可继续独立工作。
export function reviewedWebsiteRevision(root) {
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const changes=git(['status','--porcelain','--untracked-files=all','--','website']);
  if(changes) throw new Error('Production build rejected: uncommitted website source. Review and commit website/ before recording a release revision.');
  return git(['rev-parse','HEAD']);
}
