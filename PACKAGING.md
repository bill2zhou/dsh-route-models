# Route Models · 打包与验证指南

## 产品入口

| 入口 | 用途 | 用户运行依赖 |
| --- | --- | --- |
| DSH 插件 | 在 DSH 内提供渠道与管理面板 | DSH；按 README 的插件安装说明安装 |

插件是唯一分发的产物。独立本地服务与 Windows 桌面壳均已下线，桌面上直接使用 DSH 宿主即可。

## 安装

从 Releases 下载发布包解压后：

```powershell
dsh plugin add <解压目录>
```

桌面端（Electron）的 profile 由应用自己管理，命令行安装只适用于纯 web profile（`dsh web`）；桌面端请在插件管理器里安装。

## 验证

```powershell
node scripts/test-all.mjs --mode contributor
npm run typecheck
node scripts/build-legacy-payload.mjs --check
node scripts/channel-pack-test.mjs
```

`test-all` 是不出网、不消耗额度的离线套件集合；`build-legacy-payload --check` 逐字节校验 `src/core.js` 与 `src/o2a.js` 是否与源文件一致；`channel-pack-test` 校验十个账号渠道的打包产物。

发布前还需在真实 DSH 宿主里装一次，确认插件加载、模型清单与设置页渲染正常。

## 版本与公告

`package.json` 的 `version` 是唯一版本源，插件 `/meta` 直接上报它。公告由 `src/feed.js` 从仓库远端的 `feed/announcements.json` 拉取（本仓库不再内置 `feed/` 与 `docs/`）；插件不再内置应用内升级，用户通过 DSH 的插件管理器或重新安装新版本来更新。
