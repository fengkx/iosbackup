# iOS Backup website / 官网

Astro + Starlight static website for **iosbackup.isw.app**. The Go application and its container do not depend on Node or this site.

## Local work / 本地开发

Use Node 24 LTS (minimum 22.12) and npm:

```sh
cd website
npm ci
npm test
npm run build
npm run preview -- --port 4321
```

Open `http://127.0.0.1:4321/`. `npm run dev` provides live UI development; after editing canonical Markdown, restart it to regenerate the imported content. Search is indexed during `npm run build`, so verify it with the built preview.

`npm run build` reads the current workspace, including local documentation edits. Every preview page has `noindex` metadata, `robots.txt` disallows indexing, and Cloudflare `_headers` adds `X-Robots-Tag`. The homepage/footer and document header identify the preview. It is **not a production release command**.

## One content source / 一份正文

- Edit original files in `docs/manual/`, `docs/QUICKSTART*`, `docs/OPERATIONS*`, or `docs/FEATURE_STATUS*`.
- Register each bilingual page in `content-map.mjs`. It is an explicit public allowlist; never glob all of `docs/`.
- `scripts/prepare.mjs` generates ignored `src/content/docs/`, `src/generated/`, and `public/manual-assets/`. Do not edit these outputs.
- Relative Markdown links and referenced images are rewritten through a Markdown AST. Source downloads such as Compose link to the selected product tag. Non-imported public docs link to the reviewed docs revision. Unknown/private references fail the build.
- GitHub edit links target the original path on public `main`. Source-reading links in released pages target the exact reviewed SHA. Local new files may not exist on GitHub until exported and merged.
- Page update dates come from the original file's Git history. Uncommitted preview edits have no claimed update date. The build timestamp is not presented as a content update.
- `/en/` and `/zh-cn/` are separate static sites. An explicit localized URL keeps its language; only `/` selects a remembered preference or the browser's first preferred language. Language switching preserves the article; headings may differ, so switching starts at its top.

首页使用公开教程中的真实 v1.5.2 截图，图注已注明。更新截图时，应另行审核隐私与实际版本，不要改图上的版本数字。中英文页面共用该中文界面实拍，并在英文图注明确语言。

## Release source / 生产来源

`source-lock.json` supplies the local release defaults:

- `productVersion`: an existing public stable release tag, currently verified as `v1.5.4`.
- `docsCommit`: a **full, reviewed public GitHub commit SHA**, never `main` or a private-development SHA.

The initial `docsCommit` is intentionally `null`: the new restore docs and website have not yet been committed/exported to the public repository. A local `npm run build:release` fails until a reviewed public revision is supplied. Do not use a placeholder SHA to bypass this gate.

Before first publication:

1. Review/export the website and new bilingual manuals to the public repository through the existing release process. Do not export unrelated private engineering materials or unreleased app changes merely to publish docs.
2. Review a public documentation commit for the selected release. Its `release/manifest.env` must name the same product version, and it must contain every mapped source file.
3. Use the manual **Publish website** workflow described below. By default it freezes the selected `main` revision at dispatch time; it does not follow later commits or modify `source-lock.json`. An optional full docs SHA can select another reviewed public revision. The product version defaults to the lock file; an optional stable-tag input overrides it for that run.
4. The workflow runs `npm ci`, `npm test`, and `npm run build:release`. Production rejects uncommitted or untracked website source (unrelated Go changes do not block it). It fetches documentation from the fixed public repository at the exact SHA, verifies the product tag exists and the manifest matches, and records source digests and original update dates in `dist/source.json`. It does not read workspace doc edits.

A doc-only correction changes the selected documentation SHA while keeping the product version. Review still has to confirm the text applies to that release; a version string cannot detect incorrect future-feature prose. The site exposes one latest stable version, not a version selector. Update `source-lock.json`'s `productVersion` when moving the website to a newly released product version.

To reproduce a release locally from a clean website checkout, set `IOSBK_SITE_DOCS_COMMIT` to the full reviewed public SHA and, if needed, `IOSBK_SITE_PRODUCT_VERSION` to its product tag, then run `npm run build:release`. Nonempty environment inputs override the lock file only for release builds. Ordinary preview builds ignore these inputs. The Actions summary and saved artifact's `source.json` record the effective inputs and website commit; the checked-in lock alone is not the record of the latest deployment.

公开文档 PR 合并后，应把同一修正回流私有开发主线，并在下一次公开快照导出前核对。导出脚本不合并 public/main；仅合入公开仓库可能被后续快照覆盖。

## 手动发布到 Cloudflare / Manual publication

文档是构建时由 Markdown 生成的静态 HTML。Cloudflare Workers Static Assets 托管 `dist/`；访问网站时不需要 Go 服务、Node 服务或数据库。

### 首次配置（一次即可）

1. 把网站源码、新增文档和 `.github/workflows/website-deploy.yml` 审核后合入公开仓库 `razeencheng/iosbackup` 的 `main`。工作流进入默认分支后，GitHub 才会显示手动运行入口。
2. 在 Cloudflare 创建 API Token，可从 **Edit Cloudflare Workers** 模板开始，核对当前权限模型与首次部署需求：
   - 如果 `iosbackup-site` 尚未创建：需要当前账号 **Workers 产品级 Admin**。`Specified Workers / Individual Workers` 无法选择尚不存在的 Worker，单个 Worker 的 Admin 也不能代替产品级创建权限。
   - 如果 `iosbackup-site` 已存在：可限定 **Specified Workers → iosbackup-site → Editor**。Editor 已包含两个只读级别的权限。
   - 当前配置会绑定自定义域名，还需要 **Zone → Workers Routes → Write**，zone 范围仅为 **isw.app**。新界面若显示编辑级别，应选择对应写入权限。
   - 首次创建完成后，可将 Workers 权限收窄为 `iosbackup-site` 的 Editor；路由策略保留以支持配置中的域名绑定更新。详情见 [Cloudflare Workers 权限说明](https://developers.cloudflare.com/workers/authorization/workers/)。
   记下部署账号的 Account ID。不要把 Token 写入仓库。
3. 打开 GitHub 仓库 **Settings → Environments**，创建 `website-production`，将允许部署的分支设为 `main`。在该环境的 **Environment secrets** 中添加：

   | Secret | 内容 |
   | --- | --- |
   | `CLOUDFLARE_API_TOKEN` | 上一步生成的 Token |
   | `CLOUDFLARE_ACCOUNT_ID` | 托管 `isw.app` 的 Cloudflare Account ID |

4. 确认 `isw.app` 已在该账号中作为活跃 zone 托管，`iosbackup.isw.app` 没有冲突记录。首次成功部署会创建/更新 `iosbackup-site` Worker，并按 `wrangler.jsonc` 绑定这个自定义域名。

凭据配置参考 [Cloudflare 官方 GitHub Actions 指南](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)；按钮入口参考 [GitHub 手动运行工作流指南](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)。无需同时接入 Workers Builds 自动部署。

### 日常更新

1. 修改原始 Markdown，例如 `docs/manual/restore-finder.zh-CN.md`，同步相应英文内容；不要修改生成的 `website/src/content/docs/`。
2. 提交 PR 并合入公开 `main`。**Website checks** 自动构建预览并检查内容；确认正文仍适用于当前公开产品版本。
3. 打开 **Actions → Publish website → Run workflow**，选择 **main**。日常更新的两个输入都可以留空，点击运行即发布本次选定提交。
4. 工作流自动安装依赖、测试、校验公开来源、构建中英文网页与搜索、保存发布产物，然后部署 Cloudflare。完成后访问 [iosbackup.isw.app](https://iosbackup.isw.app)。

`docs_commit` 仅在需要指定某个已审核公开文档提交时填写完整 40 位 SHA；`product_version` 仅在需要覆盖默认适用版本时填写。应用发版和文档发布相互独立，不必为修正文档创建产品版本。点击发布前的人工内容审核仍有必要，版本字符串校验无法替代它。

### 发布记录与失败处理

- `.github/workflows/website.yml` 仅构建带 **noindex** 的预览，不读取 Cloudflare 凭据。`website-deploy.yml` 只有手动触发器，仅允许公开仓库的 `main`；PR、推送和 fork 不自动部署。
- 每次发布的摘要记录产品标签、正文 SHA、网站源码 SHA；`website-release-运行编号-尝试次数` artifact 保存正式产物 30 天。Wrangler 仅在部署步骤读取上述两个凭据，并使用 lockfile 中固定的版本。
- 构建、链接检查或来源校验失败时不会进入部署。缺少凭据会给出明确错误；修正后可重跑。失败日志和已生成的 artifact 可在该次 Actions 运行中查看。
- 需要回退完整网站时，使用 Cloudflare 的上一份已知正常部署。指定旧 `docs_commit` 只回退正文，网站布局仍使用本次运行选定的 `main` 代码。保留部署/version ID 与 `source.json`；网站回退不触及 NAS 备份。
- 正式配置关闭 `workers.dev` 和 preview URLs，只使用自定义域名；预览应使用单独 Worker 和 `npm run build` 的 noindex 产物。

Do not use SPA fallback for documentation. Unknown URLs should return the generated 404 page with HTTP 404.

## Verification / 验收

`npm test` checks source-link transformations, public boundaries, and release lock validation. `npm run build` also checks all generated local links, assets, heading anchors, language metadata, preview indexing policy, and forbidden output paths. Browser checks cover Pagefind search, navigation, locale persistence, mobile menus, and layout.

Finder and Apple Devices pages document preparation and known validation gaps. Neither a successful website build nor application backup tests establish real-device restore compatibility. Keep their pending-validation notices until an actual restore exercise is recorded.

### Dependency note

`postcss-nested` currently pins an older selector-parser major through Expressive Code. The scoped npm override selects `postcss-selector-parser@7.1.6` to address GHSA-rj75-hqrm-r3gf. After the change, all generated CSS files were compared byte-for-byte with the previous build. Reassess the override when Expressive Code updates its dependency.
