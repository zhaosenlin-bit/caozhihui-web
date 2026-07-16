# space-travel — 宇宙探索

一个纯前端、零构建的 React + Three.js 宇宙主题演示站。所有依赖(React / Three.js / Tailwind)已 vendor 到 public/vendor/,3D 模型与背景视频也直接放在 public/ 下。

**线上版本:** https://caozhihui-web.pages.dev
**GitHub 仓库:** https://github.com/zhaosenlin-bit/caozhihui-web
**Cloudflare Pages project:** \caozhihui-web\ (Account 7317e4dce48347edfe5a1a12601f845b)

## 本地跑

`cmd
cd public
python -m http.server 8011
`

或 python serve_nocache.py 8011 看 PDF 现行。

## 部署 (Cloudflare Pages Direct Upload)

构建命令:留空;Build output:public;无环境变量;Root:留空;

`cmd
set CLOUDFLARE_API_TOKEN=<dash.cloudflare.com/profile/api-tokens>
set CLOUDFLARE_ACCOUNT_ID=<从 dash URL 复制>
wrangler pages deploy public --project-name=caozhihui-web --branch=main
`

## 推送 GitHub (FAQ)

GitHub 密码授权自 2021 已废。需要 **Personal Access Token**:

1. 去 https://github.com/settings/tokens → Generate new token (classic)
2. scope 选 \epo\
3. \git push https://<your-token>@github.com/zhaosenlin-bit/caozhihui-web.git main\

或使用 ssh: \git remote set-url origin git@github.com:zhaosenlin-bit/caozhihui-web.git\

本地仓库已 \git init\ 且 commit 了 31 个文件,没有未提交修改,推到 GitHub 只需一次 push。

## 目录

`
├─ public/                      # <- Cloudflare Pages 的发布目录
│  ├─ *.html, *.js, *.mjs       # 业务代码
│  ├─ models/                   # NASA GLB 模型
│  ├─ vendor/                   # React / Three.js / Tailwind 本地副本
│  └─ archive/                  # .bak + 失效资产 (本地保存,不上线)
├─ serve_nocache.py             # 本地静态服务器
├─ .gitignore                   # 屏蔽 .bak / .log / .archive / 上线残留 Vite 脚手架
└─ README.md
`

## 重上线的几个坑 (记录在这里免下次重蹈)

- Cloudflare Pages Direct Upload 是上传整个 \public/\,不是 zip 一个本地服务。如果 zip 超过 25 MB,会拒绝上传。
- wrangler login 在 Codex 锐圈 sandbox 中不能交互,必须用 API token。
- \wrangler pages deploy --commit-message\ 参数不能含空格,会被 shell 拆开。
- HTML 文件会遇到 308 redirect (canoncial → \/\),这是正常的,代表上架成功。
- \pages.dev\ 主域会在首次 Deploy 后 5-30s 才接上网络,需 \Invoke-WebRequest\ 轮询等它起来。
- Git push 的 email 中如果有 @,cmd URL-encoding: \%40qq.com\(PowerShell 会把 \:port\ 当作端口错误)。