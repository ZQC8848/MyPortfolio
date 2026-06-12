# MyPortfolio

个人作品集网站 —— 全页 3D 粒子背景随滚动在多个形状之间形变,搭配平滑滚动的单页叙事。

设计参考 [usta.agency](https://usta.agency/),粒子形变技法来自 [Three.js-Point-cloud-morphing-effect](https://github.com/Kshitij978/Three.js-Point-cloud-morphing-effect)。

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | React 19 + TypeScript (strict) |
| 构建 | Vite 8 |
| 3D | Three.js + @react-three/fiber (R3F) |
| 平滑滚动 | Lenis |
| 动画(预留) | GSAP(当前未使用,留给后续 ScrollTrigger 入场动画) |
| 质量 | ESLint (flat config + react-hooks) · GitHub Actions CI |

## 快速开始

```bash
npm install
npm run dev       # 开发服务器(自动打开浏览器)
npm run build     # 类型检查 + 生产构建 → dist/
npm run preview   # 预览生产构建
npm run lint      # ESLint + tsc --noEmit
```

要求 Node ≥ 22。

## 目录结构与职责

```
src/
├─ config.ts              # ★ 所有可调参数(粒子/相机/断点/形状序列)
├─ content/site.tsx       # ★ 所有文案、项目列表、链接、邮箱
├─ main.tsx               # 入口(刻意不用 StrictMode,见下文「坑」)
├─ App.tsx                # 组装:Provider + 懒加载背景 + 各 Section
├─ lib/
│  └─ ScrollContext.tsx   # Lenis 唯一所有者;分发滚动进度(0→1)
├─ components/
│  ├─ Nav.tsx             # 顶部导航(mix-blend-mode: difference)
│  └─ ErrorBoundary.tsx   # 包住 3D 子树,WebGL 挂了不影响正文
├─ pages/                 # 路由页面(react-router)
│  ├─ Home.tsx            # /            首页(四个 section)
│  └─ Project.tsx         # /project/:slug  项目详情(嵌入视频+图文)
├─ sections/              # 纯展示组件,内容全部来自 content/site.tsx
│  ├─ Hero.tsx · About.tsx · Work.tsx(卡片网格)· Contact.tsx
├─ three/                 # 命令式 WebGL 层(ESLint purity 规则在此豁免)
│  ├─ ParticleBackground.tsx  # 编排:Canvas + 响应式相机 + 形变循环
│  ├─ sampling.ts             # 纯函数:OBJ → 点云(加载/归一化/表面采样)
│  └─ shaders.ts              # 粒子的 vertex / fragment GLSL
└─ styles/global.css      # 全部样式(BEM 命名,含响应式断点)

assets-src/models/        # 模型源文件 .obj(不随站点分发,仅离线采样用)
scripts/bake-points.mjs   # npm run bake:OBJ → 预采样点云 public/points/*.bin
public/points/            # 每模型 ~188KB 的 Float32Array 点坐标(站点实际加载)
.github/workflows/ci.yml  # push/PR 自动跑 lint + build
```

★ = 日常维护最常改的两个文件。

## 「想改 X」速查表

| 想改什么 | 去哪里 |
| --- | --- |
| 加/改作品项目(卡片+详情页+视频) | `src/content/site.tsx` 的 `projects` 数组 |
| 文案、邮箱、导航 | `src/content/site.tsx` |
| 粒子数量、颜色、大小、自转速度 | `src/config.ts` → `PARTICLES` |
| 滚动经过哪些形状、各自在哪个进度成形 | `src/config.ts` → `SHAPE_KEYFRAMES`:与页面区块同步用 `anchor: "#about"`(任意分辨率都准);不写 anchor 则首帧在页顶、末帧在页底、中间帧自动均分 |
| 形状成形后停留多久再继续形变 | `SHAPE_KEYFRAMES` 条目的 `hold`(占总滚动的比例,如 0.1 = 停留 10%) |
| 项目详情页背景 | 自动回退为 explode 星散(页面缺少锚点区块时的统一行为) |
| 单个形状的旋转/位置/大小微调 | `SHAPE_KEYFRAMES` 条目的 `rotateAxis`+`rotateAngle` / `offset` / `scale` |
| 新增形变模型 | `assets-src/models/` 放 .obj → `npm run bake`(离线采样出 `public/points/*.bin`)→ `config.ts` 的 `MODELS` 注册 → 加进 `SHAPE_KEYFRAMES`(有面网格和纯点云 .obj 都支持) |
| 相机距离/视角、竖屏适配强度 | `src/config.ts` → `CAMERA` |
| 移动端粒子数/DPR | `src/config.ts` → `countMobile` / `getDprRange` |
| 粒子外观(光点形状、渐变) | `src/three/shaders.ts` |
| 滚动手感(惯性时长/缓动) | `src/lib/ScrollContext.tsx` 里的 Lenis 配置 |
| 配色、字体、间距 | `src/styles/global.css` 顶部 CSS 变量 |
| SEO 标题/描述/OG | `index.html` + `src/content/site.tsx` 的 `meta` |

## 核心机制:滚动驱动的粒子形变

数据流(单向,每帧):

```
Lenis(平滑滚动) ──→ ScrollContext.progress (ref, 0→1)
                              │ 每帧读取(不触发 React 渲染)
                              ▼
Particles.useFrame: damp 阻尼追踪 → 按 SHAPE_KEYFRAMES.at 定位所在区间
                              ▼
   相邻两关键帧逐粒子 lerp(旋转/缩放已烘焙;位置偏移在对象层逐帧插值)
                              ▼
                  写入 position buffer → GPU
```

关键实现点:

1. **点云离线预采样**(`scripts/bake-points.mjs`):OBJ 的加载/归一化/表面采样在构建期完成,产物是单位尺寸的 `Float32Array` 点坐标(`public/points/*.bin`,每个 ~188KB)。浏览器只 fetch 二进制点坐标(`three/sampling.ts` 的 `PointBankLoader`),按 `modelSize` 缩放即用 —— 相比直接加载 30MB 的 OBJ,4G 下点云出现时间从 ~26s 降到 ~2s,且无主线程解析卡顿。`explode` 形状是程序生成的随机散布。
2. **滚动进度走 ref 而非 state**:`progress` 是 `RefObject<number>`,每帧在 `useFrame` 里读 `.current`,完全绕开 React 渲染循环 —— 滚动再快也不会触发重渲染。
3. **空闲早退**:滚动静止时(进度变化 < 1e-4)跳过缓冲写入与上传,空闲时 CPU 开销≈0。
4. **响应式相机**(`ResponsiveCamera`):竖屏时按宽高比把相机拉远(`CAMERA.fitWidth / aspect`),保证模型横向完整入框。
5. **降级路径**:
   - `prefers-reduced-motion` → 不创建 Lenis(原生滚动)、关自转、形变即时无阻尼;
   - WebGL 崩溃/模型 404 → `ErrorBoundary` 兜住,正文照常显示;
   - `webglcontextlost` → `preventDefault()` 允许浏览器恢复上下文。
6. **性能预算**:`React.lazy` 把 Three.js 单独分包(首包 ~216KB,文字先绘制);移动端粒子减半、DPR 封顶 1.5;`frustumCulled` 关闭(buffer 每帧变化,包围球本来就不可信)。

## 已知的坑(改之前必读)

- **不要把 `<StrictMode>` 加回 `main.tsx`**。开发模式的双重挂载会让 R3F 在同一 canvas 上 `forceContextLoss()` 且无法恢复,表现为粒子闪现一次后永久白屏。详见 commit `f34e17c`。
- **`src/three/**` 里每帧改写 geometry buffer 是故意的**(R3F 惯用法,避免每帧分配)。ESLint 的 `react-hooks/purity` / `immutability` 规则只在该目录豁免 —— 不要把豁免范围扩大到 UI 层。
- **滚动进度只能从 `useScrollProgress()` 拿**,不要再加第二个 `window.addEventListener("scroll")` —— Lenis 与原生滚动的值在动画期间不一致,两套来源必出同步 bug。后续接 GSAP ScrollTrigger 请用 `useLenis()` 拿实例做桥接。
- **public/ 资源引用必须用绝对路径**(`/models/...`、`/projects/...`)。相对路径在 `/project/:slug` 子路由下会解析错误(曾导致 OBJ 加载 404、粒子背景消失)。
- Windows 下 git 会报 LF→CRLF warning,无害。
- 生产部署用 BrowserRouter 需要 SPA fallback(Vercel/Netlify 自动处理;GitHub Pages 需要 404.html 技巧)。

## 部署

构建产物是纯静态文件(`dist/`),任何静态托管都可以:

- **Vercel / Netlify**:导入仓库,构建命令 `npm run build`,输出目录 `dist`,零配置。
- **GitHub Pages**:需在 `vite.config.ts` 设置 `base: "/MyPortfolio/"` 后用 `gh-pages -d dist` 或 Actions 部署。

CI 已配置(`.github/workflows/ci.yml`):每次 push/PR 自动跑 `lint + build`,红了说明类型或构建被破坏。

## 路线图

- [ ] GSAP ScrollTrigger 分区入场动画(usta 式逐块淡入)
- [ ] 替换占位项目为真实作品(只需编辑 `content/site.tsx`)
- [ ] 部署上线 + 自定义域名
