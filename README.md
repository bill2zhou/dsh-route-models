<div align="center">
  <img src="icon.svg" alt="Route Models — 渠道模型管理插件" width="120">

# Route Models · 渠道模型

**简体中文** | [English](README_EN.md)

  <img alt="许可证" src="https://img.shields.io/badge/license-MIT-263146?style=flat-square">
  <img alt="版本" src="https://img.shields.io/badge/version-1.0.0-4b6fff?style=flat-square">
  <img alt="零运行时依赖" src="https://img.shields.io/badge/dependencies-zero-4b6fff?style=flat-square">
  <img alt="无构建步骤" src="https://img.shields.io/badge/build%20step-none-7da1de?style=flat-square">
  <img alt="状态" src="https://img.shields.io/badge/status-beta-f0a441?style=flat-square">

</div>

在 DeepSeek Harness（dsh）里集中管理十余家 AI 编程平台的**账号渠道**：浏览器登录、账号池、每日签到与积分领取、按模型开关；附带一个 OpenAI 兼容的本地网关、一套省 Token 压缩管线、用量看板与逐请求日志。

凭据只写入宿主与本机的私有文件，界面与网络响应中不回显明文；插件不上传任何遥测。

> 这是一个纯插件：不改内核、无构建步骤、零运行时依赖。除了 `llm` 之外没有硬依赖，没有 web server 的 composition（例如无头终端）也能启动。

---


---

## 这个版本提供什么

设置页顶部有五个标签，全部围绕「渠道」这一件事：

| 标签 | 内容 |
| --- | --- |
| **EAC router**（副标题：账号渠道） | 渠道卡片网格：连接 / 管理、添加账号、一键领取积分、每日自动签到、模型开关与可用性测试 |
| **省 Token** | 工具输出压缩（RTK）、两族提示词压缩、五个本地应答，以及按字节统计的节省数据 |
| **数据看板** | 今日 / 全部历史 Token、输入 / 输出 / 思考 / 缓存命中、首字延迟、生成速度、成功率、账号与模型双维度透视 |
| **运行日志** | 逐条请求明细：结果、耗时、首字、速度、Token 细分，失败原因悬停可见，每 10 秒自动刷新 |
| **网关设置** | 渠道模型的 OpenAI 兼容网关：开关、端点、API Key、可转发模型数量 |

此外还有：公告中心（实时推送与系统通知）、使用须知与免责声明（首次进入展示一次，可在页脚重开）、以及可选的视觉特效开关（默认关闭，仅保存在当前浏览器）。

## 账号渠道

渠道页按渠道卡呈现，每张卡对应一家平台的账号体系：

| 渠道 | 厂商 | 登录方式 | 积分 / 签到 |
| --- | --- | --- | --- |
| CodeArts | 华为云 | 浏览器 | 一键领取 |
| WorkBuddy 国内版 | 腾讯 | 浏览器 | 领取 + 状态 |
| WorkBuddy 国际版 | 腾讯 | 浏览器 | 状态 |
| LobsterAI | 有道 | 浏览器 | 一键领取 |
| Qoder | 阿里系 | 浏览器 | 一键领取 |
| Qoder 中国版 | 阿里系 | 浏览器 | 一键领取 |
| TRAE | 字节 | 浏览器 | 一键领取 |
| Loomy | 讯飞 | 短信验证码 | 一键领取 |
| Raccoon | 商汤 | 浏览器 | — |
| MiniMax Code | MiniMax | 浏览器（设备码 + PKCE） | 领取 + 状态 |
| ZCode | 智谱 | 浏览器 | 一键领取（Token 计） |

- 登录全程在浏览器完成：发起后等待回调，页面自动收尾，不需要复制粘贴任何东西（最长等待 10 分钟）。
- 账号凭据由宿主的凭据库保存，渠道页只拿到账号列表、状态与用量；明文不出宿主进程。
- 每个账号可以单独启用 / 停用、移除、测试；模型可逐个开关，也可按渠道批量开启或关闭。
- 渠道包是 MIT 许可的社区实现（见 [vendor/channel-pack/NOTICE.md](vendor/channel-pack/NOTICE.md)），随插件一起打包，不额外下载。

> 说明：渠道包内的 provider 实现多于界面卡片（例如 Cline、Gemini 有实现但没有独立卡片）；可用模型、额度与登录方式均由对应平台单方决定，随时可能变化。

## 本地网关

「网关设置」页可以把渠道模型以 **OpenAI 兼容**接口提供给本机其它工具：

```text
Base URL:  http://127.0.0.1:8326/v1
API Key:   在网关页显示 / 复制（首次启用时由渠道包生成）
接口:      GET  /v1/models
           POST /v1/chat/completions      （流式与非流式）
           POST /v1/responses
           POST /v1/reasoning-efforts
```

- 网关默认只监听回环地址；端口可用环境变量 `DSH_OPENAI_GATEWAY_PORT` 调整，开关可用 `DSH_OPENAI_GATEWAY_ENABLED=0` 停用，Key 可用 `DSH_OPENAI_GATEWAY_API_KEY` 覆盖。
- 渠道包还提供局域网中继（默认端口 18326）：它用插件自己签发的独立密钥鉴权，再把请求换成渠道网关的凭据转发，凭据不出宿主进程；只放行上面列出的白名单路径，并带环路保护。该中继与插件自有的转发端口（默认 18899）后端仍在，但当前设置页尚未提供开关，需要经设置 API 启用。
- Key 明文只用于客户端配置；不要把它发给别人。

## 省 Token

压缩发生在请求离开本机之前，并且每一步都**失败开放**：读不懂的请求原样发出，压缩报错不会让一轮对话失败。

- **RTK 工具输出压缩**：就地重写 `tool_result` 内容，覆盖 `git diff / status / log`、`grep`、`find`、`ls`、`tree`、构建日志、带行号的文件转储、搜索清单与重复日志行，共 12 个过滤器。安全边界：报错结果原样保留、小体积内容不碰、替换结果永远不会比原文更大。
- **提示词压缩**：Caveman（电报体）与 Ponytail（YAGNI 最小实现）两族，各有多个档位，默认全部关闭——它们会改变助手的说话方式，并留在对话记录里。
- **五个本地应答**：额度探测、命令前缀、会话标题、建议模式、文件路径提取。这些请求的答案本来就在请求体里，直接本地作答，不占用一次上游请求。
- **节省统计**：按字节记录压缩前 / 压缩后 / 节省比例 / 压缩块数 / 统计调用数，数据只写入本机。

## 数据与隐私

所有状态写入 `DSH_HOME/route-models/`（默认 `~/.dsh/route-models/`）：

```text
settings.json          插件设置（含转发 / 中继密钥，0600）
stats.json             用量与请求统计
availability.json      实测可用性与出口快照
session-map.json       会话映射
feed.json              公告缓存
subscriptions/credentials.json   订阅账号凭据（0600，若使用）
egress/mihomo.yaml     代理出口配置（0600，若启用）
```

渠道包的凭据与网关密钥写在 `DSH_HOME`（或 `DSH_CHANNEL_PACK_STATE_DIR`）下，由宿主凭据库与 `openai-gateway/api-key` 持有。

**不上传任何遥测。** 出网目标只有以下几类：

| 用途 | 目标 |
| --- | --- |
| 渠道登录与推理 | 各渠道自己的端点（如 `api.cline.bot`、`devcloud.cn-north-4.myhuaweicloud.com`、`codearts.huaweicloud.com` 等，随渠道而定） |
| 订阅账号（若使用） | `chatgpt.com`、`auth.openai.com`、`api.anthropic.com`、`cloudcode-pa.googleapis.com`、`oauth2.googleapis.com` |
| 公告 | `raw.githubusercontent.com` → `cdn.jsdelivr.net` → `gh-proxy.com`（按顺序回退） |
| 出口探测 | `api.ipify.org` / `ipinfo.io` / `ipapi.co`，仅读取本机公网 IP 与国家码 |
| 代理出口（若启用） | 你填写的订阅地址；订阅模式下由本机 mihomo 读取 |

## 安装

本仓库以 **Release 包**分发插件本体：

1. 从 Releases 下载并解压发布包；
2. 纯 web profile（`dsh web`）：

   ```powershell
   dsh plugin add <解压目录>
   ```

3. 桌面端（Electron）的 profile 由应用自己管理，命令行无法写入，请在 **设置 → 插件** 里安装；
4. 重启或重新加载宿主，打开 **设置 → 渠道模型**。

注意：

- npm 上同名裸包不是本仓库的发布物，内容与本仓库不一致，请勿将其当作本项目构建。
- 由整合包 / 包管理器托管安装时，把 bundle 配置或 `settings.json` 的 `distribution` 设为 `managed`：公告轮询与热重载会自动停用，更新由安装方负责，避免两个写入方同时改同一目录。
- 不要手动往 `cordis.patch.yml` 追加条目：被 `dsh.profile.bundles` 引用的包会自动应用自带 patch，重复注册会报 `duplicate loader entry id`。
- 手写复制发布文件时必须复制完整包（`adapter/`、`src/`、`locale/`、`vendor/channel-pack/` 及其 WASM、LICENSE、NOTICE），只复制入口脚本会导致渠道加载失败。

## 实现结构

```text
index.js                  Host 半身：插件装配、API 路由、转发与中继生命周期、
                          公告 / 热重载接线
client.js                 浏览器半身：手写 ModuleLoader bundle，无构建步骤
adapter/                  内核接缝：全包唯一允许 import @deepseek-ai/* 的位置
src/adapter.js            结构性 LlmAdapter：路由注册、流式解码、工具配对修复
src/core.js               运行时打包产物（由 src/core/ 生成，勿手改）
src/store.js              私有 JSON 存储、设置默认值、统计迁移
src/channel.js            渠道模型到 harness 流的适配
src/subscriptions.js      订阅账号侧车：凭据规范化、额度查询、令牌刷新
src/subscription-adapter.js / subscription-completion.js
                          订阅模型 -> 目录行与完成流
src/forward.js            独立的 OpenAI 兼容监听器（含 Anthropic Messages 端点）
src/chan-relay.js         渠道网关的局域网中继（独立密钥 + 路径白名单 + 环路保护）
src/egress.js             代理出口：订阅模式（本机 mihomo）或单代理
src/token-saver/          压缩管线：提示词注入 -> 工具输出压缩，按字节留痕
src/local-optimize.js     五个本地应答
src/trust.js              插件路由的请求信任围栏
src/feed.js               公告 feed：多源回退、校验、缓存
src/reload.js             自热重载：清缓存 -> 重导入 -> 重注册 -> 失败回滚
vendor/channel-pack/      账号渠道实现（MIT，上游来源见 NOTICE）
```

几个值得了解的取舍：

- **一条适配器，两条路由。** 模型选择器按 provider 路由分组，所以「可用」与「region-limited」只能通过两条路由呈现；空分组由客户端自动丢弃。
- **结构化适配器，不 import `@deepseek-ai/dsh-llm`。** 内核从不做 `instanceof` 检查，鸭子类型即可，这让同一份代码能跨内核小版本运行。
- **私有 JSON 存储，不接 settings seam。** 两版内核的设置注册 API 不一致，私有存储在两边行为一致，也便于把密钥锁进 `0600` 文件。
- **压缩只在一个收口执行，且失败开放。** 适配器派发与本地网关都经过同一个 `payloadFor()`，因此每条路径都被压缩；任何一步出错都按原样放行。
- **响应按 body 形状判定，而不是 `Content-Type`。** 嗅探首块后把已读字节重新注入流，避免 header 与实际内容不符时把整轮丢弃。

## 已知边界与当前状态

本仓库正在从「免费模型插件」收敛为「账号渠道管理插件」，因此下列内容**已移除**，旧文档与旧公告中的相关描述不再适用：

- 匿名免费车道（OpenCode Zen）、Kilo 免费池、EAC 协付车道（含 GitHub 授权与密封凭据）；
- 聚合车道与 provider registry、combo 聚合链；
- 应用内升级与签名清单链路（更新交由宿主或安装方）；
- 独立本地服务与 Windows 桌面壳（`packages/` 已下线）。

此外：

- 订阅账号后端（Codex / Claude / Gemini / 自定义 API 的凭据导入、额度查询、令牌刷新）仍在代码中，但本轮删除车道后**管理界面尚未接回**，暂不能从设置页使用；插件自身的 `Route Models` 分组因此通常为空，模型由渠道包以自己的 provider 分组提供。
- 设置页与文案键仍残留旧命名（`EAC router`、免费车道、EAC 等），属于待清理的界面债务，不影响渠道功能。
- 渠道包的界面卡片（11 张）、包内 provider 实现（多于卡片，含 Cline / Gemini）与随包源码（10 个）数量不一致；用 `npm run channel-pack` 从 `src/` 重建会丢掉仅存在于 `pack.js` 的渠道。
- 插件的使用须知声明不提供 WorkBuddy 与华为云渠道，而渠道页仍会渲染渠道包中的对应卡片：策略与界面尚未对齐，实际可用性以登录与调用结果为准。
- 离线套件里仍保留已删除车道的用例，`npm test` 当前不是全绿；发布模式（`--mode release`）只跑打包与清单两项，其中清单校验因仓库改名尚未同步而失败。
- 渠道的模型清单、额度与积分政策由各平台单方面提供，可能限流、变更或下线；插件只能如实显示失败原因。
- 账号的使用方式与合规责任由使用者承担；请遵守各平台的服务条款与所在地法律。

## 开发

需要 Node `^22.19.0 || >=24.0.0`。无安装步骤、无运行时依赖。

```bash
npm test                                  # 全部离线套件（不联网、不消耗额度）
node scripts/test-all.mjs --mode release  # 仅打包与清单校验
npm run typecheck                         # tsc --noEmit
npm run channel-pack                      # 从 vendor/channel-pack/src 重建 pack.js
node scripts/build-legacy-payload.mjs --check   # 逐字节校验生成的 src/core.js / src/o2a.js
node scripts/channel-pack-test.mjs        # 渠道包打包产物校验
```

测试入口是 `scripts/test-all.mjs`，每个套件 60 秒硬超时；共享脚手架默认把外部地址指向已关闭的本机端口，因此离线套件不会打到真实平台。

## 许可证与来源

本项目以 MIT 许可发布，见 [LICENSE](LICENSE)。

账号渠道实现来自社区 MIT 项目（作者 Jet，以及 `XDTrees/dsh-xdpool` 的同源再构建），出处、提交与再构建方式记录在 [vendor/channel-pack/NOTICE.md](vendor/channel-pack/NOTICE.md)。

本项目是个人学习与技术研究项目，与任何模型提供方、平台厂商均无隶属、认可或赞助关系；平台名称与商标归各自所有者所有。使用本插件访问任何第三方服务，均受该服务自身条款约束。
