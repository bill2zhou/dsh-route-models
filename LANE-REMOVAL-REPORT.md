# 删除「免费模型」与「EAC 模型」功能 — 变更报告

## 结论

两条车道已从插件后端、设置页前端和独立服务中移除：**匿名免费车道（OpenCode Zen）、EAC 协付车道（含 vault 密封、GitHub 登录授权、/pool 容量快照）、Kilo 免费池**。

保留并验证可用：十个账号渠道、聚合渠道、路由（combo）、本地网关（OpenAI/Anthropic 兼容）、Token 省流、插件升级、公告、推荐项目。

## 验证结果

| 检查 | 结果 |
| --- | --- |
| `node scripts/client-lint.mjs` | **OK**（618 文案键 / 183 样式规则，无未用键、无死 CSS） |
| `node --check`（index.js / client.js / 全部改动模块） | 通过 |
| 插件加载 `import('./index.js')` | **成功** |
| 独立服务 `node --check`（5 个 .mjs） | 通过 |
| 离线测试套件 | 58/108 通过，50 失败 |

**50 个失败全部属于预期**：失败原因是测试自身导入了已删除的符号（`buildCatalog`、`buildEacCatalog`、`applyFingerprint`、`signSealedRequest`、`createStandaloneEac`），或断言了随车道一起消失的行为（免费池兜底目录、探测轮次、EAC 密封、Kilo 清单、两个已删页面的组件）。**没有一处是保留功能的回归**——已逐个核验 `forward`、`subscription-wiring`、`aggregate-wiring`、`channel-pack`、`workbench-management` 的失败原因，均落在上述两类。

你选择不清理测试与文档，因此这些套件保持在失败状态；要恢复绿色需要重写或删除对应套件。

## 后端（index.js + src/）

- `index.js`：移除 /eac/* 与 /pool 路由、eacAuth 状态机、密封凭据、GitHub 授权、Kilo 刷新、免费车道 listing 与探测轮次。
- `src/core/runtime.js`：目录缩减为「免费目录 + 聚合 + 订阅 + 组合」中的后三者；移除 `sealedCredential`、`refreshSealedLane`、`refreshKiloRoster`、`FALLBACK_CATALOG` 与探测轮次；`refreshCatalog` 只按设置重新推导合并视图。
- `src/catalog.js`：只保留 `displayModelName`；`buildCatalog` / `buildEacCatalog` / `buildKiloCatalog` / `isEacEntry` / `isKiloEntry` 移除。
- `src/adapter.js`：删除 `sealed` / `kilo` 分支与封印节奏提示；订阅、聚合、组合三条路径保留。
- `src/core.js`、`src/o2a.js`、`src/token-saver.js`：**由 `scripts/build-legacy-payload.mjs` 重新生成**，未手改（这些是打包产物）。
- `src/eac.js`、`src/eac-user.js`、`src/eac-login.js`、`src/vault.js`、`src/vault-data.js`、`src/vault-anchor.js`、`src/kilo.js`：现为**惰性墓碑**——保留旧导出名以免越界脚本加载即崩，但每个调用抛 `LANE_REMOVED`，不读凭据、不开 socket。已确认插件运行时不再导入其中任何一个。

## 前端（client.js）

- 删除 `FreePage`、`EacPage`、`EacAuth`、`useEacLogin`、`ModelCard`、`Roster`、`Tank`、`usePool`、`poolReading`、`capacityText`、`isFreePoolModel`、`freePoolView`。
- 标签栏去掉 `free` / `eac`，默认页回落到 `channels`（旧的 localStorage 值自动回落）。
- 转发与出口设置面板迁入「网关设置」页，路由 `/forward`、`/egress` 仍在。
- 移除 `hideFreeModels` / `hideEacModels` / `exposeRegionModels` 三个开关。
- 清掉 290 条失效文案键与 111 条死 CSS 规则，`client-lint` 因此转绿。

## 独立服务（packages/standalone/）

`eac.mjs` 已删除；`service.mjs`、`management.mjs`、`routing.mjs` 与前端 8 个文件移除对应车道、`/api/management/eac/*` 路由与 EAC/Kilo 页面。

**注意**：`packages/standalone/web/*.js` 与 `assets.json` 仍是旧构建产物。重建需要 (a) 安装前端依赖，(b) 修 `scripts/lib/standalone-shared-ui.mjs`（它锚定在已删除的 `api('/pool', …)` 调用上，会抛「共享页面替换位置改变」）。

## 需要你决定的事

1. **真删除 vs 墓碑**：七个 `src/` 车道模块目前是墓碑。要真正 `git rm` 它们（并同步 `package.json` 的 `files` 列表、重新生成 `catalog/integrity.json`），需要一次提权删除。
2. **`icon.svg`**：被中途的子代理改成了与任务无关的新图标，你选择保持不动。
3. **测试与文档**：按你的选择未清理。README、`docs/eac-*.md`、`docs/free-lane-wire.md` 等仍描述已删除的功能。
4. **独立服务前端构建**：见上，需要装依赖并修共享 UI 转换器。
5. **`worker/` 目录**：EAC 签名网关 Cloudflare Worker 仍保留（未选入删除范围），其 `verify-deployment.mjs` 仍导入墓碑版 `src/eac.js`。
