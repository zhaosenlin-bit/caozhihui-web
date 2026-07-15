# space-travel — 宇宙探索

一个纯前端、零构建的 React + Three.js 宇宙主题演示站。所有依赖
(React / Three.js / Tailwind) 已 vendor 到 public/vendor/,3D 模型
与背景视频也直接放在 public/ 下。

## 本地跑(随便静态服务器即可)

`ash
cd public
python -m http.server 8011
# 或
python ../serve_nocache.py 8011   # 使用本仓库自带的 no-cache 服务器
`

然后打开 http://127.0.0.1:8011/

## 部署

### Cloudflare Pages(当前线上方案)

仓库根直接部署即可。Cloudflare Pages 设置:

| 项 | 值 |
|---|---|
| Framework preset | **None** |
| Build command | *(留空)* |
| Build output directory | **public** |
| Root directory | *(留空)* |
| Node version | *(不需要)* |
| Environment variables | *(不需要)* |

Cloudflare 会把 public/ 下的所有文件原样作为静态资源发布。
所有 HTML 引用的相对路径 ./app.js、./models/juno.glb 等
天然保留,不需要 rewrites。

## 目录结构

`
space-travel/
├─ public/                 # <- Cloudflare Pages 的 build output
│  ├─ index.html           # 首页(中文)
│  ├─ page2.html           # 太阳系 3D 探索
│  ├─ play.html            # 宇宙迷宫
│  ├─ game.html            # 太阳系 3D + 答题
│  ├─ game2.html           # 宇宙守护者 (Canvas 2D 射击)
│  ├─ game3.html           # 贪吃蛇
│  ├─ game4.html           # Stellar Strike 3D
│  ├─ app.js, game*.js, explore.js   # 业务逻辑(直接 <script>)
│  ├─ pixelsnow.mjs / lightfall.mjs  # 背景特效
│  ├─ bgm.js               # WebAudio 合成的背景音乐(可选)
│  ├─ models/              # NASA GLB 模型
│  ├─ vendor/              # React / Three.js / Tailwind(本地)
│  └─ archive/             # 历史 .bak + 已废弃资源(已 .gitignore)
└─ serve_nocache.py        # 本地预览服务器
`

## 注意

- 部署后刷新浏览器可能要等几个 30s(Cloudflare 边缘缓存激活)
- 修改任何 public/** 文件后,git push 即可触发自动重新部署
- 大视频 public/astro-loop.mp4 / public/capabilities.mp4
  用了 preload="metadata",所以不会阻塞首屏