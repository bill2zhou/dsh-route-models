/**
 * 渠道模型 — browser half.
 *
 * Contributes three things to the web shell:
 *   1. a settings section (`settings.section` id `route-models`) holding the
 *      account channels, the aggregate/workspace/saver/routing consoles, the usage
 *      ledger, the run log, the local gateway plus its OpenAI forward listener and
 *      egress outlet, the plugin's own switches and the announcement center;
 *   2. a first-run announcement (`settings.onboarding`) that is versioned, so
 *      bumping the copy re-announces once and never nags again;
 *   3. nothing else — no shadowing of the stock model picker, whose grouping by
 *      provider route is exactly the mechanism this plugin uses for its tag.
 *
 * The two lanes this plugin used to host in its own settings page — the anonymous
 * free / Kilo pool (免费模型) and the GitHub-auth EAC pool (EAC 模型) — are gone:
 * their tabs, roster cards, pool aquarium and login flow were all removed here.
 * Nothing on this surface reads `/eac/status` or `/pool` any more.
 *
 * Data is read over the plugin's own same-origin `/api/route-models/*` routes
 * rather than a typed Remote binding, because those routes are served by the same
 * host process on every kernel line this plugin targets.
 *
 * Hand-written ModuleLoader bundle: no build step, no dependency beyond the
 * `react` the shell already provides. All colour comes from theme variables so
 * the page survives a scheme switch.
 */

window.__ModuleLoader__.load({
  id: 'dsh-route-models',
  factory: require => {
    const module = { exports: {} }
    const exports = module.exports
    const React = require('react')
    const ReactDOM = require('react-dom')
    const { createElement: h, Fragment, useState, useEffect, useMemo, useRef, useCallback } = React

    const NS = 'settings.routeModels'
    const inject = ['slots', 'locale']


    // ── copy ──────────────────────────────────────────────────────────────────
    const DICT = {
      zh: {
        'reload.done': '插件已热重载（第 {n} 次）。',
        'reload.refresh': '刷新页面',
        'meta.title': '渠道模型',
        'meta.description': '在 DeepSeek Harness 内直连免密免费模型：清单随上游更新、地区可用性按需探测、思考强度真实生效，并附 Token 看板与 OpenAI 兼容转发端口。',
        'ann.pitch': '你只需在 dsh 里装上这个插件，无需登录、注册、填 API Key 或任何其它操作，就能用上包括 Muse Spark 1.3、MiMo V2.6 在内的前沿模型——完全免费，不限量。',
        nav: '渠道模型',
        title: '渠道模型',
        loading: '正在加载…',
        loadFailed: '无法连接插件后端',
        retry: '重试',
        'effects.enabled': '视觉特效',
        'effects.hint': '控制背景光晕、毛玻璃和装饰动画；鱼缸和模型功能始终保留。',
        'state.available': '可用',
        'state.region-blocked': '地区受限',
        'state.unavailable': '暂不可用',
        'state.throttled': '限流',
        'state.unknown': '未探测',
        'hint.region': '该模型按出口地区放行。开启网络代理后，插件会在下一次探测自动把它移入可用分组。',
        'tag.vision': '视觉',
        'tag.text': '纯文本',
        'eac.copy': '复制链接',
        'eac.copied': '已复制',
        'ann.preamble': '前言',
        'ann.models': '模型清单',
        'ann.steps': '使用步骤',
        'ann.features': '功能介绍',
        'ann.later': '稍后再说',
        'ann.page': '第 {n} / {total} 页',
        'ann.openSettings': '打开设置页',
        'disclaimer.version': '免责声明版本 v{n}',
        'disclaimer.saving': '保存中…',
        'disclaimer.reopen': '使用须知与免责声明',
        'ann.p1': '免密：安装即可用，不需要注册、不需要填任何 API Key。',
        'ann.p2': '清单跟随上游：模型集合、上下文长度与能力每次刷新都重新拉取。',
        'ann.p3': '诚实的能力声明：探测不出来的能力不会显示，思考强度档位是真实生效的输出上限。',
        'ann.s1': '在输入框的模型选择器里选任意已接入的模型。',
        'ann.s2': '需要更强推理时点开 Effort 档位；它是真实下发的输出预算，不是提示词。',
        'ann.s3': '想被其它本地工具调用：设置页 → 本地转发 → 启用，把 Base URL 和 Key 填进去。',
        'ann.s4': '地区受限模型会在你切换网络出口后自动重新归类，无需手动操作。',
        'ann.f1': '模型清单：可用性、上下文长度、是否支持视觉、是否可调思考。',
        'ann.f2': 'Token 热力图与总量曲线，支持总计与按模型分别查看。',
        'ann.f3': '输出速度（tok/s）与首字延迟（TTFT）逐次采样。',
        'ann.f4': 'OpenAI 兼容转发端口 + 可生成的 API Key。',
        'ann.f5': '全部数据留在本机，不上传任何遥测。',
        'ann.updates': '公告与升级',
        'ann.u1': '公告中心：仓库主人推送的新公告会实时到达，支持图文排版（HTML）。',
        'ann.u2': '系统通知：开启后，新公告与插件更新会弹出系统级通知。',
        'ann.u3': '应用内升级：自主管理的安装可在设置页升级；宿主管理的安装请通过原安装方式更新。',
        'ann.u4': '自主管理的安装可尝试应用内升级与热重载；宿主管理的安装请通过原安装方式更新，按宿主提示重新加载。',
        'news.urgentTitle': '重要公告',
        'news.gotIt': '知道了',
        'level.info': '通知',
        'level.update': '更新',
        'level.warn': '注意',
        'level.urgent': '紧急',
        'toast.annTitle': '新公告',
        'nav.tab.channels': 'EAC router',
        'chan.title': 'EAC router',
        'chan.sub': '账号渠道',
        'chan.search': '搜索渠道、厂商或 ID',
        'chan.filterStatus': '连接状态',
        'chan.filterAll': '全部',
        'chan.filterEmpty': '没有符合筛选条件的渠道。',
        'chan.showing': '{shown} / {total} 个渠道',
        'chan.connect': '连接',
        'chan.manage': '管理',
        'chan.collapse': '收起',
        'chan.state.loading': '读取中',
        'chan.pack.failed': '渠道包未挂载：{reason}（免费车道与 EAC 不受影响）',
        'chan.pack.hint': '渠道包由本插件内置（vendor/channel-pack），随插件一起升级。',
        'chan.state.on': '已连接',
        'chan.state.off': '未连接',
        'chan.state.closed': '已关闭',
        'chan.meta.accounts': '账号',
        'chan.meta.models': '模型',
        'chan.act.add': '添加账号',
        'chan.zcode.provider': '登录渠道',
        'chan.zcode.bigmodel': 'bigmodel.cn',
        'chan.zcode.zai': 'z.ai 国际版',
        'chan.act.refresh': '续期',
        'chan.act.test': '测试',
        'chan.act.delete': '移除',
        'chan.act.claim': '一键领取',
        'chan.fold.accounts': '账号',
        'chan.fold.models': '模型',
        'chan.noAccount': '还没有账号——点「添加账号」开始登录。',
        'chan.enabled': '已启用',
        'chan.act.enable': '启用',
        'chan.act.disable': '停用',
        'chan.expires.never': '长效',
        'chan.disabled': '已停用',
        'chan.login.title': '登录 {name}',
        'chan.login.step1': '在浏览器中完成登录（若没有自动打开，点下面的按钮）。',
        'chan.login.step2': '登录成功后本页会自动完成，无需复制任何东西。',
        'chan.login.open': '打开登录页',
        'chan.login.cancel': '取消',
        'chan.login.waiting': '已打开登录页，等待授权…（最长等待 10 分钟）',
        'chan.login.expired': '等待超时，请重新发起登录。',
        'chan.login.done': '已接入：{login}',
        'chan.login.failed': '登录未完成：{reason}',
        'chan.login.smsHint': '输入手机号，接收短信验证码完成登录。验证码 5 分钟内有效。',
        'chan.login.smsPhone': '手机号',
        'chan.login.smsSend': '发送验证码',
        'chan.login.smsSending': '发送中…',
        'chan.login.smsResend': '重新发送',
        'chan.login.smsCode': '验证码',
        'chan.login.smsSubmit': '登录',
        'chan.login.smsVerifying': '登录中…',
        'chan.login.smsSent': '验证码已发送，请查收短信。',
        'chan.login.smsDone': '登录成功，账号已加入列表。',
        'chan.login.smsPhoneInvalid': '请输入 11 位手机号。',
        'chan.test.ok': '连接正常（{ms} ms）',
        'chan.test.failed': '测试失败：{reason}',
        'chan.claim.result': '已领取 {count} 个账号，共 {credit} 积分。',
        'chan.claim.none': '今天没有可领取的积分。',
        'chan.credit.today': '今日已领 {credit}',
        'chan.model.free': '免费额度',
        'chan.model.dead': '已下架',
        'chan.model.hidden': '已隐藏',
        'chan.model.restore': '恢复显示',
        'chan.model.off': '关闭',
        'chan.model.on': '开启',
        'chan.model.enableAll': '全部开启',
        'chan.model.disableAll': '全部关闭',
        'chan.model.enabledCount': '已开启 {enabled}/{total}',
        'chan.model.allScope': '仅操作当前渠道的全部模型',
        'chan.error': '操作失败：{reason}',
        'chan.confirm.delete': '移除账号 {name}？该账号的凭据会一并删除。',
        'chan.rpc.unavailable': '宿主未提供 connection 服务，渠道操作暂不可用。',
        'nav.tab.ledger': '数据看板',
        'nav.tab.logs': '运行日志',
        'chan.titleSingle': '渠道',
        'dash.title': '数据看板',
        'dash.sub': '渠道模型的 Token 消耗与推理指标：输入/输出/思考/缓存逐项统计，账号与模型双维度透视。',
        'dash.today': '今日数据',
        'dash.all': '全部历史',
        'dash.refresh': '刷新',
        'dash.kpiToday': '今日消耗 Token',
        'dash.kpiScopeAll': '范围内消耗 Token',
        'dash.kpiCumulative': '累计消耗 Token',
        'dash.kpiSpeed': '平均生成速度',
        'dash.kpiCache': '上下文缓存命中率',
        'dash.kpiRequests': '请求数 & 成功率',
        'dash.input': '输入',
        'dash.output': '输出',
        'dash.reasoning': '思考',
        'dash.ttft': '首字',
        'dash.cacheTokens': '缓存命中',
        'dash.successRate': '成功率',
        'dash.failed': '失败',
        'dash.recentTitle': '总览 · 最近请求',
        'dash.recentHint': '来自渠道包的逐请求账本：时间、账号、首字延迟、生成速度与 Token 细分。',
        'dash.empty': '暂无数据——通过渠道模型发起一次对话后，这里就会开始记录。',
        'dash.accountsTitle': '各账号用量透视与模型消耗分布',
        'dash.accountsHint': '按账号汇总请求数与 Token 细分，附调用量最高的模型。',
        'dash.modelsTitle': '模型性能指标与用量一览',
        'dash.modelsHint': '融合首字延迟、生成速度与 Token 统计 · 用量占比按消耗 Token 计算。',
        'log.time': '时间',
        'log.model': '模型',
        'log.account': '账号',
        'log.via': '通道',
        'log.viaDirect': '对话',
        'log.viaGateway': '网关',
        'log.result': '结果',
        'log.ok': '成功',
        'log.failed': '失败',
        'log.duration': '耗时',
        'log.ttft': '首字',
        'log.speed': '速度',
        'log.input': '输入',
        'log.output': '输出',
        'log.reasoning': '思考',
        'log.cache': '缓存',
        'log.total': '总 token',
        'log.requests': '请求数',
        'log.inputSlash': '输入 / 输出 / 思考',
        'log.cacheHit': '缓存命中率',
        'log.share': '用量占比',
        'log.modelMix': '调用的模型分布',
        'log.unattributed': '未归属',
        'logs.title': '运行日志',
        'logs.sub': '逐条请求明细：结果、耗时、首字、速度与 Token 细分；悬停失败行可看原因。',
        'logs.auto': '每 10 秒自动刷新',
        'logs.count': '共 {total} 条 · 本页 {shown} 条',
        'logs.empty': '还没有请求记录。',
        'logs.page': '第 {page} 页 / 共 {pages} 页',
        'logs.windowNote': '逐条日志保留最近窗口；历史只保留按日聚合（约 90 天），数据看板的「全部历史」即来源于此。',
        'chan.credits.left': '剩余积分',
        'chan.credits.tokens': '剩余 Token',
        'chan.credits.dollars': '剩余余额（USD）',
        'chan.credits.quota': '剩余配额',
        'chan.credits.loaded': '已查询 {count} 个账号',
        'chan.credits.refresh': '刷新余额',
        'chan.credits.loading': '余额查询中…',
        'chan.credits.failed': '余额查询失败：{reason}',
        'chan.credits.partial': '{count} 个账号未能查询余额，请展开账号查看原因并重试。',
        'chan.credits.unavailable': '未返回余额数据',
        'chan.claim.failed': '领取失败：{reason}',
        'chan.auto.title': '每日自动签到',
        'chan.auto.running': '签到进行中…',
        'chan.auto.ran': '今日已自动签到',
        'chan.auto.off': '今日尚未签到',
        'chan.auto.last': '上次结果：{result}',
        'sub.add': '导入账号',
        'sub.provider': '服务商',
        'sub.label': '账号名称',
        'sub.models': '模型 ID',
        'sub.credentials': '凭据 JSON',
        'sub.file': '凭据文件',
        'sub.paste': '粘贴 JSON',
        'sub.upload': '选择文件',
        'sub.key': 'API Key',
        'sub.baseUrl': 'Base URL',
        'sub.format': '接口协议',
        'sub.import': '确认导入',
        'sub.cancel': '取消',
        'sub.working': '处理中…',
        'sub.invalidJson': '凭据必须是有效的 JSON 对象。',
        'sub.fileTooLarge': '凭据文件不能超过 1 MB。',
        'sub.fileFailed': '无法读取凭据文件。',
        'sub.invalidEndpoint': '请输入 HTTP(S) 地址，不含登录信息、查询参数或片段。',
        'sub.keyRequired': '请输入 API Key。',
        'sub.invalidModels': '请输入有效的模型 ID，以逗号或换行分隔。',
        'sub.enabled': '启用账号',
        'sub.refreshQuota': '刷新额度',
        'sub.remove': '移除',
        'sub.confirmRemove': '确认移除',
        'sub.removeQuestion': '移除此账号及保存的凭据？',
        'sub.unknown': '未知',
        'sub.quotaFailed': '额度查询失败',
        'sub.fiveHour': '5 小时',
        'sub.weekly': '每周',
        'sub.used': '已用 {n}%',
        'sub.remaining': '剩余 {n}%',
        'sub.resets': '重置时间',
        'sub.checked': '查询时间',
        'sub.plan': '订阅方案',
        'sub.balance': '余额',
        'sub.credits': '积分',
        'sub.unlimited': '不限量',
        'sub.noModels': '未指定模型',
        'nav.tab.saver': '省 Token',
        'saver.title': '省 Token',
        'saver.sub': '在请求离开本机之前压缩它：工具输出重编码、提示词瘦身，以及五个不占用上游请求的本地应答。',
        'saver.master': '启用 Token 压缩',
        'saver.masterHint': '关掉后所有压缩立即停止，请求按原样发出；下面的设置保留。',
        'saver.rtk': 'RTK 工具输出压缩',
        'saver.rtkWhat': '压缩的是工具结果：git diff / status / log、grep、find、ls、tree、构建日志、带行号的文件转储，以及重复的日志行。',
        'saver.rtkSafety': '安全边界：报错的工具结果原样保留，小体积内容不碰，替换只在新文本更小且非空时发生——压缩结果永远不会比原文更大。',
        'saver.promptTitle': '提示词压缩',
        'saver.promptHint': '在系统提示里追加一条写作指令。这是唯一能减少输出 Token 的压缩，因为它改变的是模型怎么写。',
        'saver.caveman': 'Caveman',
        'saver.cavemanWhat': '电报体回复：去掉客套与重复解释，只留结论与代码。',
        'saver.ponytail': 'Ponytail',
        'saver.ponytailWhat': 'YAGNI 最小实现：只写被要求的那一件事，不主动加抽象、配置与兜底。',
        'saver.voiceWarn': '注意：这两族会改变助手的说话方式，并且会留在你的对话记录里。默认关闭。',
        'saver.localTitle': '本地应答',
        'saver.localHint': '这五类请求的答案就在请求体里，转发出去只是白花一次上游额度与一个来回。',
        'saver.local.enabled': '启用本地应答',
        'saver.local.quota': '额度探测',
        'saver.local.quotaHint': '回答「额度检查」这类探针，返回一句固定答复。',
        'saver.local.prefix': '命令前缀',
        'saver.local.prefixHint': '回答权限提示要的命令前缀，从 shell 命令里解析。',
        'saver.local.title': '会话标题',
        'saver.local.titleHint': '回答标题生成请求，返回固定标题。',
        'saver.local.suggestion': '建议模式',
        'saver.local.suggestionHint': '回答建议模式的空转回合，不产生上游请求。',
        'saver.local.filepath': '文件路径提取',
        'saver.local.filepathHint': '从命令与输出里解析出文件路径，返回结构化结果。',
        'saver.dashTitle': '节省统计',
        'saver.dashHint': '按字节统计本机实际发生的压缩，只写入本机。',
        'saver.bytesBefore': '压缩前',
        'saver.bytesAfter': '压缩后',
        'saver.bytesSaved': '节省字节',
        'saver.percent': '节省比例',
        'saver.blocks': '压缩块数',
        'saver.calls': '统计调用',
        'saver.promptCalls': '提示词注入',
        'saver.noData': '还没有可统计的请求。发起一次对话后，这里显示的是真实压缩字节数，不是估算。',
        'saver.report': '统计口径',
        'saver.saved': '已保存',
        'saver.savedBody': 'Token 压缩设置已保存。',
        'saver.failed': '保存失败',
        'saver.loadFailed': '无法读取 Token 压缩设置',
        'saver.enabled': '已启用',
        'saver.disabled': '已关闭',
        'saver.level.off': '关闭',
        'saver.level.lite': '轻',
        'saver.level.full': '全',
        'saver.level.ultra': '极',
        'saver.level.wenyanLite': '文言·轻',
        'saver.level.wenyan': '文言',
        'saver.level.wenyanUltra': '文言·极',
      },
      en: {
        'reload.done': 'Plugin hot-reloaded (#{n}).',
        'reload.refresh': 'Reload page',
        'meta.title': 'Channel Models',
        'meta.description': 'Free no-key models inside DeepSeek Harness: a roster that follows upstream, on-demand regional availability, genuinely enforced thinking levels, a token dashboard and an OpenAI-compatible local forward port.',
        'ann.pitch': 'All you do is install this plugin in dsh — no login, no sign-up, no API key, no other step of any kind. The frontier models are simply there, Muse Spark 1.3 and MiMo V2.6 among them. Completely free, with no usage cap.',
        nav: 'Channel Models',
        title: 'Channel Models',
        loading: 'Loading…',
        loadFailed: 'Cannot reach the plugin backend',
        retry: 'Retry',
        'effects.enabled': 'Visual effects',
        'effects.hint': 'Toggle background glow, glass blur and decorative motion. The aquarium and model features stay available.',
        'state.available': 'Available',
        'state.region-blocked': 'Region-limited',
        'state.unavailable': 'Unavailable',
        'state.throttled': 'Throttled',
        'state.unknown': 'Not probed',
        'hint.region': 'This model is gated by egress country. Once a proxy changes your egress, the next probe moves it into the available group by itself.',
        'tag.vision': 'Vision',
        'tag.text': 'Text only',
        'eac.copy': 'Copy link',
        'eac.copied': 'Copied',
        'ann.preamble': 'Preamble',
        'ann.models': 'Model roster',
        'ann.steps': 'How to use',
        'ann.features': 'What it does',
        'ann.later': 'Later',
        'ann.page': 'Page {n} of {total}',
        'ann.openSettings': 'Open settings',
        'disclaimer.version': 'Disclaimer v{n}',
        'disclaimer.saving': 'Saving…',
        'disclaimer.reopen': 'Terms & disclaimer',
        'ann.p1': 'No credentials: install and use it — no sign-up, no API key to paste.',
        'ann.p2': 'The roster follows upstream: models, context lengths and capabilities are re-fetched on every refresh.',
        'ann.p3': 'Honest capability claims: anything a probe cannot confirm stays hidden, and each effort level is a real output budget.',
        'ann.s1': 'Pick any connected model in the composer’s model selector.',
        'ann.s2': 'For harder reasoning, open the Effort menu — it sends a real budget, not a prompt hint.',
        'ann.s3': 'To serve other local tools: Settings → Local forward → enable, then copy the base URL and key.',
        'ann.s4': 'Region-limited models reclassify themselves once your network egress changes.',
        'ann.f1': 'Model roster: availability, context length, vision, tunable thinking.',
        'ann.f2': 'Token heatmap and cumulative curve, per total or per model.',
        'ann.f3': 'Per-call samples of output speed (tok/s) and time to first token.',
        'ann.f4': 'OpenAI-compatible forward port with a generated API key.',
        'ann.f5': 'Everything stays on this machine — no telemetry.',
        'ann.updates': 'News & upgrades',
        'ann.u1': 'Announcement center: pushes from the repository owner arrive live, with rich (HTML) layout.',
        'ann.u2': 'OS notifications: once enabled, new announcements and plugin updates raise system-level toasts.',
        'ann.u3': 'In-app upgrades: self-managed installs can update from settings; host-managed installs use their original installation method.',
        'ann.u4': 'Self-managed installs can use in-app upgrades and hot reload. For host-managed installs, update through the original installation method and reload as instructed by the host.',
        'news.urgentTitle': 'Important announcement',
        'news.gotIt': 'Got it',
        'level.info': 'Notice',
        'level.update': 'Update',
        'level.warn': 'Heads-up',
        'level.urgent': 'Urgent',
        'toast.annTitle': 'New announcement',
        'nav.tab.channels': 'EAC router',
        'chan.title': 'EAC router',
        'chan.sub': 'Account channels',
        'chan.search': 'Search channel, vendor or ID',
        'chan.filterStatus': 'Connection status',
        'chan.filterAll': 'All',
        'chan.filterEmpty': 'No channel matches the filters.',
        'chan.showing': '{shown} / {total} channels',
        'chan.connect': 'Connect',
        'chan.manage': 'Manage',
        'chan.collapse': 'Collapse',
        'chan.state.loading': 'Loading',
        'chan.pack.failed': 'Channel pack not mounted: {reason} (the free and EAC lanes are unaffected)',
        'chan.pack.hint': 'The pack ships inside this plugin (vendor/channel-pack) and upgrades with it.',
        'chan.state.on': 'Connected',
        'chan.state.off': 'Not connected',
        'chan.state.closed': 'Turned off',
        'chan.meta.accounts': 'Accounts',
        'chan.meta.models': 'Models',
        'chan.act.add': 'Add account',
        'chan.zcode.provider': 'Sign-in route',
        'chan.zcode.bigmodel': 'bigmodel.cn',
        'chan.zcode.zai': 'z.ai international',
        'chan.act.refresh': 'Refresh',
        'chan.act.test': 'Test',
        'chan.act.delete': 'Remove',
        'chan.act.claim': 'Claim daily',
        'chan.fold.accounts': 'Accounts',
        'chan.fold.models': 'Models',
        'chan.noAccount': 'No account yet — press “Add account” to sign in.',
        'chan.enabled': 'Enabled',
        'chan.act.enable': 'Enable',
        'chan.act.disable': 'Disable',
        'chan.expires.never': 'Long-lived',
        'chan.disabled': 'Disabled',
        'chan.login.title': 'Sign in to {name}',
        'chan.login.step1': 'Finish the sign-in in your browser (if it did not open, use the button below).',
        'chan.login.step2': 'This page completes by itself once the browser flow does — nothing to copy.',
        'chan.login.open': 'Open sign-in page',
        'chan.login.cancel': 'Cancel',
        'chan.login.waiting': 'Sign-in page opened; waiting for authorization… (up to 10 minutes)',
        'chan.login.expired': 'Timed out — please start the sign-in again.',
        'chan.login.smsHint': 'Enter the phone number and the SMS code to sign in. The code is valid for 5 minutes.',
        'chan.login.smsPhone': 'Phone number',
        'chan.login.smsSend': 'Send code',
        'chan.login.smsSending': 'Sending…',
        'chan.login.smsResend': 'Resend code',
        'chan.login.smsCode': 'Code',
        'chan.login.smsSubmit': 'Sign in',
        'chan.login.smsVerifying': 'Signing in…',
        'chan.login.smsSent': 'Code sent — check your messages.',
        'chan.login.smsDone': 'Signed in; the account is in the list.',
        'chan.login.smsPhoneInvalid': 'Enter an 11-digit phone number.',
        'chan.login.done': 'Connected: {login}',
        'chan.login.failed': 'Sign-in did not complete: {reason}',
        'chan.test.ok': 'Connection healthy ({ms} ms)',
        'chan.test.failed': 'Test failed: {reason}',
        'chan.claim.result': 'Claimed for {count} account(s), {credit} credits in total.',
        'chan.claim.none': 'Nothing to claim today.',
        'chan.credit.today': '{credit} claimed today',
        'chan.model.free': 'Free quota',
        'chan.model.dead': 'Retired',
        'chan.model.hidden': 'Hidden',
        'chan.model.restore': 'Restore visibility',
        'chan.model.off': 'Hide',
        'chan.model.on': 'Show',
        'chan.model.enableAll': 'Show all',
        'chan.model.disableAll': 'Hide all',
        'chan.model.enabledCount': 'Shown {enabled}/{total}',
        'chan.model.allScope': 'Apply to all models in this channel only',
        'chan.error': 'Action failed: {reason}',
        'chan.confirm.delete': 'Remove account {name}? Its credential is deleted with it.',
        'chan.rpc.unavailable': 'This host exposes no connection service, so channel actions are unavailable.',
        'nav.tab.ledger': 'Dashboard',
        'nav.tab.logs': 'Request log',
        'chan.titleSingle': 'Channel',
        'dash.title': 'Usage dashboard',
        'dash.sub': 'Token spend and inference metrics for the channel models: input/output/reasoning/cache, pivoted by account and by model.',
        'dash.today': 'Today',
        'dash.all': 'All time',
        'dash.refresh': 'Refresh',
        'dash.kpiToday': 'Tokens today',
        'dash.kpiScopeAll': 'Tokens in scope',
        'dash.kpiCumulative': 'Tokens all time',
        'dash.kpiSpeed': 'Average speed',
        'dash.kpiCache': 'Context cache hit rate',
        'dash.kpiRequests': 'Requests & success rate',
        'dash.input': 'Input',
        'dash.output': 'Output',
        'dash.reasoning': 'Reasoning',
        'dash.ttft': 'TTFT',
        'dash.cacheTokens': 'Cache hits',
        'dash.successRate': 'Success',
        'dash.failed': 'Failed',
        'dash.recentTitle': 'Overview · Recent requests',
        'dash.recentHint': 'From the pack\'s per-request ledger: time, account, TTFT, speed and the token breakdown.',
        'dash.empty': 'Nothing yet — one conversation through a channel model starts the record.',
        'dash.accountsTitle': 'Per-account usage & model mix',
        'dash.accountsHint': 'Requests and token breakdown per account, with the most-used models.',
        'dash.modelsTitle': 'Model performance & usage',
        'dash.modelsHint': 'TTFT, speed and token statistics per model · usage share is by tokens spent.',
        'log.time': 'Time',
        'log.model': 'Model',
        'log.account': 'Account',
        'log.via': 'Via',
        'log.viaDirect': 'Chat',
        'log.viaGateway': 'Gateway',
        'log.result': 'Result',
        'log.ok': 'OK',
        'log.failed': 'Failed',
        'log.duration': 'Duration',
        'log.ttft': 'TTFT',
        'log.speed': 'Speed',
        'log.input': 'Input',
        'log.output': 'Output',
        'log.reasoning': 'Reasoning',
        'log.cache': 'Cache',
        'log.total': 'Total tok',
        'log.requests': 'Requests',
        'log.inputSlash': 'Input / Output / Reasoning',
        'log.cacheHit': 'Cache hit',
        'log.share': 'Share',
        'log.modelMix': 'Model mix',
        'log.unattributed': 'Unattributed',
        'logs.title': 'Request log',
        'logs.sub': 'Every request in detail: result, duration, TTFT, speed and the token breakdown; hover a failed row for the reason.',
        'logs.auto': 'Refresh every 10 s',
        'logs.count': '{total} entries · {shown} on this page',
        'logs.empty': 'No requests recorded yet.',
        'logs.page': 'Page {page} of {pages}',
        'logs.windowNote': 'Per-request rows cover a recent window only; history is kept as daily aggregates (~90 days) — the dashboard\'s "All time" reads those.',
        'chan.credits.left': 'Credits left',
        'chan.credits.tokens': 'Tokens left',
        'chan.credits.dollars': 'Balance left (USD)',
        'chan.credits.quota': 'Quota left',
        'chan.credits.loaded': '{count} accounts queried',
        'chan.credits.refresh': 'Refresh balance',
        'chan.credits.loading': 'Querying balance…',
        'chan.credits.failed': 'Balance query failed: {reason}',
        'chan.credits.partial': 'Could not query {count} accounts. Expand accounts to see the reasons and retry.',
        'chan.credits.unavailable': 'No balance data returned',
        'chan.claim.failed': 'Claim failed: {reason}',
        'chan.auto.title': 'Daily auto check-in',
        'chan.auto.running': 'Check-in running…',
        'chan.auto.ran': 'Checked in today',
        'chan.auto.off': 'Not checked in today',
        'chan.auto.last': 'Last result: {result}',
        'sub.add': 'Import account',
        'sub.provider': 'Provider',
        'sub.label': 'Account label',
        'sub.models': 'Model IDs',
        'sub.credentials': 'Credentials JSON',
        'sub.file': 'Credentials file',
        'sub.paste': 'Paste JSON',
        'sub.upload': 'Choose file',
        'sub.key': 'API Key',
        'sub.baseUrl': 'Base URL',
        'sub.format': 'API format',
        'sub.import': 'Confirm import',
        'sub.cancel': 'Cancel',
        'sub.working': 'Working…',
        'sub.invalidJson': 'Credentials must be a valid JSON object.',
        'sub.fileTooLarge': 'Credentials file must be 1 MB or smaller.',
        'sub.fileFailed': 'Could not read credentials file.',
        'sub.invalidEndpoint': 'Enter an HTTP(S) address without userinfo, query parameters or a fragment.',
        'sub.keyRequired': 'Enter an API key.',
        'sub.invalidModels': 'Enter valid model IDs separated by commas or newlines.',
        'sub.enabled': 'Enable account',
        'sub.refreshQuota': 'Refresh quotas',
        'sub.remove': 'Remove',
        'sub.confirmRemove': 'Confirm removal',
        'sub.removeQuestion': 'Remove this account and its saved credentials?',
        'sub.unknown': 'Unknown',
        'sub.quotaFailed': 'Quota query failed',
        'sub.fiveHour': '5 hours',
        'sub.weekly': 'Weekly',
        'sub.used': '{n}% used',
        'sub.remaining': '{n}% remaining',
        'sub.resets': 'Resets',
        'sub.checked': 'Checked',
        'sub.plan': 'Plan',
        'sub.balance': 'Balance',
        'sub.credits': 'credits',
        'sub.unlimited': 'Unlimited',
        'sub.noModels': 'No models specified',
        'nav.tab.saver': 'Token savers',
        'saver.title': 'Token savers',
        'saver.sub': 'Compact a request before it leaves this machine: tool output re-encoded, the prompt slimmed, and five answers produced locally without an upstream call.',
        'saver.master': 'Enable token compaction',
        'saver.masterHint': 'Turning this off stops every saver at once and sends requests as written; the settings below are kept.',
        'saver.rtk': 'RTK tool-output compaction',
        'saver.rtkWhat': 'What it compacts: tool results — git diff / status / log, grep, find, ls, tree, build logs, numbered file dumps and duplicate log lines.',
        'saver.rtkSafety': 'Safety rules: an error result is left untouched, small bodies are not touched, and a blob is replaced only when the new text is non-empty and strictly smaller — a compacted result is never larger than the original.',
        'saver.promptTitle': 'Prompt shaping',
        'saver.promptHint': 'Appends a writing instruction to the system prompt. It is the only saver that can cut output tokens, because it changes what the model writes.',
        'saver.caveman': 'Caveman',
        'saver.cavemanWhat': 'Terse replies: pleasantries and repeated explanation dropped, conclusions and code kept.',
        'saver.ponytail': 'Ponytail',
        'saver.ponytailWhat': 'YAGNI-minimal replies: only the one thing that was asked for, no unrequested abstraction, config or fallback.',
        'saver.voiceWarn': 'Heads-up: both families change how the assistant talks, and that lands in your transcript. Off by default.',
        'saver.localTitle': 'Local answers',
        'saver.localHint': 'The answer to these five requests is already in the request body; forwarding one spends a round trip and upstream quota on a question with one right answer.',
        'saver.local.enabled': 'Enable local answers',
        'saver.local.quota': 'Quota probe',
        'saver.local.quotaHint': 'Answers a "quota check" probe with a fixed line.',
        'saver.local.prefix': 'Command prefix',
        'saver.local.prefixHint': 'Answers the command prefix behind a permission prompt, parsed from the shell command.',
        'saver.local.title': 'Session title',
        'saver.local.titleHint': 'Answers a title-generation request with a fixed title.',
        'saver.local.suggestion': 'Suggestion mode',
        'saver.local.suggestionHint': 'Answers a suggestion-mode turn without producing an upstream request.',
        'saver.local.filepath': 'Filepath extraction',
        'saver.local.filepathHint': 'Parses the file paths out of a command and its output, and returns them structured.',
        'saver.dashTitle': 'Savings',
        'saver.dashHint': 'Bytes actually compacted on this machine, written locally only.',
        'saver.bytesBefore': 'Before',
        'saver.bytesAfter': 'After',
        'saver.bytesSaved': 'Bytes saved',
        'saver.percent': 'Saved',
        'saver.blocks': 'Blocks compacted',
        'saver.calls': 'Calls measured',
        'saver.promptCalls': 'Prompts shaped',
        'saver.noData': 'No request measured yet. One conversation later, this shows real compacted bytes rather than an estimate.',
        'saver.report': 'Reported as',
        'saver.saved': 'Saved',
        'saver.savedBody': 'The token-saver settings are saved.',
        'saver.failed': 'Not saved',
        'saver.loadFailed': 'Cannot read the token-saver settings',
        'saver.enabled': 'On',
        'saver.disabled': 'Off',
        'saver.level.off': 'Off',
        'saver.level.lite': 'Lite',
        'saver.level.full': 'Full',
        'saver.level.ultra': 'Ultra',
        'saver.level.wenyanLite': 'Classical · lite',
        'saver.level.wenyan': 'Classical',
        'saver.level.wenyanUltra': 'Classical · ultra',
      },
    }

    // ── styles ────────────────────────────────────────────────────────────────
    // Two theme variables are not defined by every shell — measured in the web
    // shell this plugin ships against, `--dsw-alias-state-warning-primary` and
    // `--dsw-alias-label-on-accent` resolve to nothing. A declaration whose
    // var() is invalid at computed-value time is dropped *whole*, so without a
    // fallback every warning-coloured surface disappears: the pool tank's water
    // (level "busy") rendered as an empty box, the region-limited badge lost its
    // colour, callouts lost their border. Every use of those two names carries a
    // fallback for exactly that reason.
    const CSS = `
/* ═══════════════════════════════════════════════════════════════════════
   渠道模型 — visual system
   统一令牌：所有色值取自宿主 --dsw-alias-* 变量，昼夜由宿主切换。
   层级约定：layer-3 凹槽/页面底 · layer-2 面板 · layer-1 浮起元素。
   动效约定：transform/opacity 优先；常规 150–300ms、覆盖层 300–400ms。
   ═══════════════════════════════════════════════════════════════════════ */.ofm_root{--ease-instrument:cubic-bezier(.16,1,.3,1);--ease-settle:cubic-bezier(.34,1.4,.4,1);--gap:14px;display:flex;flex-direction:column;gap:calc(var(--gap)*1.4);max-width:1080px;font-size:13px;line-height:1.55;color:var(--dsw-alias-label-primary);-webkit-font-smoothing:antialiased}.ofm_root::before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.022;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")}.ofm_root>*{position:relative;z-index:1}.ofm_root *{box-sizing:border-box}.ofm_root ::-webkit-scrollbar{width:10px;height:10px}.ofm_root ::-webkit-scrollbar-track{background:transparent}.ofm_root ::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--dsw-alias-label-tertiary) 32%,transparent);border-radius:99px;border:2.5px solid transparent;background-clip:padding-box}.ofm_root ::-webkit-scrollbar-thumb:hover{background:color-mix(in srgb,var(--dsw-alias-label-tertiary) 52%,transparent);background-clip:padding-box;border:2.5px solid transparent}.ofm_root{scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--dsw-alias-label-tertiary) 32%,transparent) transparent}.ofm_root ::selection{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 24%,transparent)}/* ── 键盘可达性：只给键盘聚焦画聚焦环，鼠标点击不出现 ─────────────────── */.ofm_root :focus-visible{outline:2px solid color-mix(in srgb,var(--dsw-alias-state-business-primary) 78%,transparent);outline-offset:2px;box-shadow:0 0 0 4px color-mix(in srgb,var(--dsw-alias-state-business-primary) 13%,transparent)}/* ══ 页头 hero ═════════════════════════════════════════════════════════ */.ofm_hero{position:relative;display:flex;flex-direction:column;gap:14px;padding:22px 24px;border-radius:20px;border:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 78%,transparent);background:linear-gradient(165deg,color-mix(in srgb,var(--dsw-alias-bg-layer-3) 88%,transparent),color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent));overflow:hidden}.ofm_hero::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 150% at 12% -20%,color-mix(in srgb,var(--dsw-alias-state-business-primary) 13%,transparent),transparent 58%),radial-gradient(90% 120% at 88% 130%,color-mix(in srgb,var(--dsw-alias-state-success-primary) 7%,transparent),transparent 60%)}.ofm_hero>*{position:relative}.ofm_pagehead{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap}.ofm_pagetitle{display:flex;flex-direction:column;gap:6px;min-width:0}.ofm_pagetitle h2{margin:0;font-size:23px;font-weight:760;letter-spacing:-.6px;line-height:1.2;background:linear-gradient(120deg,var(--dsw-alias-label-primary) 20%,color-mix(in srgb,var(--dsw-alias-label-primary) 55%,var(--dsw-alias-state-business-primary)));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}.ofm_pagesub{margin:0;font-size:12.5px;color:var(--dsw-alias-label-secondary);max-width:70ch}.ofm_pagehead .ofm_pills{margin-left:auto}.ofm_pills{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto}.ofm_pill{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 78%,transparent);box-shadow:inset 0 1px 0 rgb(255 255 255 / 4%);font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;transition:border-color .16s ease,color .16s ease}.ofm_pill.strong{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}.ofm_dot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-tertiary);flex:none}@keyframes ofm-dot-breathe{0%,100%{opacity:1}50%{opacity:.55}}.ofm_dot.ok{background:var(--dsw-alias-state-success-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-success-primary) 18%,transparent);animation:ofm-dot-breathe 2.6s ease-in-out infinite}.ofm_dot.warn{background:var(--dsw-alias-state-warning-primary,#f0a441);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-warning-primary,#f0a441) 18%,transparent)}.ofm_dot.err{background:var(--dsw-alias-state-error-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-error-primary) 18%,transparent)}/* ══ 区块与分节 ════════════════════════════════════════════════════════ */.ofm_sec{display:flex;flex-direction:column;gap:10px}.ofm_sechead{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding-bottom:6px;border-bottom:1px solid var(--dsw-alias-border-l1)}.ofm_sec_title{font-size:14px;font-weight:680;letter-spacing:-.2px}.ofm_sec_hint{font-size:11.5px;color:var(--dsw-alias-label-tertiary);margin-left:auto}.ofm_grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(252px,1fr));gap:10px}.ofm_badge{margin-left:auto;font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 60%,transparent);white-space:nowrap}.ofm_badge.available{color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 10%,transparent)}.ofm_badge.region-blocked{color:var(--dsw-alias-state-warning-primary,#f0a441);border-color:color-mix(in srgb,var(--dsw-alias-state-warning-primary,#f0a441) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warning-primary,#f0a441) 10%,transparent)}.ofm_badge.throttled,.ofm_badge.unavailable{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent)}.ofm_badge.unknown{color:var(--dsw-alias-label-tertiary)}.ofm_id{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ofm_note{font-size:11px;color:var(--dsw-alias-label-tertiary);line-height:1.5}/* ══ 面板 ══════════════════════════════════════════════════════════════ */.ofm_panel{padding:16px;border-radius:16px;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 82%,transparent);box-shadow:inset 0 1px 0 rgb(255 255 255 / 5%),0 2px 6px rgb(0 0 0 / 4%);display:flex;flex-direction:column;gap:12px}.ofm_paneltitle{font-size:12px;font-weight:680;letter-spacing:.2px;color:var(--dsw-alias-label-secondary);display:flex;align-items:center;gap:8px}.ofm_paneltitle .ofm_sec_hint{font-weight:400;letter-spacing:0}.ofm_row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}/* ══ 分段选择器 ════════════════════════════════════════════════════════ */.ofm_seg{display:inline-flex;padding:3px;border-radius:10px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);gap:2px;box-shadow:inset 0 1px 2px rgb(0 0 0 / 5%)}.ofm_seg button{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;font-weight:550;padding:3px 11px;border-radius:8px;cursor:pointer;transition:color .16s ease,background .16s ease,box-shadow .16s ease}.ofm_seg button:hover{color:var(--dsw-alias-label-primary)}.ofm_seg button[aria-pressed="true"]{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);box-shadow:0 1px 3px rgb(0 0 0 / 12%),inset 0 1px 0 rgb(255 255 255 / 6%)}/* ══ 数据表格 ══════════════════════════════════════════════════════════ */.ofm_table{width:100%;min-width:760px;border-collapse:collapse;font-size:11.5px}.ofm_tablewrap{overflow-x:auto;max-width:100%}.ofm_table th{text-align:left;font-weight:560;font-size:10.5px;letter-spacing:.4px;text-transform:uppercase;color:var(--dsw-alias-label-tertiary);padding:0 10px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap}.ofm_table td{padding:7px 10px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l1) 62%,transparent);font-variant-numeric:tabular-nums}.ofm_table td:first-child{font-weight:600}.ofm_table tbody tr{transition:background .15s ease}.ofm_table tbody tr:hover td{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 5%,transparent)}.ofm_table tr:last-child td{border-bottom:0}.ofm_num{text-align:right}/* ══ 按钮（分层状态） ══════════════════════════════════════════════════ */.ofm_btn{font:inherit;font-size:12px;font-weight:580;padding:6px 14px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb,var(--dsw-alias-bg-layer-3) 84%,transparent);box-shadow:inset 0 1px 0 rgb(255 255 255 / 5%),0 1px 2px rgb(0 0 0 / 6%);color:var(--dsw-alias-label-primary);cursor:pointer;transition:transform .18s var(--ease-instrument),border-color .2s var(--ease-instrument),background .2s var(--ease-instrument),box-shadow .22s var(--ease-instrument),opacity .16s ease}.ofm_btn:hover:not(:disabled){border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 62%,var(--dsw-alias-border-l2));background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 7%,var(--dsw-alias-bg-layer-3));transform:translateY(-1px);box-shadow:inset 0 1px 0 rgb(255 255 255 / 7%),0 3px 8px rgb(0 0 0 / 9%)}.ofm_btn:active:not(:disabled){transform:scale(.985);transition-duration:.1s;box-shadow:inset 0 1px 0 rgb(255 255 255 / 4%)}.ofm_btn:disabled{opacity:.45;cursor:default;box-shadow:none;transform:none}.ofm_btn.primary{background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-state-business-primary) 88%,#fff),var(--dsw-alias-state-business-primary));border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 82%,#000);color:var(--dsw-alias-label-on-accent,#fff);box-shadow:inset 0 1px 0 rgb(255 255 255 / 18%),0 2px 8px color-mix(in srgb,var(--dsw-alias-state-business-primary) 32%,transparent)}.ofm_btn.primary:hover:not(:disabled){background:linear-gradient(180deg,var(--dsw-alias-state-business-primary),color-mix(in srgb,var(--dsw-alias-state-business-primary) 88%,#000));border-color:var(--dsw-alias-state-business-primary);box-shadow:inset 0 1px 0 rgb(255 255 255 / 20%),0 4px 14px color-mix(in srgb,var(--dsw-alias-state-business-primary) 42%,transparent)}.ofm_btn.ghost{background:transparent;box-shadow:none;border-color:transparent;color:var(--dsw-alias-label-secondary)}.ofm_btn.ghost:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 80%,transparent);border-color:var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary)}.ofm_minibtn{font:inherit;font-size:11px;font-weight:540;padding:3px 9px;border-radius:8px;border:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 85%,transparent);background:color-mix(in srgb,var(--dsw-alias-bg-layer-3) 70%,transparent);color:var(--dsw-alias-label-secondary);cursor:pointer;transition:transform .12s ease,border-color .16s ease,color .16s ease,background .16s ease,opacity .16s ease}.ofm_minibtn:hover:not(:disabled){border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 60%,transparent);color:var(--dsw-alias-label-primary);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 7%,transparent);transform:translateY(-1px)}.ofm_minibtn:active:not(:disabled){transform:scale(.96)}.ofm_minibtn:disabled{opacity:.45;cursor:default;transform:none}.ofm_minibtn.danger:hover:not(:disabled){border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 60%,transparent);color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 7%,transparent)}/* ══ 表单 ══════════════════════════════════════════════════════════════ */.ofm_field{display:flex;flex-direction:column;gap:4px;min-width:120px}.ofm_field>span{font-size:11px;color:var(--dsw-alias-label-tertiary)}.ofm_input{font:inherit;font-size:12px;padding:6px 10px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);box-shadow:inset 0 1px 2px rgb(0 0 0 / 5%);color:var(--dsw-alias-label-primary);min-width:0;width:100%;transition:border-color .16s ease,box-shadow .16s ease}.ofm_input::placeholder{color:var(--dsw-alias-label-tertiary)}.ofm_input:hover{border-color:color-mix(in srgb,var(--dsw-alias-border-l2) 60%,var(--dsw-alias-label-tertiary))}.ofm_input:focus{outline:none;border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary) 20%,transparent)}/* ══ 开关（spring 滑块） ═══════════════════════════════════════════════ */.ofm_switch{display:inline-flex;align-items:center;gap:9px;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;appearance:none;background:transparent;border:0;padding:0;font:inherit;color:inherit}.ofm_switch i{width:36px;height:20px;border-radius:999px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);box-shadow:inset 0 1px 3px rgb(0 0 0 / 8%);position:relative;transition:background .2s ease,border-color .2s ease,box-shadow .2s ease;flex:none}.ofm_switch:hover i{filter:brightness(1.05)}.ofm_switch[aria-checked="true"]:hover i{filter:brightness(1.08)}.ofm_switch i::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-label-secondary);box-shadow:0 1px 3px rgb(0 0 0 / 22%);transition:transform .26s cubic-bezier(.34,1.3,.64,1),background .2s ease,width .16s ease}.ofm_switch:active i::after{width:17px}.ofm_switch[aria-checked="true"] i{background:var(--dsw-alias-state-business-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 85%,#000);box-shadow:inset 0 1px 3px rgb(0 0 0 / 12%)}.ofm_switch[aria-checked="true"] i::after{transform:translateX(16px);background:#fff}.ofm_switch[aria-checked="true"]:active i::after{transform:translateX(13px)}.ofm_switch:focus-visible i{box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary) 22%,transparent)}.ofm_mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;padding:7px 10px;border-radius:9px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);overflow-x:auto;white-space:pre;color:var(--dsw-alias-label-secondary)}/* ══ 提示条 ════════════════════════════════════════════════════════════ */.ofm_callout{display:flex;gap:9px;padding:10px 12px;border-radius:11px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-warning-primary,#f0a441) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warning-primary,#f0a441) 9%,transparent);font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-primary)}.ofm_error{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 9%,transparent)}/* ══ 小组件统计 ════════════════════════════════════════════════════════ */.ofm_stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:8px}.ofm_stat{padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 78%,transparent);border:1px solid var(--dsw-alias-border-l1);box-shadow:inset 0 1px 0 rgb(255 255 255 / 4%)}.ofm_stat b{display:block;font-size:16px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.3px}.ofm_stat span{font-size:10.5px;color:var(--dsw-alias-label-tertiary)}/* ══ 公告（首次引导） ══════════════════════════════════════════════════ */
    /* The onboarding slot is mounted inside the shell,but Announcement portals its
       scrim into document.body so third-party sidebar stacking contexts cannot trap
       the fixed overlay. Mask colour,blur and z-index mirror the Modal layer of the
       shell so this reads as first-party. */.ofm_scrim{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:var(--dsw-alias-bg-mask-1, rgb(0 0 0 / 32%));backdrop-filter:var(--dsw-mask-blur, blur(8px)) saturate(140%);-webkit-backdrop-filter:var(--dsw-mask-blur, blur(8px)) saturate(140%);animation:ofm-fadein .24s ease}@keyframes ofm-fadein{from{opacity:0}to{opacity:1}}.ofm_ann{width:min(620px,92vw);max-height:min(86vh,640px);border-radius:18px;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 94%,transparent);box-shadow:inset 0 1px 0 rgb(255 255 255 / 8%),0 28px 80px rgb(0 0 0 / 40%);overflow:hidden;display:flex;flex-direction:column;animation:ofm-popin .36s cubic-bezier(.16,1,.3,1)}@keyframes ofm-popin{from{opacity:0;transform:translateY(16px) scale(.965)}to{opacity:1;transform:none}}.ofm_annhead{padding:18px 22px 12px;display:flex;flex-direction:column;gap:8px;background:linear-gradient(150deg,color-mix(in srgb,var(--dsw-alias-state-business-primary) 8%,transparent),transparent 75%)}.ofm_anntitle{margin:0;font-size:18px;font-weight:730;letter-spacing:-.4px}.ofm_annsub{margin:0;font-size:12px;color:var(--dsw-alias-label-tertiary)}.ofm_steps{display:flex;gap:6px;padding:0 22px 14px}.ofm_step{height:3px;flex:1;border-radius:99px;background:var(--dsw-alias-border-l2);transition:background .3s ease}.ofm_step[data-on="true"]{background:var(--dsw-alias-state-business-primary);box-shadow:0 0 6px color-mix(in srgb,var(--dsw-alias-state-business-primary) 55%,transparent)}.ofm_annbody{padding:2px 22px 18px;max-height:min(48vh,420px);overflow:auto;display:flex;flex-direction:column;gap:12px}.ofm_annbody h3{margin:0;font-size:13.5px;font-weight:660}.ofm_annbody p,.ofm_annbody li{font-size:12.5px;line-height:1.72;color:var(--dsw-alias-label-secondary);margin:0}.ofm_annbody ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px}.ofm_annfoot{display:flex;align-items:center;gap:10px;padding:13px 22px;border-top:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 72%,transparent)}.ofm_annfoot .spacer{margin-left:auto}.ofm_disclaimersec{display:flex;flex-direction:column;gap:4px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l1)}.ofm_disclaimersec:first-of-type{border-top:0;padding-top:0}.ofm_disclaimersec h3{margin:0;font-size:13px;font-weight:660;color:var(--dsw-alias-label-primary)}.ofm_disclaimer{width:min(640px,92vw)}.ofm_shellfoot{display:flex;justify-content:center;padding:6px 0 2px}.ofm_linkbtn{appearance:none;background:none;border:0;padding:2px 6px;font:inherit;font-size:11.5px;color:var(--dsw-alias-label-tertiary);cursor:pointer;border-radius:6px;text-decoration:underline;text-underline-offset:3px;text-decoration-color:color-mix(in srgb,currentColor 40%,transparent)}.ofm_linkbtn:hover{color:var(--dsw-alias-label-secondary)}.ofm_kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.ofm_kvc{padding:9px 12px;border-radius:12px;border:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 74%,transparent);box-shadow:inset 0 1px 0 rgb(255 255 255 / 4%);display:flex;flex-direction:column;gap:3px}.ofm_kvc b{font-size:12.5px;font-variant-numeric:tabular-nums}.ofm_kvc span{font-size:10.5px;color:var(--dsw-alias-label-tertiary)}/* ══ Toast（fixed 到视口，浮在所有层之上） ════════════════════════════ */.ofm_toasts{position:fixed;right:18px;bottom:18px;z-index:1200;display:flex;flex-direction:column;gap:10px;max-width:min(380px,calc(100vw - 36px));font-family:inherit}.ofm_toast{position:relative;display:flex;flex-direction:column;gap:6px;padding:12px 14px 12px 16px;border-radius:13px;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 94%,transparent);backdrop-filter:blur(14px) saturate(150%);-webkit-backdrop-filter:blur(14px) saturate(150%);box-shadow:inset 0 1px 0 rgb(255 255 255 / 7%),0 14px 40px rgb(0 0 0 / 26%);font-size:12.5px;line-height:1.5;color:var(--dsw-alias-label-primary);animation:ofm-toast-rise .32s cubic-bezier(.16,1,.3,1);overflow:hidden}.ofm_toast{transform-origin:bottom right;will-change:transform}.ofm_toast::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--dsw-alias-state-business-primary)}.ofm_toast.warn::before{background:var(--dsw-alias-state-warning-primary,#f0a441)}.ofm_toast.urgent::before{background:var(--dsw-alias-state-error-primary)}.ofm_toast.warn{border-color:color-mix(in srgb,var(--dsw-alias-state-warning-primary,#f0a441) 42%,var(--dsw-alias-border-l2))}.ofm_toast.urgent{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 42%,var(--dsw-alias-border-l2))}.ofm_toast .ofm_toasttitle{font-weight:660;font-size:12.5px;display:flex;align-items:center;gap:7px}.ofm_toast .ofm_toastbody{color:var(--dsw-alias-label-secondary);max-height:180px;overflow:auto;overflow-wrap:anywhere}.ofm_toast .ofm_toastbody p{margin:0 0 5px}.ofm_toast .ofm_toastbody p:last-child{margin-bottom:0}.ofm_toast .ofm_toastbody img{max-width:100%}.ofm_toastactions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.ofm_toastclose{margin-left:auto;background:transparent;border:0;color:var(--dsw-alias-label-tertiary);cursor:pointer;font:inherit;font-size:13px;padding:0 2px;transition:color .14s ease}.ofm_toastclose:hover{color:var(--dsw-alias-label-primary)}@keyframes ofm-toast-rise{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}/* ══ 模态 ══════════════════════════════════════════════════════════════ */.ofm_modal{width:min(520px,92vw);max-height:min(80vh,600px);border-radius:18px;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 95%,transparent);box-shadow:inset 0 1px 0 rgb(255 255 255 / 8%),0 28px 80px rgb(0 0 0 / 42%);display:flex;flex-direction:column;overflow:hidden;animation:ofm-popin .34s cubic-bezier(.16,1,.3,1)}.ofm_modalhead{padding:17px 20px 11px;display:flex;align-items:center;gap:10px;font-size:15px;font-weight:720;letter-spacing:-.2px}.ofm_modalbody{padding:4px 20px 16px;overflow:auto;font-size:12.5px;line-height:1.7;color:var(--dsw-alias-label-secondary)}.ofm_modalbody p{margin:0 0 6px}.ofm_modalfoot{display:flex;justify-content:flex-end;gap:8px;padding:12px 20px;border-top:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 72%,transparent)}@media (max-width:720px){.ofm_sec_hint{margin-left:0;width:100%}.ofm_pills{margin-left:0;width:100%}}@keyframes ofmwave{to{transform:translateX(60px)}}@keyframes ofmbub{0%{transform:translateY(0);opacity:0}12%{opacity:.75}100%{transform:translateY(-136px);opacity:0}}@keyframes ofmswim{0%{transform:translateX(0)}100%{transform:translateX(270px)}}@keyframes ofmswimrev{0%{transform:translateX(270px)}100%{transform:translateX(0)}}@keyframes ofmrays{from{transform:translateX(-14px) rotate(-.4deg)}to{transform:translateX(14px) rotate(.4deg)}}/* ══ 三页外壳：极光底 · 毛玻璃导航 · 页过渡 ═════════════════════════════
   The aurora is a fixed layer *inside* our root: a flat shell background gives
   backdrop-filter nothing to sample,so every glass surface would read as a
   plain translucent box. It sits at z-index:-1 with isolation:isolate on the
   shell,which keeps it behind our content and above the app background without
   ever escaping into the shell's own stacking order. */.ofm_shell{position:relative;display:flex;flex-direction:column;gap:18px;max-width:1120px;isolation:isolate}@keyframes ofmdrift{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(3vw,2vh,0) scale(1.09)}100%{transform:translate3d(-3vw,-2vh,0) scale(.96)}}.ofm_nav{position:sticky;top:0;z-index:30;display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px 12px;padding:10px 12px;border-radius:16px;border:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 82%,transparent);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 62%,transparent);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);box-shadow:inset 0 1px 0 rgb(255 255 255 / 7%),0 8px 26px rgb(0 0 0 / 10%)}.ofm_navbrand{display:flex;align-items:center;gap:9px;font-weight:700;font-size:14px;letter-spacing:-.2px;white-space:nowrap}.ofm_navmark{width:26px;height:26px;border-radius:9px;display:grid;place-items:center;flex:none;background:linear-gradient(145deg,var(--dsw-alias-state-business-primary),color-mix(in srgb,var(--dsw-alias-state-business-primary) 42%,#3ECFA0));box-shadow:0 4px 12px color-mix(in srgb,var(--dsw-alias-state-business-primary) 40%,transparent),inset 0 1px 0 rgb(255 255 255 / 22%)}.ofm_navmark svg{width:16px;height:16px;fill:#fff}.ofm_tabs{position:relative;grid-column:1 / -1;display:flex;flex-wrap:wrap;gap:2px;padding:3px;border-radius:13px;border:1px solid color-mix(in srgb,var(--dsw-alias-border-l1) 80%,transparent);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 62%,transparent);box-shadow:inset 0 1px 2px rgb(0 0 0 / 4%)}.ofm_tabglider{position:absolute;top:0;left:0;border-radius:10px;background:linear-gradient(150deg,color-mix(in srgb,var(--dsw-alias-bg-layer-3) 92%,transparent),color-mix(in srgb,var(--dsw-alias-bg-layer-2) 88%,transparent));box-shadow:0 3px 10px rgb(0 0 0 / 14%),inset 0 1px 0 rgb(255 255 255 / 9%);transition:transform .34s cubic-bezier(.22,.61,.36,1),width .34s cubic-bezier(.22,.61,.36,1),height .34s cubic-bezier(.22,.61,.36,1);pointer-events:none}.ofm_tab{position:relative;z-index:1;font:inherit;font-size:12px;font-weight:600;padding:6px 13px;border-radius:10px;border:0;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;transition:color .2s ease}.ofm_tab[data-on="true"]{color:var(--dsw-alias-label-primary)}.ofm_tab:hover{color:var(--dsw-alias-label-primary)}.ofm_tab .ofm_tabnum{font-variant-numeric:tabular-nums;font-weight:600;color:var(--dsw-alias-label-tertiary);margin-left:6px;font-size:11px}.ofm_page{display:flex;flex-direction:column;gap:20px;animation:ofmpagein .4s cubic-bezier(.16,1,.3,1)}@keyframes ofmpagein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}/* ── 毛玻璃表面：只给大块面用 backdrop-filter，小卡片用半透明叠层，滚动更顺 */.ofm_glass{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 68%,transparent);backdrop-filter:blur(16px) saturate(150%);-webkit-backdrop-filter:blur(16px) saturate(150%);border:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 78%,transparent);box-shadow:inset 0 1px 0 rgb(255 255 255 / 6%),0 12px 34px rgb(0 0 0 / 9%)}.ofm_root .ofm_hero,.ofm_root .ofm_panel,.ofm_root .ofm_ann,.ofm_root .ofm_modal{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 70%,transparent);backdrop-filter:blur(18px) saturate(155%);-webkit-backdrop-filter:blur(18px) saturate(155%);box-shadow:inset 0 1px 0 rgb(255 255 255 / 7%),0 14px 40px rgb(0 0 0 / 10%)}/* ══ 渠道接入页 ════════════════════════════════════════════════════════ */.ofm_chanwrap{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:14px}.ofm_chan{position:relative;display:flex;flex-direction:column;gap:12px;padding:16px 17px 15px;border-radius:16px;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb,var(--dsw-alias-bg-layer-3) 78%,transparent);box-shadow:inset 0 1px 0 rgb(255 255 255 / 5%),0 1px 2px rgb(0 0 0 / 5%);overflow:hidden;transition:transform .22s cubic-bezier(.32,.72,0,1),box-shadow .24s ease,border-color .2s ease}.ofm_chan::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,var(--chan-accent,var(--dsw-alias-state-business-primary)),transparent 78%);opacity:.95}.ofm_chan:hover{transform:translateY(-3px);box-shadow:inset 0 1px 0 rgb(255 255 255 / 8%),0 18px 40px rgb(0 0 0 / 15%);border-color:color-mix(in srgb,var(--chan-accent,var(--dsw-alias-state-business-primary)) 55%,transparent)}.ofm_chan.off{opacity:.62}.ofm_chanhead{display:flex;align-items:center;gap:11px}.ofm_chanlogo{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;flex:none;font-weight:800;font-size:13px;color:#fff;letter-spacing:-.3px;background:linear-gradient(150deg,var(--chan-accent,var(--dsw-alias-state-business-primary)),color-mix(in srgb,var(--chan-accent,var(--dsw-alias-state-business-primary)) 45%,#101828));box-shadow:0 6px 16px color-mix(in srgb,var(--chan-accent,var(--dsw-alias-state-business-primary)) 34%,transparent),inset 0 1px 0 rgb(255 255 255 / 22%)}.ofm_chan:hover .ofm_chanlogo{transform:scale(1.06) rotate(-3deg);transition:transform .35s cubic-bezier(.34,1.56,.64,1)}.ofm_chanlogo{transition:transform .35s cubic-bezier(.34,1.56,.64,1)}.ofm_chanid{display:flex;flex-direction:column;gap:2px;min-width:0}.ofm_chanid b{font-size:14px;font-weight:700;letter-spacing:-.2px}.ofm_chanid span{font-size:11px;color:var(--dsw-alias-label-tertiary)}.ofm_chanstate{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:11px;color:var(--dsw-alias-label-secondary);padding:3px 10px;border-radius:999px;border:1px solid color-mix(in srgb,var(--dsw-alias-border-l1) 90%,transparent);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 70%,transparent);white-space:nowrap}.ofm_chanmeta{display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;color:var(--dsw-alias-label-tertiary)}.ofm_chanmeta b{color:var(--dsw-alias-label-secondary);font-weight:650;font-variant-numeric:tabular-nums}.ofm_chanacts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.ofm_acctlist{display:flex;flex-direction:column;gap:6px}.ofm_acct{display:flex;align-items:center;flex-wrap:wrap;gap:9px;padding:7px 10px;border-radius:11px;border:1px solid color-mix(in srgb,var(--dsw-alias-border-l1) 82%,transparent);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 62%,transparent);font-size:12px;transition:border-color .16s ease,background .16s ease}.ofm_acct:hover{border-color:var(--dsw-alias-border-l2);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 88%,transparent)}.ofm_acct.pending{border-style:dashed}.ofm_acctname{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}.ofm_acctmeta{font-size:10.5px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}.ofm_balanceerror{flex-basis:100%;overflow-wrap:anywhere;color:var(--dsw-alias-state-error-primary);font-size:11px}.ofm_acctacts{margin-left:auto;display:flex;gap:5px;flex-wrap:wrap}.ofm_modellist{display:flex;flex-direction:column;gap:4px;max-height:238px;overflow:auto;padding-right:2px}.ofm_modelrow{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:9px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 55%,transparent);font-size:11.5px;transition:background .15s ease}.ofm_modelrow:hover{background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 85%,transparent)}.ofm_modelrow.off{opacity:.5}.ofm_modelrow .ofm_id{flex:1;min-width:0}.ofm_tagpill{font-size:10px;font-weight:560;padding:1px 8px;border-radius:999px;border:1px solid color-mix(in srgb,var(--dsw-alias-border-l1) 90%,transparent);color:var(--dsw-alias-label-tertiary);white-space:nowrap}.ofm_tagpill.free{color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 55%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 8%,transparent)}.ofm_tagpill.dead{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 55%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent)}.ofm_chanfold{border-top:1px dashed color-mix(in srgb,var(--dsw-alias-border-l1) 85%,transparent);padding-top:10px;display:flex;flex-direction:column;gap:8px}.ofm_foldtoggle{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--dsw-alias-label-secondary);background:transparent;border:0;cursor:pointer;font-family:inherit;padding:0;transition:color .15s ease}.ofm_foldtoggle svg{transition:transform .3s cubic-bezier(.32,.72,0,1)}.ofm_foldtoggle:hover svg{transform:translateY(1px)}.ofm_foldtoggle:hover{color:var(--dsw-alias-label-primary)}.ofm_foldtoggle svg{width:10px;height:10px;fill:currentColor;transition:transform .22s ease}.ofm_foldtoggle[data-open="true"] svg{transform:rotate(90deg)}/* Compact account and provider directories. */.ofm_directoryhero{display:flex;flex-direction:column;gap:12px;padding:4px 0 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}.ofm_directoryhero>.ofm_btn{align-self:flex-start}.ofm_directoryhero h2{font-size:20px;letter-spacing:0;background:none;-webkit-text-fill-color:currentColor}.ofm_directorytools{display:flex;align-items:end;flex-wrap:wrap;gap:10px}.ofm_directorytools label{display:flex;flex-direction:column;gap:5px;font-size:11px;color:var(--dsw-alias-label-secondary);min-width:0;flex:1 1 140px}.ofm_directorytools label:first-child{flex:3 1 220px}.ofm_directorytools .ofm_input{width:100%;min-width:0;box-sizing:border-box}.ofm_directory{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,310px),1fr));align-items:start;gap:10px}.ofm_directorycount{font-size:11px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}.ofm_chan.compact{min-width:0;padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);box-shadow:none;display:flex;flex-direction:column;gap:10px;overflow-wrap:anywhere}.ofm_chan.compact::before{display:none}.ofm_chan.compact:hover{transform:none;box-shadow:none}.ofm_chan.compact .ofm_chanhead{gap:8px;flex-wrap:wrap}.ofm_chan.compact .ofm_chanid{flex:1;min-width:100px}.ofm_chan.compact .ofm_chanlogo{width:32px;height:32px;border-radius:6px;letter-spacing:0;box-shadow:none;transform:none}.ofm_chan.compact .ofm_chanid b{letter-spacing:0}.ofm_chan.compact .ofm_chanmeta{gap:10px}.ofm_directoryactions{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}.ofm_directorydetail{display:flex;flex-direction:column;gap:10px;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l1);min-width:0}.ofm_directorydetail .ofm_duo{grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))}.ofm_directorydetail .ofm_input{min-width:0;width:100%;box-sizing:border-box}.ofm_subform{display:flex;flex-direction:column;gap:14px;padding:16px 0;border-block:1px solid var(--dsw-alias-border-l1);min-width:0}.ofm_subform label{display:flex;flex-direction:column;gap:6px;min-width:0;font-size:12px}.ofm_subform .ofm_input{box-sizing:border-box;border-radius:6px;width:100%;max-width:100%}.ofm_subform textarea{resize:vertical;min-height:84px}.ofm_subform .ofm_duo{grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))}.ofm_subaccount{display:flex;flex-direction:column;gap:12px;padding:16px 0;border-bottom:1px solid var(--dsw-alias-border-l1);min-width:0;overflow-wrap:anywhere}.ofm_subaccount h3{font-size:14px;font-weight:600;margin:0;letter-spacing:0}.ofm_submeta{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:12px;color:var(--dsw-alias-label-secondary)}.ofm_subwindows{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:14px}.ofm_subwindow{display:flex;flex-direction:column;gap:5px;min-width:0;font-size:12px}.ofm_subwindow strong{font-size:13px;font-variant-numeric:tabular-nums}.ofm_subwindow progress{appearance:none;width:100%;height:5px;border:0;border-radius:2px;background:var(--dsw-alias-border-l1);accent-color:var(--dsw-alias-state-business-primary)}.ofm_subwindow progress::-webkit-progress-bar{background:var(--dsw-alias-border-l1);border-radius:2px}.ofm_subwindow progress::-webkit-progress-value{background:var(--dsw-alias-state-business-primary);border-radius:2px}.ofm_submodels{display:flex;flex-wrap:wrap;gap:5px;margin:0;padding:0;list-style:none;font-size:11px;color:var(--dsw-alias-label-secondary)}.ofm_submodels li{max-width:100%;overflow-wrap:anywhere}.ofm_submodels li+li::before{content:"/";padding-right:5px;color:var(--dsw-alias-label-tertiary)}/* ══ 骨架屏 ════════════════════════════════════════════════════════════ */.ofm_skel{position:relative;overflow:hidden;border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 60%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-border-l1) 60%,transparent);min-height:96px;animation:ofmpulse 1.8s ease-in-out infinite}.ofm_skel::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 30%,color-mix(in srgb,var(--dsw-alias-bg-layer-1) 55%,transparent) 50%,transparent 70%);transform:translateX(-100%);animation:ofm-skel-shine 1.8s ease-in-out infinite}@keyframes ofm-skel-shine{0%{transform:translateX(-100%)}60%,100%{transform:translateX(100%)}}.ofm_skel::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent,rgb(255 255 255 / 8%) 42%,transparent 74%);animation:ofmshine 1.5s ease-in-out infinite}@keyframes ofmshine{from{transform:translateX(-100%)}to{transform:translateX(100%)}}@keyframes ofmpulse{0%,100%{opacity:1}50%{opacity:.55}}/* ══ 登录引导 ══════════════════════════════════════════════════════════ */.ofm_loginbody{display:flex;flex-direction:column;gap:14px}.ofm_loginstep{display:flex;gap:11px;align-items:flex-start;font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}.ofm_loginstep b{flex:none;width:21px;height:21px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:650;background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 14%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary) 35%,transparent);color:var(--dsw-alias-state-business-primary)}.ofm_scanline{animation:ofmscan 2.2s ease-in-out infinite}@keyframes ofmscan{0%,100%{opacity:.35}50%{opacity:.85}}/* ══ 数据看板 KPI ══════════════════════════════════════════════════════ */.ofm_kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}.ofm_kpi{display:flex;flex-direction:column;gap:6px;padding:15px 17px;border-radius:16px;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb,var(--dsw-alias-bg-layer-3) 78%,transparent);box-shadow:inset 0 1px 0 rgb(255 255 255 / 5%),0 1px 2px rgb(0 0 0 / 5%);transition:transform .22s cubic-bezier(.32,.72,0,1),box-shadow .24s ease,border-color .2s ease}.ofm_kpi:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 45%,var(--dsw-alias-border-l2));box-shadow:inset 0 1px 0 rgb(255 255 255 / 8%),0 16px 36px rgb(0 0 0 / 13%)}.ofm_kpilabel{font-size:11px;font-weight:560;letter-spacing:.4px;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}.ofm_kpivalue{font-size:25px;font-weight:760;letter-spacing:-.7px;line-height:1.15;font-variant-numeric:tabular-nums;background:linear-gradient(120deg,var(--dsw-alias-label-primary),color-mix(in srgb,var(--dsw-alias-state-business-primary) 55%,var(--dsw-alias-label-primary)));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}.ofm_kpi:hover .ofm_kpivalue{transform:translateY(-1px);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}.ofm_kpivalue{transition:transform .3s cubic-bezier(.34,1.56,.64,1);display:inline-block}.ofm_kpisub{font-size:11px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}.ofm_kpi.warn .ofm_kpivalue{-webkit-text-fill-color:var(--dsw-alias-state-warning-primary,#f0a441);background:none}.ofm_logfailed td{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 5%,transparent)}/* ══ 真实图标与积分展示 ════════════════════════════════════════════════ */.ofm_navmark img,.ofm_chanlogo img{width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block}.ofm_chanlogo{padding:0;overflow:hidden}.ofm_credittotal b{color:var(--dsw-alias-state-success-primary);font-variant-numeric:tabular-nums}.ofm_creditbadge{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:600;padding:2px 9px;border-radius:999px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-warning-primary,#f0a441) 50%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warning-primary,#f0a441) 9%,transparent);color:var(--dsw-alias-state-warning-primary,#f0a441);white-space:nowrap}.ofm_creditbadge.strong{max-width:100%;white-space:normal;overflow-wrap:anywhere;color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 50%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 9%,transparent)}@media (max-width:760px){.ofm_tab{flex:1 1 auto;text-align:center}}/* ══ 动效降级：用户系统开启"减少动态效果"时全部收敛 ═══════════════════ */
/* —— 交互锚点增强：激活态 / 状态色 / 加载态（additive，不改既有规则） —— */
/* tab：激活项在滑块底衬之上再补一道品牌下划线，选中更明确 */.ofm_tab[aria-selected="true"]{color:var(--dsw-alias-label-primary)}.ofm_tab[aria-selected="true"]::after{content:"";position:absolute;left:12px;right:12px;bottom:3px;height:2px;border-radius:2px;background:var(--dsw-alias-state-business-primary);opacity:.85;transition:opacity .18s cubic-bezier(.32,.72,0,1)}/* 渠道卡：随接入状态着色顶部 hairline 与外发光（已接入=品牌色、关闭=灰、待接入=琥珀弱化） */.ofm_chan[data-state="on"]::before{background:linear-gradient(90deg,var(--chan-accent,var(--dsw-alias-state-business-primary)),color-mix(in srgb,var(--chan-accent,var(--dsw-alias-state-business-primary)) 30%,transparent));opacity:1}.ofm_chan[data-state="on"]{border-color:color-mix(in srgb,var(--chan-accent,var(--dsw-alias-state-business-primary)) 34%,var(--dsw-alias-border-l2))}.ofm_chan[data-state="idle"]::before{background:linear-gradient(90deg,var(--dsw-alias-state-warning-primary,#f0a441),transparent);opacity:.6}.ofm_chan[data-state="off"]::before{background:linear-gradient(90deg,var(--dsw-alias-label-tertiary),transparent);opacity:.5}/* 按钮：异步进行中显示内联 spinner（aria-busy 锚点，文字仍保留占位避免布局跳动） */.ofm_btn[aria-busy="true"]{position:relative;color:transparent !important;pointer-events:none}.ofm_btn[aria-busy="true"]::after{content:"";position:absolute;left:50%;top:50%;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;border:2px solid color-mix(in srgb,currentColor 30%,var(--dsw-alias-label-secondary));border-top-color:var(--dsw-alias-label-primary);animation:ofm-btn-spin .7s linear infinite}@keyframes ofm-btn-spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.ofm_root *,.ofm_root *::before,.ofm_root *::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}/* ═══ 精密仪器精修层（世界观：原厂仪器手感）：颜色听宿主，质感在阻尼。曲线 --ease-instrument 冲得快落得稳，--ease-settle 极轻过冲。退场比进场快。 ═══ */.ofm_glass{transition:border-color .22s var(--ease-instrument),box-shadow .26s var(--ease-instrument),transform .22s var(--ease-instrument),background .22s var(--ease-instrument)}.ofm_glass:hover{border-color:color-mix(in srgb,var(--dsw-alias-border-l2) 92%,var(--dsw-alias-state-business-primary));box-shadow:0 1px 2px rgb(0 0 0 / 5%),0 10px 28px -14px color-mix(in srgb,var(--dsw-alias-state-business-primary) 18%,transparent)}.ofm_kpi{transition:border-color .22s var(--ease-instrument),transform .22s var(--ease-instrument),box-shadow .26s var(--ease-instrument)}.ofm_kpi:hover{transform:translateY(-1px)}.ofm_kpivalue{transition:transform .3s var(--ease-settle),color .2s var(--ease-instrument);display:inline-block}.ofm_kpi:hover .ofm_kpivalue{transform:translateY(-1px) scale(1.015);color:var(--dsw-alias-label-primary)}.ofm_table tbody tr{transition:background .14s var(--ease-instrument)}.ofm_seg button{transition:background .2s var(--ease-instrument),color .2s var(--ease-instrument),border-color .2s var(--ease-instrument),box-shadow .22s var(--ease-settle)}.ofm_minibtn{transition:transform .14s var(--ease-instrument),border-color .18s var(--ease-instrument),color .18s var(--ease-instrument),background .18s var(--ease-instrument)}.ofm_minibtn:active:not(:disabled){transform:scale(.98);transition-duration:.09s}.ofm_root input,.ofm_root select,.ofm_root textarea{transition:border-color .18s var(--ease-instrument),box-shadow .2s var(--ease-instrument),background .18s var(--ease-instrument)}@media (prefers-reduced-motion:reduce){.ofm_glass,.ofm_kpi,.ofm_kpivalue,.ofm_minibtn{transition:none!important}.ofm_kpi:hover,.ofm_kpi:hover .ofm_kpivalue{transform:none}}/* ── ② 按钮 .ofm_btn ─────────────────────────── */
/* kinetic tension：外壳 active 陷落(scale .985)，内部 ::after 扫光条反向滑过形成"外陷内顶" */.ofm_root .ofm_btn{
  position: relative !important;
  overflow: hidden !important;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 7%) !important;
  transition: transform .16s var(--ease-settle), border-color .2s var(--ease-instrument), background .2s var(--ease-instrument), box-shadow .2s var(--ease-instrument), opacity .16s var(--ease-instrument) !important;
}.ofm_root .ofm_btn::after{
  content: "" !important;
  position: absolute !important;
  top: 0 !important; bottom: 0 !important;
  left: -60% !important; width: 42% !important;
  background: linear-gradient(100deg, transparent, rgb(255 255 255 / 14%), transparent) !important;
  transform: skewX(-18deg) !important;
  transition: left .5s var(--ease-instrument) !important;
  pointer-events: none !important;
}/* hover：扫光滑过（exit slower than press）；去掉原外投影，仅留顶部高光 */.ofm_root .ofm_btn:hover:not(:disabled){
  transform: translateY(-1px) !important;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 10%) !important;
}.ofm_root .ofm_btn:hover:not(:disabled)::after{
  left: 118% !important;
}/* active：快速陷落(.09s) + 内阴影加深=物理按压；松开靠 --ease-settle 回弹 */.ofm_root .ofm_btn:active:not(:disabled){
  transform: scale(.985) !important;
  transition-duration: .09s !important;
  box-shadow: inset 0 2px 5px rgb(0 0 0 / 14%), inset 0 1px 0 rgb(255 255 255 / 3%) !important;
}/* primary 按钮保留主色渐变，仅把外投影换成更克制的内高光+轻凹槽 */.ofm_root .ofm_btn.primary{
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 22%), inset 0 -10px 18px -12px rgb(0 0 0 / 24%) !important;
}.ofm_root .ofm_btn.primary:hover:not(:disabled){
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 26%), inset 0 -10px 18px -12px rgb(0 0 0 / 18%) !important;
}/* ── ③ 表格行 hover .ofm_table tbody tr ─────────────────────────── */
/* 行首 2px 主色竖条用 transform:scaleY 展开(不触发布局)；exit(.12s) 比 entrance(.16s) 快 */.ofm_root .ofm_table tbody tr{
  transition: background .16s var(--ease-instrument) !important;
}.ofm_root .ofm_table tbody tr td:first-child{
  position: relative !important;
}.ofm_root .ofm_table tbody tr td:first-child::before{
  content: "" !important;
  position: absolute !important;
  left: 0 !important; top: 6px !important; bottom: 6px !important;
  width: 2px !important; border-radius: 2px !important;
  background: var(--dsw-alias-state-business-primary) !important;
  transform: scaleY(0) !important;
  transform-origin: center !important;
  opacity: 0 !important;
  transition: transform .16s var(--ease-instrument), opacity .12s var(--ease-instrument) !important;
  pointer-events: none !important;
}.ofm_root .ofm_table tbody tr:hover td:first-child::before{
  transform: scaleY(1) !important;
  opacity: 1 !important;
}/* 数字列表针走格感：tabular-nums + pl5-tick 机械顿挫(steps) */.ofm_root .ofm_table td{
  font-variant-numeric: tabular-nums !important;
}/* 表针走格：离散百分比快照模拟 steps 顿挫——同值连帧=停格，瞬间跳格=机械感；@keyframes 里用不了 steps() 函数，用帧堆出来 */@keyframes pl5-tick{
  0%,24%{ transform: translateY(0); }
  25%,54%{ transform: translateY(-1.5px); }
  55%,79%{ transform: translateY(-.75px); }
  80%,100%{ transform: translateY(0); }
}/* ── 昼(not-dark)收敛：高光更哑、拉丝更隐、回弹更小 ─────────────── */@media not (prefers-color-scheme: dark){.ofm_root .ofm_panel{
    background:
      repeating-linear-gradient(115deg, rgb(255 255 255 / 4%) 0 1px, transparent 1px 2.5px) padding-box,
      color-mix(in srgb, var(--dsw-alias-bg-layer-2) 90%, transparent) !important;
  }
  .ofm_root .ofm_panel{
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 45%), inset 0 -14px 28px -18px rgb(0 0 0 / 7%) !important;
  }
  .ofm_root .ofm_btn{
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 50%) !important;
  }
  .ofm_root .ofm_btn:hover:not(:disabled){
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 62%) !important;
  }
}/* ── reduced-motion 降级：去位移/回弹/扫光/顿挫，保留颜色与不透明度反馈 ── */@media (prefers-reduced-motion: reduce){.ofm_root .ofm_panel,.ofm_root .ofm_btn,.ofm_root .ofm_table tbody tr,.ofm_root .ofm_table tbody tr td:first-child::before,.ofm_root .ofm_switch i,.ofm_root .ofm_switch i::after,.ofm_root .ofm_seg button,.ofm_root .ofm_stat,.ofm_root .ofm_kvc,.ofm_root .ofm_input,.ofm_root .ofm_chanlogo{
    transition: border-color .12s ease, background .12s ease, box-shadow .12s ease, opacity .12s ease, color .12s ease !important;
  }.ofm_root .ofm_btn:hover:not(:disabled),.ofm_root .ofm_btn:active:not(:disabled),.ofm_root .ofm_stat:hover,.ofm_root .ofm_kvc:hover,.ofm_root .ofm_seg button:active:not([aria-pressed="true"]),.ofm_root .ofm_chan:hover .ofm_chanlogo{
    transform: none !important;
  }
  /* 开关捏扁还原 */
  .ofm_root .ofm_switch:active i::after{
    width: 14px !important;
  }/* 扫光条砍掉 */
  .ofm_root .ofm_btn::after{
    content: none !important;
  }
  /* 呼吸灯停跳，但保留颜色状态 */
  .ofm_root .ofm_dot.ok{
    animation: none !important;
    opacity: 1 !important;
  }
  /* 表针走格动画停走，但保留数字本身 */
  .ofm_root .ofm_kpi:hover .ofm_kpivalue,
  .ofm_root .ofm_stat:hover b{
    animation: none !important;
  }
}/* ── ④ 输入框 .ofm_input：仪器凹槽手感 ─────────────────────────── */
/* 常态凹槽(inset 顶高光+底内阴影)；focus 时凹槽不动，只换边色+外发光，像仪器被点亮 */.ofm_root .ofm_input{
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 6%), inset 0 2px 6px -2px rgb(0 0 0 / 10%) !important;
  transition: border-color .18s var(--ease-instrument), box-shadow .2s var(--ease-instrument), background .18s var(--ease-instrument) !important;
}.ofm_root .ofm_input:hover{
  border-color: color-mix(in srgb, var(--dsw-alias-border-l2) 55%, var(--dsw-alias-state-business-primary)) !important;
}.ofm_root .ofm_input:focus{
  border-color: var(--dsw-alias-state-business-primary) !important;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 6%), inset 0 2px 6px -2px rgb(0 0 0 / 8%), 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent) !important;
}/* ── ⑤ 开关 .ofm_switch：spring 滑块阻尼 ─────────────────────────── */
/* 滑块用 --ease-settle 带回弹；按下时滑块变宽=被"捏扁"，松开回弹归位 */.ofm_root .ofm_switch i{
  box-shadow: inset 0 1px 3px rgb(0 0 0 / 10%), inset 0 -1px 0 rgb(255 255 255 / 4%) !important;
  transition: background .22s var(--ease-instrument), border-color .22s var(--ease-instrument), box-shadow .22s var(--ease-instrument) !important;
}.ofm_root .ofm_switch i::after{
  background: var(--dsw-alias-label-primary) !important;
  box-shadow: 0 1px 3px rgb(0 0 0 / 28%), inset 0 1px 0 rgb(255 255 255 / 20%) !important;
  transition: transform .28s var(--ease-settle), background .2s var(--ease-instrument), width .14s var(--ease-instrument) !important;
}.ofm_root .ofm_switch[aria-checked="true"] i{
  box-shadow: inset 0 1px 3px rgb(0 0 0 / 14%), inset 0 -1px 0 rgb(255 255 255 / 8%) !important;
}.ofm_root .ofm_switch[aria-checked="true"] i::after{
  background: var(--dsw-alias-label-on-accent, #fff) !important;
}.ofm_root .ofm_switch:active i::after{
  width: 17px !important;
}.ofm_root .ofm_badge{
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 6%) !important;
  transition: border-color .2s var(--ease-instrument), color .2s var(--ease-instrument), background .2s var(--ease-instrument) !important;
}/* 状态点呼吸灯保留，但改成 pl5- 前缀、机械顿挫更明显的两拍节奏 */@keyframes pl5-dot-breathe{
  0%,100%{ opacity:1; }
  50%{ opacity:.45; }
}.ofm_root .ofm_dot.ok{
  animation: pl5-dot-breathe 2.4s cubic-bezier(.4,0,.6,1) infinite !important;
}/* 分段控件选中块：加顶部高光，按下时微微陷落 */.ofm_root .ofm_seg button[aria-pressed="true"]{
  box-shadow: 0 1px 3px rgb(0 0 0 / 10%), inset 0 1px 0 rgb(255 255 255 / 8%) !important;
  transition: color .18s var(--ease-instrument), background .18s var(--ease-instrument), box-shadow .2s var(--ease-settle) !important;
}.ofm_root .ofm_seg button:active:not([aria-pressed="true"]){
  transform: scale(.97) !important;
}/* ── ⑦ 原生件接管：滚动条 / selection / caret / 聚焦环 ─────────────── */
/* 滚动条：仪器滑轨——thumb 加顶部高光与底部凹槽，hover 时轻微增亮 */.ofm_root ::-webkit-scrollbar-thumb{
  background: color-mix(in srgb, var(--dsw-alias-label-tertiary) 30%, transparent) !important;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 8%), inset 0 -1px 0 rgb(0 0 0 / 10%) !important;
  transition: background .2s var(--ease-instrument) !important;
}.ofm_root ::-webkit-scrollbar-thumb:hover{
  background: color-mix(in srgb, var(--dsw-alias-label-tertiary) 48%, transparent) !important;
}/* 文本选择：主色薄涂，昼模式再淡一点避免刺眼 */.ofm_root ::selection{
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 20%, transparent) !important;
}/* 光标：跟随主色 */.ofm_root input,.ofm_root textarea{
  caret-color: var(--dsw-alias-state-business-primary) !important;
}/* 聚焦环：仪器刻度环——细环+外晕，用 --ease-instrument 淡入 */.ofm_root :focus-visible{
  outline: 2px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 72%, transparent) !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent) !important;
  transition: box-shadow .18s var(--ease-instrument), outline-color .18s var(--ease-instrument) !important;
}/* ── ⑧【师傅批改①】拉丝纹理增强：金属感要真的能摸到 ─────────────── */
/* 夜模式 3% → 4.5%，昼模式 1.5% → 2.8%，纹理间隔收紧让拉丝更密 */.ofm_root .ofm_panel{
  background:
    repeating-linear-gradient(115deg, rgb(255 255 255 / 4.5%) 0 1px, transparent 1px 2.5px) padding-box,
    color-mix(in srgb, var(--dsw-alias-bg-layer-2) 86%, transparent) !important;
}@media not (prefers-color-scheme: dark){.ofm_root .ofm_panel{
    background:
      repeating-linear-gradient(115deg, rgb(255 255 255 / 4%) 0 1px, transparent 1px 2.5px) padding-box,
      color-mix(in srgb, var(--dsw-alias-bg-layer-2) 90%, transparent) !important;
  }}/* ── ⑧【师傅批改②】昼模式高光压暗：45-62% → 30-38%，更克制 ─────────── */@media not (prefers-color-scheme: dark){
  .ofm_root .ofm_panel{
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 34%), inset 0 -14px 28px -18px rgb(0 0 0 / 6%) !important;
  }
  .ofm_root .ofm_btn{
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 36%) !important;
  }
  .ofm_root .ofm_btn:hover:not(:disabled){
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 44%) !important;
  }.ofm_root .ofm_pill,.ofm_root .ofm_badge{
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 30%) !important;
  }
  .ofm_root .ofm_input{
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 34%), inset 0 2px 6px -2px rgb(0 0 0 / 6%) !important;
  }
}.ofm_root .ofm_kvc{
  transition: border-color .2s var(--ease-instrument), box-shadow .22s var(--ease-instrument), transform .2s var(--ease-settle) !important;
}.ofm_root .ofm_stat:hover,.ofm_root .ofm_kvc:hover{
  border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 38%, var(--dsw-alias-border-l1)) !important;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 7%) !important;
  transform: translateY(-1px) !important;
}/* 导航标：去掉 #3ECFA0 混色，改混 label-primary；外投影换成内高光+轻凹槽 */.ofm_root .ofm_navmark{
  background: linear-gradient(145deg, var(--dsw-alias-state-business-primary), color-mix(in srgb, var(--dsw-alias-state-business-primary) 58%, var(--dsw-alias-label-primary))) !important;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 26%), inset 0 -6px 12px -8px rgb(0 0 0 / 20%) !important;
}.ofm_root .ofm_navmark svg{
  fill: var(--dsw-alias-label-on-accent, #fff) !important;
}/* 渠道标：--chan-accent 兜底本来就是宿主变量，收编写死的 #fff / #101828，外投影换内高光 */.ofm_root .ofm_chanlogo{
  color: var(--dsw-alias-label-on-accent, #fff) !important;
  background: linear-gradient(150deg, var(--chan-accent, var(--dsw-alias-state-business-primary)), color-mix(in srgb, var(--chan-accent, var(--dsw-alias-state-business-primary)) 52%, var(--dsw-alias-bg-layer-3))) !important;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 24%), inset 0 -8px 14px -10px rgb(0 0 0 / 22%) !important;
  transition: transform .3s var(--ease-settle) !important;
}.ofm_root .ofm_chan:hover .ofm_chanlogo{
  transform: scale(1.05) rotate(-2deg) !important;
}/* ── ⑩【返工·收编 SEASON 落地件】渠道卡顶条 ─────────────── */
/* 渠道卡顶条用 --chan-accent：收敛高度与发光，听宿主凹槽语言 */.ofm_root .ofm_chan::before{
  height: 2px !important;
  box-shadow: 0 1px 0 rgb(255 255 255 / 6%) !important;
}.ofm_root .ofm_chan[data-state="on"]{
  border-color: color-mix(in srgb, var(--chan-accent, var(--dsw-alias-state-business-primary)) 30%, var(--dsw-alias-border-l2)) !important;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 7%) !important;
}/* ── ⑩【返工·接上 pl5-tick】KPI/统计数字获得表针走格感 ─────────────── */
/* 挂到 KPI 大数字与统计卡数字：hover 时数字以机械顿挫走一格，模拟仪表指针跳动 */.ofm_root .ofm_kpivalue,.ofm_root .ofm_stat b{
  display: inline-block !important;
}.ofm_root .ofm_kpi:hover .ofm_kpivalue,.ofm_root .ofm_stat:hover b{
  animation: pl5-tick .34s var(--ease-instrument) 1 !important;
}/* ==== V5 INSTRUMENT END ==== */
/* ── 聚合渠道 / 省 Token / 路由：新页面的表面 ─────────────────────────────
   动效一律走 150–250ms 的短过渡，不弹跳；reduced-motion 下由文件末尾的
   媒体查询整体关掉。ofm_rise 用 backwards 而不是 both：动画结束后元素回到
   样式表里的 transform，卡片的 hover 抬升才不会被动画的终态钉死。 */.ofm_rise{animation:ofmrisein .22s cubic-bezier(.22,.61,.36,1) backwards}@keyframes ofmrisein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.ofm_duo{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(272px,100%),1fr));gap:12px;align-items:start}.ofm_duo>*{min-width:0}.ofm_meter{height:9px;border-radius:99px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);overflow:hidden}.ofm_meter i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,color-mix(in srgb,var(--dsw-alias-state-business-primary) 62%,transparent),var(--dsw-alias-state-business-primary));transition:width .55s cubic-bezier(.22,.61,.36,1)}@media (max-width:600px){.ofm_duo{grid-template-columns:1fr}}@media (prefers-reduced-motion:reduce){.ofm_rise,.ofm_page{animation:none}.ofm_meter i,.ofm_kpi,.ofm_chan{transition:none}}/* 装饰特效默认关闭；鱼缸独立保留。布局用的 transform 不受影响。 */.ofm_navtools{grid-column:2;grid-row:1;display:flex;align-items:center;justify-self:end;gap:12px;flex-wrap:wrap}.ofm_root[data-ofm-effects="off"]::before{content:none}.ofm_root[data-ofm-effects="off"],.ofm_root[data-ofm-effects="off"] {
 backdrop-filter:none!important;-webkit-backdrop-filter:none!important;filter:none!important;
 animation:none!important;transition:none!important;will-change:auto!important;
}.ofm_root[data-ofm-effects="off"] ::before,.ofm_root[data-ofm-effects="off"] ::after{
 animation:none!important;transition:none!important;filter:none!important;
}.ofm_root[data-ofm-effects="off"] :is(.ofm_nav,.ofm_panel,.ofm_hero,.ofm_glass){background:var(--dsw-alias-bg-layer-2)!important}.ofm_root[data-ofm-effects="off"] :is(:hover,:active){transform:none!important}.ofm_root[data-ofm-effects="off"] :is(.ofm_btn{content:none!important}.ofm_root[data-ofm-active="false"] *,.ofm_root[data-ofm-active="false"] *::before,.ofm_root[data-ofm-active="false"] *::after{animation-play-state:paused!important}@media(prefers-reduced-motion:reduce){.ofm_root *,.ofm_root *::before,.ofm_root *::after{animation:none!important;transition:none!important}}/* Preserve the upstream horizontal navigation within narrow settings panes. */.ofm_root.ofm_shell{width:100%;min-width:0;letter-spacing:0}.ofm_shell .ofm_navbrand{min-width:0;white-space:normal;letter-spacing:0}.ofm_shell .ofm_tabs{min-width:0}.ofm_shell .ofm_tab{letter-spacing:0}.ofm_workspace{min-width:0;max-width:100%;overflow-wrap:anywhere}.ofm_workspace>.ofm_page{min-width:0;width:100%}.ofm_tab:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.ofm_directory>*{animation:ofmrisein .3s ease backwards}.ofm_directory>*:nth-child(2){animation-delay:.03s}.ofm_directory>*:nth-child(3){animation-delay:.06s}.ofm_directory>*:nth-child(4){animation-delay:.09s}.ofm_directory>*:nth-child(5){animation-delay:.12s}.ofm_directory>*:nth-child(6){animation-delay:.15s}.ofm_directory>*:nth-child(n+7){animation-delay:.18s}.ofm_directory .ofm_chan.compact{transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}.ofm_directory .ofm_chan.compact:hover{border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 42%,var(--dsw-alias-border-l2));box-shadow:0 4px 16px rgb(0 0 0 / 7%);transform:translateY(-1px)}.ofm_subaccount{animation:ofmrisein .3s ease backwards}.ofm_subaccount:nth-child(2){animation-delay:.04s}.ofm_subaccount:nth-child(3){animation-delay:.08s}.ofm_subaccount:nth-child(n+4){animation-delay:.12s}.ofm_subwindow progress{transition:opacity .3s ease}.ofm_shell .ofm_grid{grid-template-columns:repeat(auto-fill,minmax(min(252px,100%),1fr))}.ofm_shell :is(input,textarea,select){max-width:100%}@media(max-width:420px){.ofm_shell .ofm_nav{gap:8px;padding:8px}.ofm_shell .ofm_navtools{gap:8px}.ofm_shell .ofm_navtools .ofm_switch span{display:none}}
`

    // ── helpers ───────────────────────────────────────────────────────────────
    // 用页面 base 解析，而不是 origin-absolute 的「/api/...」：DSH 挂在反向代理
    // 子路径下（https://<host>/<prefix>/）时，前导斜杠会把 <prefix> 丢掉，请求
    // 直接打到站点根被前置网关 404，设置面板报「无法连接插件后端」（#54）。
    // 相对路径随页面 base 走，根路径部署下与原值完全一致。解析不了（无 document
    // 的宿主、非常规 base）就退回根路径原值——行为不比修复前差。
    const API = (() => {
      try { return new URL('api/route-models', document.baseURI).pathname } catch { return '/api/route-models' }
    })()

    async function api(path, options) {
      // 8 秒超时兜底：后端路由未注册/挂起时 fetch 不再永久挂起——此前全部 api 调用
      // （onboarding /announcement、设置页 /announcements /update/status、面板 /summary /stats
      // /forward/key 等）无任何超时，一个不响应端点即可阻塞 settings.onboarding 协调流程
      // 并长期占用同源连接池。超时按 AbortError 抛给调用方，走各自 .catch 降级路径。
      // 慢路由按需放宽（options.timeout，毫秒）：/bench 要等一整段真实生成（本车道
      // 首帧动辄数十秒），/update/apply 要下载+校验+安装整包，/refresh /reprobe 要
      // 跑完一整轮探测——8 秒兜底套在它们身上只会“前端报失败、后端继续烧”，
      // 测速按钮因此几乎必失败而配额照付。
      const { timeout = 8000, ...fetchOptions } = options ?? {}
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), timeout)
      try {
        const response = await fetch(`${API}${path}`, { ...fetchOptions, redirect: 'error', signal: ctrl.signal })
        const text = await response.text()
        let payload
        try { payload = text === '' ? {} : JSON.parse(text) } catch { payload = { error: text.slice(0, 200) } }
        if (!response.ok) throw new Error(payload?.error ?? `HTTP ${response.status}`)
        return payload
      } finally {
        clearTimeout(timer)
      }
    }

    const post = (path, body, timeout) => api(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      ...body === undefined ? {} : { body: JSON.stringify(body) },
      ...timeout === undefined ? {} : { timeout },
    })

    function useAsync(loader, deps) {
      const [state, setState] = useState({ status: 'loading', data: undefined, error: '' })
      const run = useCallback(() => {
        let alive = true
        setState(current => ({ ...current, status: 'loading' }))
        loader().then(data => { if (alive) setState({ status: 'ready', data, error: '' }) })
          .catch(error => { if (alive) setState({ status: 'error', data: undefined, error: String(error?.message ?? error) }) })
        return () => { alive = false }
      }, deps)
      useEffect(() => run(), [run])
      return { ...state, reload: run }
    }

    function kilo(value) {
      const n = Math.round(Number(value) || 0)
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
      if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`
      return String(n)
    }

    function ago(ts, locale) {
      if (!ts) return '—'
      const seconds = Math.max(1, Math.round((Date.now() - ts) / 1000))
      const zh = String(locale ?? '').toLowerCase().startsWith('zh')
      if (seconds < 60) return zh ? `${seconds} 秒前` : `${seconds}s ago`
      const minutes = Math.round(seconds / 60)
      if (minutes < 60) return zh ? `${minutes} 分钟前` : `${minutes}m ago`
      const hours = Math.round(minutes / 60)
      if (hours < 24) return zh ? `${hours} 小时前` : `${hours}h ago`
      return zh ? `${Math.round(hours / 24)} 天前` : `${Math.round(hours / 24)}d ago`
    }

    function copy(text, done) {
      const finish = ok => done(ok)
      if (navigator?.clipboard?.writeText !== undefined) {
        navigator.clipboard.writeText(text).then(() => finish(true), () => finish(legacy(text)))
        return
      }
      finish(legacy(text))
    }
    function legacy(text) {
      try {
        const area = document.createElement('textarea')
        area.value = text
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(area)
        return ok
      } catch { return false }
    }

    // ── announcement HTML: strict allowlist, no innerHTML sink ───────────────
    // The feed is authored by the repository owner, but rendering is a trust
    // boundary of its own: the feed URL can be pointed anywhere, and a
    // compromised repository must never become script execution. Nothing here
    // hands a string to the HTML engine — the tokenizer walks the text, drops
    // everything off the allowlist, and builds a virtual tree that both React
    // and plain DOM can materialize. The same parser is exercised headlessly
    // by scripts/sanitize-test.mjs.
    const ALLOWED_TAGS = new Set(['a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'code', 'dd', 'del', 'details', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre', 'q', 's', 'small', 'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul'])
    /** Everything these elements contain is dropped, closing tag included. */
    const DROP_CONTENT_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'textarea', 'title', 'svg', 'math', 'form', 'input', 'button', 'select', 'option', 'video', 'audio', 'canvas', 'link', 'meta', 'base'])
    const VOID_TAGS = new Set(['br', 'hr', 'img'])
    const MAX_HTML_NODES = 4000
    const ALLOWED_STYLE_PROPS = new Set(['color', 'background-color', 'text-align', 'font-weight', 'font-style', 'text-decoration'])
    const STYLE_CAMEL = { 'background-color': 'backgroundColor', 'text-align': 'textAlign', 'font-weight': 'fontWeight', 'font-style': 'fontStyle', 'text-decoration': 'textDecoration', color: 'color' }

    /** http(s), mailto and in-page fragments only; images additionally accept inline PNG/JPEG/GIF/WebP. */
    function safeUrl(raw, isImage) {
      const value = String(raw ?? '').trim()
      if (value === '' || value.length > 2000) return undefined
      const lower = value.toLowerCase()
      if (/^https?:\/\//.test(lower)) return value
      if (lower.startsWith('mailto:') && /^[^@\s]+@[^@\s]+$/.test(value.slice(7))) return value
      if (lower.startsWith('#')) return value
      if (isImage && /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(value)) return value
      return undefined
    }

    function sanitizeStyle(raw) {
      const out = {}
      for (const decl of String(raw ?? '').split(';')) {
        const idx = decl.indexOf(':')
        if (idx === -1) continue
        const prop = decl.slice(0, idx).trim().toLowerCase()
        const value = decl.slice(idx + 1).trim()
        if (!ALLOWED_STYLE_PROPS.has(prop) || value === '' || value.length > 120) continue
        if (/url\(|expression|javascript:|@|<|>/.test(value.toLowerCase())) continue
        out[STYLE_CAMEL[prop]] = value
      }
      return out
    }

    function sanitizeAttrs(tag, attrText) {
      const props = {}
      const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
      let match
      while ((match = attrRe.exec(attrText ?? '')) !== null) {
        const key = match[1].toLowerCase()
        const value = match[3] ?? match[4] ?? match[5] ?? ''
        if (key === 'style') {
          const style = sanitizeStyle(value)
          if (Object.keys(style).length > 0) props.style = style
          continue
        }
        if (tag === 'a' && key === 'href') {
          const url = safeUrl(value)
          if (url !== undefined) {
            props.href = url
            props.target = '_blank'
            props.rel = 'noopener noreferrer'
          }
          continue
        }
        if (tag === 'img' && key === 'src') {
          const url = safeUrl(value, true)
          if (url !== undefined) props.src = url
          continue
        }
        if ((tag === 'img' || tag === 'a') && key === 'title') { props.title = value.slice(0, 300); continue }
        if (tag === 'img' && key === 'alt') { props.alt = value.slice(0, 300); continue }
        if ((key === 'width' || key === 'height') && /^\d{1,4}$/.test(value)) { props[key] = Number(value); continue }
      }
      return props
    }

    /**
     * Tokenize announcement HTML into a virtual tree of
     * `{type:'el', tag, props, children}` and `{type:'text', text}` nodes.
     * Disallowed elements are unwrapped (their children survive); the content
     * of raw-text elements such as `<script>` is dropped entirely.
     */
    function parseSafeHtml(html) {
      if (typeof html !== 'string' || html.trim() === '') return []
      const root = { type: 'root', children: [] }
      const stack = [root]
      const top = () => stack[stack.length - 1]
      let nodes = 0
      let skipUntil = null
      const tokenRe = /<!--[\s\S]*?-->|<\/\s*([a-zA-Z][a-zA-Z0-9-]*)\s*>|<\s*([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>|([^<]+)/g
      let match
      while ((match = tokenRe.exec(html)) !== null) {
        if (nodes >= MAX_HTML_NODES) break
        if (match[0].startsWith('<!--')) continue
        if (match[4] !== undefined) {
          if (skipUntil === null) {
            const text = match[4]
            if (text.trim() !== '' || (top().children.length > 0 && typeof top().children[top().children.length - 1] !== 'string')) {
              top().children.push(text)
            }
          }
          continue
        }
        const name = (match[1] ?? match[2] ?? '').toLowerCase()
        if (name === '') continue
        if (match[1] !== undefined) {
          // closing tag
          if (skipUntil !== null) {
            if (name === skipUntil) skipUntil = null
            continue
          }
          if (!ALLOWED_TAGS.has(name)) continue
          let depth = stack.length - 1
          while (depth > 0 && stack[depth].tag !== name) depth -= 1
          if (depth === 0) continue
          while (stack.length - 1 > depth) {
            const dropped = stack.pop()
            top().children.push(...dropped.children)
          }
          const frame = stack.pop()
          top().children.push({ type: 'el', tag: frame.tag, props: frame.props, children: frame.children })
          nodes += 1
          continue
        }
        // opening tag
        if (skipUntil !== null) continue
        if (DROP_CONTENT_TAGS.has(name)) { skipUntil = name; continue }
        if (!ALLOWED_TAGS.has(name)) continue
        const props = sanitizeAttrs(name, match[3])
        if (name === 'img' && props.src === undefined) continue
        if (VOID_TAGS.has(name)) {
          top().children.push({ type: 'el', tag: name, props, children: [] })
          nodes += 1
          continue
        }
        stack.push({ tag: name, props, children: [] })
      }
      while (stack.length > 1) {
        const frame = stack.pop()
        top().children.push(...frame.children)
      }
      return root.children
    }

    /** Materialize the virtual tree as React elements (keys are positional). */
    function htmlToReact(nodes) {
      return nodes.map((node, index) => typeof node === 'string'
        ? node
        : h(node.tag, { key: index, ...node.props }, ...htmlToReact(node.children ?? [])))
    }

    /** Materialize the virtual tree as DOM nodes (for toasts and modals). */
    function htmlToDom(nodes) {
      return nodes.map(node => {
        if (typeof node === 'string') return document.createTextNode(node)
        const el = document.createElement(node.tag)
        for (const [key, value] of Object.entries(node.props ?? {})) {
          if (key === 'style') { Object.assign(el.style, value); continue }
          el.setAttribute(key, String(value))
        }
        for (const child of htmlToDom(node.children ?? [])) el.appendChild(child)
        return el
      })
    }

    // ── toasts: a vanilla-DOM host so pushes surface on every page ───────────
    // Slot content only exists where the shell mounts it; a toast that lived
    // inside the settings section would be invisible everywhere else. This
    // host attaches to document.body, outside the app root, and needs no
    // react-dom — the body renders through the same allowlist parser.
    function toastHost() {
      let host = document.querySelector('.ofm_toasts')
      if (host === null) {
        host = document.createElement('div')
        host.className = 'ofm_toasts'
        document.body.appendChild(host)
      }
      return host
    }

    function showToast({ title, body, html, tone, actions = [], holdMs = 10000 }) {
      try {
        const host = toastHost()
        const card = document.createElement('div')
        card.className = 'ofm_toast' + (tone === undefined ? '' : ` ${tone}`)
        const head = document.createElement('div')
        head.className = 'ofm_toasttitle'
        head.appendChild(document.createTextNode(title ?? ''))
        const close = document.createElement('button')
        close.type = 'button'
        close.className = 'ofm_toastclose'
        // No locale lookup in here on purpose: showToast also runs from the
        // push subscription before any `t` binding is in scope, and a throw
        // inside this try/catch would silently swallow the whole toast.
        close.setAttribute('aria-label', 'close')
        close.title = '✕'
        close.textContent = '✕'
        close.addEventListener('click', () => card.remove())
        head.appendChild(close)
        card.appendChild(head)
        if (body !== undefined && body !== '') {
          const area = document.createElement('div')
          area.className = 'ofm_toastbody'
          area.textContent = String(body)
          card.appendChild(area)
        } else if (html !== undefined) {
          const area = document.createElement('div')
          area.className = 'ofm_toastbody'
          for (const node of htmlToDom(parseSafeHtml(html))) area.appendChild(node)
          card.appendChild(area)
        }
        if (actions.length > 0) {
          const row = document.createElement('div')
          row.className = 'ofm_toastactions'
          for (const action of actions) {
            const btn = document.createElement('button')
            btn.type = 'button'
            btn.className = 'ofm_btn'
            btn.textContent = action.label
            btn.addEventListener('click', () => { card.remove(); action.onClick?.() })
            row.appendChild(btn)
          }
          card.appendChild(row)
        }
        host.appendChild(card)
        while (host.children.length > 4) host.firstElementChild?.remove()
        if (holdMs > 0) {
          const timer = setTimeout(() => card.remove(), holdMs)
          timer.unref?.()
        }
        return card
      } catch { /* a toast must never break its caller */ }
      return undefined
    }

    /** Modal surface for `urgent` announcements; dismiss runs the ack callback. */
    function showUrgentModal({ title, html, confirmLabel, onClose }) {
      try {
        document.querySelector('.ofm_scrim[data-ofm-urgent]')?.remove()
        const scrim = document.createElement('div')
        scrim.className = 'ofm_scrim'
        scrim.setAttribute('data-ofm-urgent', 'true')
        const modal = document.createElement('div')
        modal.className = 'ofm_modal'
        modal.setAttribute('role', 'alertdialog')
        modal.setAttribute('aria-modal', 'true')
        const head = document.createElement('div')
        head.className = 'ofm_modalhead'
        head.textContent = title ?? ''
        const body = document.createElement('div')
        body.className = 'ofm_modalbody'
        for (const node of htmlToDom(parseSafeHtml(html ?? ''))) body.appendChild(node)
        const foot = document.createElement('div')
        foot.className = 'ofm_modalfoot'
        const ok = document.createElement('button')
        ok.type = 'button'
        ok.className = 'ofm_btn primary'
        ok.textContent = confirmLabel ?? 'OK'
        ok.addEventListener('click', () => { scrim.remove(); onClose?.() })
        foot.appendChild(ok)
        modal.appendChild(head)
        modal.appendChild(body)
        modal.appendChild(foot)
        scrim.appendChild(modal)
        document.body.appendChild(scrim)
      } catch { /* a modal must never break its caller */ }
    }

    /** OS-level notification, only when the user both opted in and granted. */
    function osNotify(title, body) {
      try {
        if (typeof Notification !== 'function' || Notification.permission !== 'granted') return
        new Notification(title, { body: String(body ?? '').slice(0, 200) })
      } catch { /* the in-app toast still fires */ }
    }

    const Switch = (props) => h('button', {
      type: 'button',
      className: 'ofm_switch',
      role: 'switch',
      'aria-label': props.label,
      'aria-checked': props.checked ? 'true' : 'false',
      // Several call sites already pass `disabled` (the gateway switch does, while
      // its RPC is in flight) and it was silently dropped, so a switch stayed
      // clickable through a write it could not survive. Passing it through is what
      // those call sites meant.
      disabled: props.disabled === true,
      onClick: props.onChange,
    }, h('i'), props.label === undefined ? null : h('span', null, props.label))

    const Pill = (props) => h('span', { className: props.strong === true ? 'ofm_pill strong' : 'ofm_pill' },
      props.tone === undefined ? null : h('span', { className: `ofm_dot ${props.tone}` }),
      props.children)

    const Button = props => h('button', {
      type: 'button',
      className: 'ofm_btn' + (props.kind === undefined ? '' : ' ' + props.kind),
      disabled: props.disabled,
      onClick: props.onClick,
      title: props.title,
      'aria-label': props['aria-label'],
    }, props.children)

    function Section(props) {
      return h('section', { className: 'ofm_sec' },
        h('div', { className: 'ofm_sechead' },
          h('span', { className: 'ofm_sec_title' }, props.title),
          props.hint === undefined ? null : h('span', { className: 'ofm_sec_hint' }, props.hint)),
        props.children)
    }

    function Panel(props) {
      return h('div', { className: 'ofm_panel' },
        props.title === undefined ? null : h('div', { className: 'ofm_paneltitle' }, props.title, props.hint === undefined ? null : h('span', { className: 'ofm_sec_hint' }, props.hint)),
        props.children)
    }

    const stat = (value, label) => h('div', { className: 'ofm_stat' }, h('b', null, value), h('span', null, label))


    // ── forward listener ──────────────────────────────────────────────────────

    const field = (label, control) => h('label', { className: 'ofm_field' }, h('span', null, label), control)

    // ── preferences ───────────────────────────────────────────────────────────

    // ── announcement center ──────────────────────────────────────────────────
    const LEVEL_KEY = { info: 'level.info', update: 'level.update', warn: 'level.warn', urgent: 'level.urgent' }




    // ── EAC router ────────────────────────────────────────────────────────
    // Real channel logos carried over from the upstream Channel Pack client (see
    // vendor/channel-pack/NOTICE.md) — the same artwork users know from those
    // products, embedded so no network fetch is involved. Channels without an
    // entry fall back to their two-letter tile.
    const CHANNEL_ICONS = {
      'qodercn': 'data:image/png;base64,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',
      'qoder': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAALHElEQVR42s1aeVAUVxr/9UzDIIgiiAJRES2PmPVkS7xK47lE0cQDFSOeqFHX+1YuNcao8YhCFA9Y0agQdePtajR/JOLqllsBXY3xBjciiIugMMAcy/eYbrub7pnBmNr9qrqmXx/vfb/vfXcPjyrSAbBAQlarFWaz2Ven033EcVw/q9XaHkAAAA/hvvRZYSycC2OLxcLOhV/hnOM4eHh4QKfT4dWrVygoKGDXdDpdqcViyTOZTDcLCwt/SE9PP7Nx48bntvdFHjmg2AoU80rmbQv7AIjW6/WTAXiyFzhOxrTieVVy9LzJZIJer2dAiAiExWLx0Ol0QQaDIaihn9+gYUOHxvr7+V1KSzt0NDMz81apsewOm8fGF6/CfG8AewE0doZRLWBa7wrPcwDtsHhPAYLtTHlZGZ4+feo+bPjw/iPCwzukJCcnfbbm0/8Yyyue2abz5BWLRABIAWB4E0ZrRBwnqhXNTUft2rVlIMqMRnaNdgmA7+iIiGXv/eG98o8jxhw3lpfnCzsglbwq8zXnjRMZUwNN15l9mM0MiJSkINw9PFBaWoq8vDz4+PjA3d1d71vfN25sZKTHnuTkrTS3sAOk86k1ZZ4muHXrJi5euIirV6/gwf0HKCktgaenJ1q1aoVe77+PsLDBcHV1VQVioWsq16UgWrdujcePH8PFxQXPCwpQUVGhH/Lhh1P8AwIOrl37WRFvmzgaQCNn9bikpAT79qViz65duHPnjurzWZmZ+CY9HfFxcZgzZw7GfDwWBoNBnEdQG1IVwSuRTQi7IwXRNCgIv/76b5SVlyMoKAj37t71HjRwYMymLzYcpR3wBTDZWan/7exZLFm8GI8ePXTq+Wf5+YiJjsbOpJ2YN38+Pho6VNDp1zthsai+KwXRsKEfAgL0ePnyJRNCbm7u4LHjxm8hAB8JrtIekXRWxscjMWFbtQVpwgYNGqBt27ao6+XFdPaf164x/RUoJycb8+fNxY4d27FgwUIMHDRIlLZgK8wmFLYiBUFUVlYGs8WMNm3auDYNCupNAPo5Yr68vByfTJuGo0cOy657e3tjbOQ4DB02jDEvBVRcXIzdu3bhq8QEFBYWivd+uX0b06ZOQegHH2D79h0yQzeTYBRGzfO8DIRX3brM5dZydwfv4tKLALS3xzxJe97cuTLmOU6HyMhIxMbHMxBSGxF+yZDnzpuHyHHjkJiQgJTkPSziCpSdnc10mnbW4OoKnV4v2oQgfS2bcON5to5er2/D29IDTdq1cye+3r9PHJNH2fLlVoyOiJBJT+ucAMbExmJyVBS2bN6EA19/TZ6EBTIKVsTkq5IS6HU6GNzcmH04YxO2YFefF3IbNbr988+Ij4sVxzT5nuQUhA0erBnglECEXfH398fn69Zj0uQoTI2KYi6U5iMAwm9xURGpBWrVqqUpUNpZCQiet+c2o6NXyAwxOiZGxry9aK0ERjaxZ/cupO5NZS6xfn1fUSjSNU0VFSgsM8JgcGO6LjV04VcKQhMABabvzp8Xx127dsWs2bNlUnUmEhOdPHECy5ctQ27uE/GZgoJnzFN1Cg6WvWuy/RqNpaioKIeXVz1myJT4SQ1bAKEJYGdSksgkSWn1mjXgeRdV5rUkT4tGr1jBJK98h/R///79COnShZ3TIX1XT+m8yYwXL17Ay8tLdOVKEKoAKNKePn1aHHfv0QPBwX+sUWJHhvrJtKk49u231e6FjxyFRYsW4Z1GjRjjxAwxR+kCHUajkRk580QmExtL7ULwUJo7cPlyBkpLSsTxqFGjRXVwRv/pd/GiharME4WEdEaTwEBZ8UO7TAcBoLgTGxtT5XatVan2tsRE6Gw8kHDo0ASQlZklG/ft17dGdUBKcjL2pabKvJdZFmW5agKRVnHkLlu3fhfrPl8r3o8YMwZdu3VjyZ90VVUA9+/dE8/reXuzPMRZevjgAeJiY2S6unLVKmYLImBOnlYrgdB1Ynj9unUQqsiMjEvo1r07i9ScIwBFxUWydEFLfdRiQFxsLLMhgRYvWYLBQ4YwAJJ6ttqcwlzCQblVYNNAJhCiu3fvqvHB8erpw2umdDXQ/aysTJw6dVK816lTMObNX4Cc7GxFfuNSzdWqAfH38xcBPH/+nBm8QmBW3tnCxZ4RC4uS7ktzmZWrVzH9f/LkiWzhet71VCs3JSg9/zrIkUtVBjW7caCmRGnuqZOvpR8cHIxu3bqz859++kn2bIsWLR16tepSgtoOOAfAmcVu3LiB/Px8cTwifKS44NmzZ8TrpNtUVWlJvaZ8vLUdyJRImRbq2bNnVf7/yy/IuJQh3uvTpy/z9WophzOq6hQA7g0AZEsM1c3NjQUqoi82rIfZbBJbKeQetTLW6uecXc+lCcDV4CpJK0qrOgcOtrik5HWxQmGfjosXLuDI4cMSr9SJpSVKxrXzKavDXVAFEBDwjnhOGeTLV6/EYkLTU0lcL4HNycnBzBnTZUzFxsUzr6Q0RC31kQZ6zpbsObUDbdu1lRXz58+dY3WvIy8heiSjEaPCR1DnQLxGFVyvXr1Upa8VFJ0hVQB9+/ZjpSMlVUSbNm1kXQTq6zhDlITdvn1bHL/7bhusW79BUx2U9iDuyJsaMaUPw4ePwMGDB9j4elYWFi5YgE2bN4sexFmilPnAoUNiAWLPu1TbAc6xY9F0o0uXL2dpQVFRVV60L3Uva4ms+nQ1QkK6OMV8ULNmOHzkKPP7zrTjHdUZNYoDgYGB2LotAVGTJ4nl3JUrf0fogAH4U2golq+IRrt27TQXGjhwELYlJMDbx0eTCXuNX2c74XYDGbUBK0wVmDNrtugmWWQ9c4YZNqnZ4qVL0bx5c1aEC0QFyO7kZLvdBXvda2eisfC+w0gcHj4S7dt3YDk+MS520cxmpKen4dixb1njtk4dT1lJ+jQ3lzVlHTHiqAWvdU04JwCUvNt18i1btsTBQ2msU7F65Sr8+OMP4qKUxFHXTdnNO3fuHKZOm1ZjqdaQTASAeh0tnHm6c+cQHDtxAhcvXsDaNWtw7do1zWepCTxq9GjUrVvX4bzUe7px4zpatWqNOnXqaIBR9UP5BCDLWQBCO6Rfv/7o3bsPThw/js/WfMoSNiU9evQIEyeMx969qfC0MaXWdz196hQr4KmMJfc9fsJEtnN+fn5iHKqKxJzabl0nABcqT4bXdO8oJSAjp07doYMHWP2arai8KBfq2iUEs2bPQf8BA+Dr64vS0hLc/NdNfP/9RSaA+/fvi89T1bV500bW0aaG1z+uXhXv+fsHVLMBq9X6HQH4a6Xj2GCvR2rXjfE8a7EPGz4Cf0lJwZbNm5GX91S8T5+HlixexA4KgmT8Ws1baXF0OSND0UsaWe0xAIcJQK7ts+qM31IPuLu7Y8bMmRgbGYntXyWylroQBKXNLlUhuLhgyJAhrNX48GH1Lz8zZv4ZoaGhSjeclpSU9Ii3bcXKSlugbM0Pv5HICJcsXYaoKVOw9cut2L8vVfy6olTBFi1bIiwsDOPGT0CTJk1YwCS1Sks7xIr5oKBmmDhpElM/hVst4Dguevr06WJRn1dZk0yqTNmPv60qzcenPusHLV22jHmrWzdvsj6nm5sBTZoEomPHjmjUuLG8QOd5lvXSYac6ow4Z+eccMRLbduGM7UbS2yw1KRr36NGDHW8ScVWYn1OZ8R+RBjKpVSfbbII+eDfA/xcV2AR8RNlWEf/sYQNBbekOlUOyi7EkxP8x4+Rt0mzfsnMUO6MT/uwhA0HR2Wq1Tq28voo6JAD62z4G0mcVl9+ZYUp9qT9z3RajvqGWq4pKMZ7/CwW2lP0RDcI/AAAAAElFTkSuQmCC',
      'raccoon': 'data:image/png;base64,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',
      'zcode': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAgklEQVR42u3XsRGAIAyF4UxgYe0g7j+FpZtgRwN36stLAhruqP+v4ICIdNaybsViy92yCj+CeMW7CO94gwgFRMUrIgFTAPbzgPe/Aa5nAInTAGicAtDE1QBtXAVgxGEAeuIpAFYYArDj81xEoQDLd+A1ID8k3wTkXDDEaDbEcBo1nl/XXoK4yMqvMgAAAABJRU5ErkJggg==',
    }

    /** The plugin's own brand mark (icon.svg, inlined so no request is made). */
    const BRAND_ICON = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzkzNjc2MDA2MjMxIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjY0ODciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHBhdGggZD0iTTUxMiA1MTJtLTUxMiAwYTUxMiA1MTIgMCAxIDAgMTAyNCAwIDUxMiA1MTIgMCAxIDAtMTAyNCAwWiIgZmlsbD0iI0IzREZGRiIgcC1pZD0iNjQ4OCI+PC9wYXRoPjxwYXRoIGQ9Ik0yMDkuNDU0NTQ1IDQ5NS4wMTA5MDlhNDA4LjkwMTgxOCA0MDguOTAxODE4IDAgMCAxIDYwMi45OTYzNjQgMEw4ODQuMzYzNjM2IDQxOC45MDkwOTFhNTA1LjI1MDkwOSA1MDUuMjUwOTA5IDAgMCAwLTc0NC43MjcyNzIgMHoiIGZpbGw9IiM0MzlERkYiIHAtaWQ9IjY0ODkiPjwvcGF0aD48cGF0aCBkPSJNNTEyIDQ2OC43MTI3MjdhMzE2LjI3NjM2NCAzMTYuMjc2MzY0IDAgMCAwLTIzMC40IDEwMS40NjkwOTFsNjkuODE4MTgyIDc1LjE3MDkwOWEyMTYuNDM2MzY0IDIxNi40MzYzNjQgMCAwIDEgMzE5LjA2OTA5MSAwbDY5LjgxODE4Mi03NS4xNzA5MDlBMzE2LjI3NjM2NCAzMTYuMjc2MzY0IDAgMCAwIDUxMiA0NjguNzEyNzI3ek02MDAuNjY5MDkxIDcyMS40NTQ1NDVhMTIwLjU1MjcyNyAxMjAuNTUyNzI3IDAgMCAwLTE3Ny4zMzgxODIgMEw1MTIgODE0LjU0NTQ1NXoiIGZpbGw9IiM0MzlERkYiIHAtaWQ9IjY0OTAiPjwvcGF0aD48L3N2Zz4='

    /**
     * The current account channels enabled by OFM. Identity is static (it is
     * the product, not a reading), so the grid renders instantly and only the
     * *state* comes from the pack over RPC. `accent` drives each card's stripe
     * and logo tile; `login` picks the flow the card offers.
     */
    const CHANNEL_PROVIDERS = [
      { id: 'codearts', name: 'CodeArts', org: '华为云', accent: '#C7000B', note: '免费体验套餐自动续期；DeepSeek · GLM · openPangu 每日免费额度', login: 'browser' },
      { id: 'buddy', name: 'WorkBuddy 国内版', org: '腾讯', accent: '#0A7AFF', note: '与 CodeBuddy 共用端点：DeepSeek · Kimi · GLM 免费线，每日赠送积分', login: 'browser' },
      { id: 'workbuddy', name: 'WorkBuddy 国际版', org: '腾讯', accent: '#0B63CE', note: '独立端点与账号体系，积分与国内版不互通', login: 'browser' },
      { id: 'lobsterai', name: 'LobsterAI', org: '有道', accent: '#FF6A00', note: '龙虾 · 每日签到积分', login: 'browser' },
      { id: 'qoder', name: 'Qoder', org: '阿里系', accent: '#615CED', note: '每日 100 Credits，加密推理端点', login: 'browser' },
      { id: 'qodercn', name: 'Qoder 中国版', org: '阿里系', accent: '#7A6CF0', note: '中国版端点与模型池', login: 'browser' },
      { id: 'trae', name: 'TRAE', org: '字节', accent: '#00BFA6', note: '手机号登录', login: 'browser' },
      { id: 'loomy', name: 'Loomy', org: '讯飞', accent: '#2F6BFF', note: '短信验证码登录', login: 'sms' },
      { id: 'raccoon', name: 'Raccoon', org: '商汤', accent: '#00A6A6', note: '手机号登录', login: 'browser' },
      { id: 'minimax', name: 'MiniMax Code', org: 'MiniMax', accent: '#E4007F', note: '设备码 + PKCE，每日签到', login: 'browser' },
      { id: 'zcode', name: 'ZCode', org: '智谱', accent: '#3B6EF6', note: '浏览器登录（需本机可开浏览器）', login: 'browser' },
    ]

    /** 与现有 RPC 的能力对应：余额、每日领取及独立签到状态分别判断。 */
    const CHANNEL_CREDITS = {
      codearts: { claim: true },
      buddy: { claim: true, status: true },
      workbuddy: { status: true },
      lobsterai: { claim: true },
      qoder: { claim: true },
      qodercn: { claim: true },
      trae: { claim: true },
      loomy: { claim: true },
      raccoon: {},
      minimax: { claim: true, status: true },
      zcode: { claim: true, unit: 'tokens' },
    }

    /**
     * The host RPC the pack registered at `/api/channel-pack`.
     *
     * The pack's own browser half used the shell's connection service; this page
     * does the same instead of proxying through our JSON API, so channel traffic
     * keeps the connection's admission and the credential store stays the only
     * place a token exists. `connection` is read opportunistically: a shell that
     * does not offer it still renders the free and EAC pages, with this one
     * explaining itself instead of breaking.
     */
    function sameChannelTransport(left, right) {
      return left === right || (left !== null && right !== null
        && typeof left === 'object' && typeof right === 'object'
        && left.connection === right.connection && left.call === right.call)
    }

    function channelTransport(rpc) {
      return typeof rpc?.transport === 'function' ? rpc.transport() : rpc
    }

    function useChannelRpc(ctx) {
      const ctxRef = useRef(ctx)
      ctxRef.current = ctx
      const readTransport = useCallback(() => {
        const current = ctxRef.current
        let connection
        try { connection = current?.connection } catch { /* service not provided yet */ }
        if (connection === undefined || connection === null) {
          try { connection = current?.get?.('connection') } catch { /* service not provided yet */ }
        }
        try {
          const call = connection?.rpc?.call
          return typeof call === 'function' ? { connection, call } : null
        } catch { return null }
      }, [])
      const [transport, setTransport] = useState(readTransport)
      useEffect(() => {
        let alive = true
        const check = () => {
          if (!alive) return
          const next = readTransport()
          setTransport(previous => sameChannelTransport(previous, next) ? previous : next)
        }
        check()
        const timer = setInterval(check, 500)
        return () => { alive = false; clearInterval(timer) }
      }, [readTransport])
      // Context wrappers do not invalidate readers; actual transport replacement does.
      const rpc = useCallback(async (method, payload, timeoutMs = 60_000) => {
        const latest = readTransport()
        if (latest === null) throw new Error('no-connection')
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const result = await latest.call.call(latest.connection.rpc, '/api', 'channel-pack', { method, payload }, controller.signal)
          if (result?.ok === true) return result.value
          if (result?.ok === false) throw new Error(result.error?.message ?? result.error?.code ?? 'rpc-failed')
          return result
        } finally { clearTimeout(timer) }
      }, [readTransport, transport])
      rpc.transport = readTransport
      return { available: transport !== null, rpc }
    }

    const ZCODE_PROVIDER_KEY = 'ofm:zcode:login-provider'
    function closeLoginPopup(popup) {
      try { if (popup && !popup.closed) popup.close() } catch { /* best effort */ }
    }

    /** Human text for a millisecond timestamp, or the long-lived marker. */
    function expiryText(entry, t) {
      if (!Number.isFinite(entry?.expiresAt) || entry.expiresAt <= 0) return t('chan.expires.never')
      return ago(entry.expiresAt, t.locale)
    }

    function ChannelCard(props) {
      const { channel, status, rpc, t, onError, onChanged, compact = false, pending = false } = props
      const [open, setOpen] = useState(null)
      const [accounts, setAccounts] = useState(undefined)
      const [models, setModels] = useState(undefined)
      const [credits, setCredits] = useState(undefined)
      // 实时积分：每个账号的剩余余额（credits.balances），卡片汇总 + 账号行
      // 逐条展示；随账号列表与领积分动作刷新，另有一个慢轮询兜底。
      const [balances, setBalances] = useState(undefined)
      const [busy, setBusy] = useState('')
      const [notice, setNotice] = useState('')
      const [login, setLogin] = useState(null)
      // 短信登录（Loomy）：`account.create` 回 `loginMode:'sms'` 时用它驱动表单，
      // 与上面的 `login`（扫码/浏览器弹窗 + poll）互斥，同一时刻只会有一个。
      const [sms, setSms] = useState(null)
      const modelBatchPending = useRef(false)
      const [balanceError, setBalanceError] = useState('')
      const [balanceLoading, setBalanceLoading] = useState(false)
      const balancePending = useRef(null)
      const balanceGeneration = useRef(0)
      const claimPending = useRef(false)
      const creditCapability = CHANNEL_CREDITS[channel.id]
      const [zcodeProvider, setZcodeProvider] = useState(() => {
        try { return window.localStorage?.getItem(ZCODE_PROVIDER_KEY) === 'zai' ? 'zai' : 'bigmodel' } catch { return 'bigmodel' }
      })
      const loginAttempt = useRef(null)
      const chooseZcodeProvider = value => {
        if (value !== 'bigmodel' && value !== 'zai') return
        setZcodeProvider(value)
        try { window.localStorage?.setItem(ZCODE_PROVIDER_KEY, value) } catch { /* preference still applies this session */ }
      }
      const balanceLabel = creditCapability?.unit === 'tokens' ? t('chan.credits.tokens')
        : creditCapability?.unit === 'dollars' ? t('chan.credits.dollars')
          : creditCapability?.quota ? t('chan.credits.quota') : t('chan.credits.left')

      const accountsCount = status?.accounts?.total ?? 0
      const enabledCount = status?.accounts?.enabled ?? 0
      const modelsTotal = status?.models?.total ?? 0
      const modelsOff = status?.models?.disabled ?? 0
      const connected = status?.closed !== true && enabledCount > 0
      const chanState = status?.closed === true ? 'off' : connected ? 'on' : 'idle'
      const stateText = pending ? t('chan.state.loading') : status?.closed === true ? t('chan.state.closed') : connected ? t('chan.state.on') : t('chan.state.off')

      const loadAccounts = useCallback(async () => {
        try {
          const value = await rpc('account.list', { provider: channel.id })
          setAccounts(value?.accounts ?? [])
        } catch (error) { setAccounts([]); onError(channel, error) }
      }, [rpc, channel.id, onError])
      const loadModels = useCallback(async () => {
        try {
          const value = await rpc('model.list', { provider: channel.id })
          setModels(value?.models ?? [])
        } catch (error) { setModels([]); onError(channel, error) }
      }, [rpc, channel.id, onError])
      const loadCredits = useCallback(async () => {
        if (!CHANNEL_CREDITS[channel.id]?.status) return
        try {
          const value = await rpc('credits.status', { provider: channel.id })
          setCredits(value?.accounts ?? [])
        } catch { setCredits([]) }
      }, [rpc, channel.id])
      const loadBalances = useCallback((afterWrite = false) => {
        if (!CHANNEL_CREDITS[channel.id] || !rpc) return Promise.resolve()
        const pending = balancePending.current
        if (!afterWrite && pending?.provider === channel.id && pending.rpc === rpc) return pending.promise
        const generation = ++balanceGeneration.current
        const request = { provider: channel.id, rpc }
        balancePending.current = request
        setBalanceLoading(true); setBalanceError('')
        request.promise = (async () => {
          try {
            const value = await rpc('credits.balances', { provider: channel.id, ...afterWrite ? { force: true } : {} }, 90_000)
            if (generation === balanceGeneration.current) setBalances(value?.accounts ?? [])
          } catch (error) {
            if (generation === balanceGeneration.current) {
              setBalances([])
              setBalanceError(String(error?.message ?? error))
            }
          } finally {
            if (generation === balanceGeneration.current) setBalanceLoading(false)
            if (balancePending.current === request) balancePending.current = null
          }
        })()
        return request.promise
      }, [rpc, channel.id])
      useEffect(() => {
        setBalances(undefined); setBalanceError('')
        void loadBalances()
        return () => { balanceGeneration.current++; balancePending.current = null }
      }, [loadBalances])
      // A slow heartbeat keeps the numbers honest while the page sits open:
      // balances move whenever a model is used elsewhere, and a stale credit
      // count reads as "I have more quota than I do".
      useEffect(() => {
        if (!CHANNEL_CREDITS[channel.id]) return undefined
        const timer = setInterval(() => { void loadBalances() }, 90_000)
        return () => clearInterval(timer)
      }, [channel.id, loadBalances])
      const balanceOf = accountId => {
        const row = (balances ?? []).find(entry => entry.accountId === accountId)
        return row?.balance === null || row?.balance === undefined ? null : row.balance
      }
      const balancesTotal = (balances ?? []).reduce((sum, row) => sum + (Number.isFinite(row.balance?.total) ? row.balance.total : 0), 0)
      const balancesKnown = (balances ?? []).some(row => Number.isFinite(row.balance?.total))
      const balanceFailures = (balances ?? []).filter(row => row.error || !Number.isFinite(row.balance?.total)).length

      // Refetch what is on screen whenever the pack reports a change for this
      // channel: an account added in another tab, a completed background login,
      // a claim that moved the numbers.
      useEffect(() => {
        const onEvent = () => {
          if (open === 'accounts') { void loadAccounts(); void loadCredits() }
          if (open === 'models') void loadModels()
          void loadBalances()
        }
        window.addEventListener('ofm:channels', onEvent)
        return () => window.removeEventListener('ofm:channels', onEvent)
      }, [open, loadAccounts, loadModels, loadCredits, loadBalances])

      const toggle = async fold => {
        if (open === fold) { setOpen(null); return }
        setOpen(fold)
        if (fold === 'accounts') { setAccounts(undefined); await loadAccounts(); void loadCredits(); void loadBalances() }
        if (fold === 'models') { setModels(undefined); await loadModels() }
      }

      // The pack's login is two-phase: `account.create` returns the URL to open
      // *immediately* (a popup opened after a 30-second await is blocked), then
      // the browser flow finishes in the background and `login.poll` sees the
      // credential appear. The placeholder account is real from the first
      // moment, so the card can poll against it.
      useEffect(() => {
        if (loginAttempt.current?.cancelled) {
          loginAttempt.current = null
          setBusy(value => value === 'add' ? '' : value)
        }
        return () => {
          const attempt = loginAttempt.current
          if (attempt) { attempt.cancelled = true; closeLoginPopup(attempt.popup) }
        }
      }, [channel.id])
      useEffect(() => {
        const attempt = loginAttempt.current
        if (!attempt || sameChannelTransport(attempt.transport, channelTransport(rpc))) return
        attempt.cancelled = true
        closeLoginPopup(attempt.popup)
        loginAttempt.current = null
        setBusy(value => value === 'add' ? '' : value)
      }, [rpc])
      const startLogin = async () => {
        if (loginAttempt.current && !loginAttempt.current.cancelled) return
        const attempt = { popup: null, cancelled: false, transport: channelTransport(rpc) }
        const current = () => !attempt.cancelled && sameChannelTransport(attempt.transport, channelTransport(rpc))
        loginAttempt.current = attempt
        setBusy('add'); setNotice('')
        // Reserve inside the click; a delayed RPC would lose transient activation.
        try {
          attempt.popup = window.open('about:blank', '_blank')
          if (attempt.popup) attempt.popup.opener = null
        } catch { closeLoginPopup(attempt.popup); attempt.popup = null }
        try {
          const value = await rpc('account.create', {
            provider: channel.id,
            ...channel.id === 'zcode' ? { zcodeProvider } : {},
          }, 90_000)
          if (!current()) { attempt.cancelled = true; closeLoginPopup(attempt.popup); return }
          const accountId = value?.accountId
          const url = value?.loginUrl
          if (typeof accountId !== 'string' || accountId === '') throw new Error('bad-answer')
          if (value?.loginMode === 'sms') {
            // 短信登录没有可打开的页面：关掉为手势预开的空白窗，改在本页渲染表单。
            // 占位账号已经存在，验证码由下面的表单提交（不经过 `login.poll`）。
            closeLoginPopup(attempt.popup); attempt.popup = null
            setLogin(null)
            setSms({ accountId, phone: '', code: '', sending: false, verifying: false, sent: false, error: '' })
            setOpen('accounts')
            return
          }
          if (typeof url === 'string' && url !== '') {
            const target = new URL(url)
            if (url.length > 2048 || !['http:', 'https:'].includes(target.protocol) || target.username || target.password) throw new Error('bad-login-url')
            let opened = false
            try {
              if (attempt.popup && !attempt.popup.closed) {
                attempt.popup.location.replace(url)
                opened = true
                attempt.popup = null
              }
            } catch { /* the host can open it instead */ }
            closeLoginPopup(attempt.popup); attempt.popup = null
            if (!opened) {
              try { opened = (await post('/open-external', { url }, 15_000))?.opened === true } catch { /* manual link remains available */ }
            }
            if (!current()) { attempt.cancelled = true; return }
            if (!opened) {
              try { window.open(url, '_blank', 'noopener') } catch { /* the modal offers the link too */ }
            }
          } else { closeLoginPopup(attempt.popup); attempt.popup = null }
          setLogin({ accountId, url: typeof url === 'string' ? url : '', startedAt: Date.now() })
          setOpen('accounts')
        } catch (error) {
          closeLoginPopup(attempt.popup)
          if (current()) onError(channel, error)
        } finally {
          if (loginAttempt.current === attempt && !attempt.cancelled) {
            loginAttempt.current = null
            setBusy('')
          }
        }
      }

      // Poll the placeholder until its credential lands. Ten minutes matches the
      // window the pack keeps a pending login link alive for.
      useEffect(() => {
        if (login === null) return undefined
        let alive = true
        const timer = setInterval(async () => {
          if (Date.now() - login.startedAt > 10 * 60_000) {
            if (alive) { setLogin(null); setNotice(t('chan.login.expired')) }
            return
          }
          try {
            const value = await rpc('login.poll', { accountId: login.accountId, provider: channel.id })
            if (!alive) return
            if (value?.done === true) {
              setLogin(null)
              if (value.success === false) {
                setNotice(t('chan.login.failed').replace('{reason}', value.error ?? '未知原因'))
              } else {
                setNotice(t('chan.login.done').replace('{login}', value.login ?? ''))
                onChanged()
                void loadAccounts()
                void loadCredits()
                void loadBalances(true)
              }
            } else if (typeof value?.error === 'string' && value.error !== '') {
              setLogin(null)
              setNotice(t('chan.login.failed').replace('{reason}', value.error))
            }
          } catch { /* the link may still complete; keep polling */ }
        }, 3000)
        return () => { alive = false; clearInterval(timer) }
      }, [login, rpc, channel.id, t, onChanged, loadAccounts, loadCredits, loadBalances])

      // 短信登录：验证码由本页发、本页提交，不经 `login.poll`。`login.submitSms`
      // 失败时仍回 `ok:true, done:false`（验证码输错可重试），所以表单不关，
      // 只把原因显示出来；5 分钟后 msgid 过期，重发即可。
      const smsSend = async () => {
        if (sms === null) return
        const phone = sms.phone.trim()
        if (!/^1[3-9]\d{9}$/.test(phone)) {
          setSms(current => current === null ? null : { ...current, error: t('chan.login.smsPhoneInvalid') })
          return
        }
        setSms(current => current === null ? null : { ...current, sending: true, error: '' })
        try {
          await rpc('login.sendSms', { accountId: sms.accountId, provider: channel.id, phone }, 60_000)
          setSms(current => current === null ? null : { ...current, sending: false, sent: true })
        } catch (error) {
          setSms(current => current === null ? null : { ...current, sending: false, error: String(error?.message ?? error) })
        }
      }
      const smsSubmit = async () => {
        if (sms === null) return
        const code = sms.code.trim()
        if (code === '') return
        setSms(current => current === null ? null : { ...current, verifying: true, error: '' })
        try {
          const value = await rpc('login.submitSms', { accountId: sms.accountId, provider: channel.id, code }, 90_000)
          if (value?.done === true) {
            setSms(null)
            setNotice(t('chan.login.smsDone'))
            onChanged()
            void loadAccounts()
            void loadCredits()
            void loadBalances(true)
          } else {
            setSms(current => current === null ? null : {
              ...current, verifying: false, error: value?.error ?? t('chan.login.failed').replace('{reason}', ''),
            })
          }
        } catch (error) {
          setSms(current => current === null ? null : { ...current, verifying: false, error: String(error?.message ?? error) })
        }
      }

      const accountAction = async (key, accountId, fn) => {
        setBusy(key); setNotice('')
        try { await fn() } catch (error) { onError(channel, error) } finally { setBusy('') }
      }

      const setAllModels = async disabled => {
        if (busy !== '' || modelBatchPending.current || !rpc || !models?.length) return
        modelBatchPending.current = true
        try {
          await accountAction(disabled ? 'models:hide' : 'models:show', '', async () => {
            await rpc('model.setAllDisabled', { provider: channel.id, disabled })
            await loadModels()
            onChanged()
          })
        } finally { modelBatchPending.current = false }
      }

      const removeAccount = async accountId => {
        const entry = (accounts ?? []).find(row => row.id === accountId)
        if (typeof window !== 'undefined' && typeof window.confirm === 'function'
          && !window.confirm(t('chan.confirm.delete').replace('{name}', entry?.nickname ?? accountId))) return
        await accountAction('del:' + accountId, accountId, async () => {
          await rpc('account.delete', { accountId })
          onChanged(); await loadAccounts(); void loadBalances(true)
        })
      }

      const claim = async () => {
        if (!creditCapability?.claim || busy !== '' || claimPending.current) return
        claimPending.current = true
        setBusy('claim'); setNotice('')
        try {
          const value = await rpc('credits.claimAll', { provider: channel.id }, 180_000)
          const summary = value?.summary ?? value
          const claimed = Number(summary?.claimed ?? 0)
          const credit = Number(summary?.totalCredit ?? 0)
          const failed = (value?.results ?? []).filter(row => row.outcome?.kind === 'failed')
          const successText = t('chan.claim.result').replace('{count}', String(claimed)).replace('{credit}', String(credit))
          const failureText = t('chan.claim.failed').replace('{reason}', failed.map(row => row.outcome.message).join('；'))
          setNotice(failed.length > 0 ? claimed > 0 ? `${successText}；${failureText}` : failureText
            : claimed > 0 ? successText : t('chan.claim.none'))
          void loadCredits(); void loadBalances(true)
        } catch (error) { onError(channel, error) } finally { claimPending.current = false; setBusy('') }
      }

      const creditFor = accountId => (credits ?? []).find(row => row.accountId === accountId)?.status ?? null
      const [expanded, setExpanded] = useState(false)

      const card = h('article', {
        className: `ofm_chan ${compact ? 'compact' : 'ofm_glass'}${status?.closed === true ? ' off' : ''}`,
        'data-state': chanState,
        'data-channel': channel.id,
        style: { '--chan-accent': channel.accent },
      },
        h('div', { className: 'ofm_chanhead' },
          h('span', { className: 'ofm_chanlogo', 'aria-hidden': 'true' },
            CHANNEL_ICONS[channel.id] !== undefined
              ? h('img', { src: CHANNEL_ICONS[channel.id], alt: '' })
              : channel.name.slice(0, 2).toUpperCase()),
          h('span', { className: 'ofm_chanid' },
            h('b', null, channel.name),
            h('span', null, channel.org)),
          h('span', { className: 'ofm_chanstate' },
            h('span', { className: `ofm_dot ${connected ? 'ok' : status?.closed === true ? 'err' : ''}` }),
            stateText)),
        h('p', { className: 'ofm_note' }, channel.note),
        h('div', { className: 'ofm_chanmeta' },
          h('span', null, `${t('chan.meta.accounts')} `, h('b', null, `${enabledCount}/${accountsCount}`)),
          h('span', null, `${t('chan.meta.models')} `, h('b', null, modelsTotal === 0 ? '—' : `${modelsTotal - modelsOff}/${modelsTotal}`)),
          creditCapability ? h('span', { className: 'ofm_credittotal' },
            `${balanceLabel} `,
            h('b', null, balanceLoading ? '…' : balancesKnown
              ? creditCapability.quota ? t('chan.credits.loaded').replace('{count}', String((balances ?? []).filter(row => Number.isFinite(row.balance?.total)).length)) : kilo(balancesTotal)
              : balances === undefined ? '…' : '—')) : null),
        compact ? h('div', { className: 'ofm_directoryactions' },
          h('span', { className: 'ofm_id' }, channel.id),
          h('button', {
            type: 'button', className: `ofm_btn ${accountsCount > 0 || expanded ? 'ghost' : 'primary'}`,
            disabled: !rpc || busy !== '', 'aria-expanded': expanded,
            'aria-controls': `ofm-channel-${channel.id}`,
            onClick: () => {
              if (expanded) { setExpanded(false); return }
              setExpanded(true)
              if (accountsCount > 0) { if (open !== 'accounts') void toggle('accounts') }
              else void startLogin()
            },
          }, expanded ? t('chan.collapse') : accountsCount > 0 ? t('chan.manage') : t('chan.connect'))) : null,
        !compact || expanded ? h('div', {
          className: compact ? 'ofm_directorydetail' : undefined, id: `ofm-channel-${channel.id}`,
        },
        h('div', { className: 'ofm_chanacts' },
          channel.id === 'zcode' ? h('div', { className: 'ofm_seg', role: 'group', 'aria-label': t('chan.zcode.provider') },
            h('button', {
              type: 'button', disabled: busy !== '' || !rpc,
              'aria-pressed': zcodeProvider === 'bigmodel',
              onClick: () => chooseZcodeProvider('bigmodel'),
            }, t('chan.zcode.bigmodel')),
            h('button', {
              type: 'button', disabled: busy !== '' || !rpc,
              'aria-pressed': zcodeProvider === 'zai',
              onClick: () => chooseZcodeProvider('zai'),
            }, t('chan.zcode.zai'))) : null,
          h('button', { type: 'button', className: 'ofm_btn', disabled: busy !== '' || !rpc, 'aria-busy': busy === 'add' ? 'true' : undefined, onClick: startLogin }, busy === 'add' ? '…' : t('chan.act.add')),
          accountsCount > 0 ? h('button', {
            type: 'button', className: 'ofm_btn ghost', disabled: busy !== '' || !rpc, 'aria-busy': busy === 'refreshAll' ? 'true' : undefined,
            onClick: () => accountAction('refreshAll', '', async () => {
              for (const row of accounts ?? await rpc('account.list', { provider: channel.id }).then(v => v?.accounts ?? [])) {
                try { await rpc('account.refresh', { accountId: row.id }, 90_000) } catch (error) { onError(channel, error) }
              }
              onChanged(); await loadAccounts(); void loadBalances(true)
            }),
          }, busy === 'refreshAll' ? '…' : t('chan.act.refresh')) : null,
          creditCapability ? h('button', {
            type: 'button', className: 'ofm_btn ghost', disabled: balanceLoading || busy !== '' || !rpc,
            'aria-busy': balanceLoading ? 'true' : undefined, onClick: () => void loadBalances(true),
          }, balanceLoading ? t('chan.credits.loading') : t('chan.credits.refresh')) : null,
          creditCapability?.claim ? h('button', {
            type: 'button', className: 'ofm_btn ghost', disabled: busy !== '' || !rpc, 'aria-busy': busy === 'claim' ? 'true' : undefined,
            onClick: claim,
          }, busy === 'claim' ? '…' : t('chan.act.claim')) : null,
          h('button', { type: 'button', className: 'ofm_foldtoggle', disabled: !rpc, 'data-open': open === 'accounts' ? 'true' : 'false', onClick: () => void toggle('accounts') },
            h('svg', { viewBox: '0 0 12 12', 'aria-hidden': 'true' }, h('path', { d: 'M3 1.5l6 4.5-6 4.5z' })),
            t('chan.fold.accounts'), accounts === undefined ? null : ` (${accounts.length})`),
          h('button', { type: 'button', className: 'ofm_foldtoggle', disabled: !rpc, 'data-open': open === 'models' ? 'true' : 'false', onClick: () => void toggle('models') },
            h('svg', { viewBox: '0 0 12 12', 'aria-hidden': 'true' }, h('path', { d: 'M3 1.5l6 4.5-6 4.5z' })),
            t('chan.fold.models'), models === undefined ? null : ` (${models.length})`)),
        notice !== '' ? h('p', { className: 'ofm_note' }, notice) : null,
        balanceError !== '' ? h('p', { className: 'ofm_balanceerror', role: 'alert' },
          t('chan.credits.failed').replace('{reason}', balanceError))
          : balanceFailures > 0 ? h('p', { className: 'ofm_balanceerror', role: 'status' },
            t('chan.credits.partial').replace('{count}', String(balanceFailures))) : null,
        open === 'accounts' ? h('div', { className: 'ofm_chanfold' },
          accounts === undefined ? h('div', { className: 'ofm_skel', style: { minHeight: 44 } })
            : accounts.length === 0 ? h('p', { className: 'ofm_note' }, t('chan.noAccount'))
              : h('div', { className: 'ofm_acctlist' }, accounts.map(row => {
                const credit = creditFor(row.id)
                const pending = row.refreshable !== true && !Number.isFinite(row.expiresAt)
                return h('div', { className: 'ofm_acct' + (pending ? ' pending' : ''), key: row.id },
                  h('span', { className: 'ofm_acctname', title: row.nickname ?? row.id }, row.nickname ?? row.id),
                  h('span', { className: 'ofm_acctmeta' }, row.enabled === false ? t('chan.disabled') : t('chan.enabled'), ' · ', expiryText(row, t)),
                  credit?.todayCheckedIn === true && Number.isFinite(credit.todayCredit) ? h('span', { className: 'ofm_creditbadge' },
                    t('chan.credit.today').replace('{credit}', String(credit.todayCredit))) : null,
                  (() => {
                    const balance = balanceOf(row.id)
                    if (!creditCapability) return null
                    if (balanceLoading) return h('span', { className: 'ofm_note' }, t('chan.credits.loading'))
                    const result = (balances ?? []).find(entry => entry.accountId === row.id)
                    if (balance === null || !Number.isFinite(balance.total)) return h('span', { className: 'ofm_balanceerror' },
                      balanceError ? t('chan.credits.failed').replace('{reason}', balanceError)
                        : result?.error || t('chan.credits.unavailable'))
                    const reading = creditCapability.quota
                      ? (balance.packages ?? []).map(pkg => `${pkg.name} ${pkg.remaining}%`).join(' · ') || '—'
                      : kilo(balance.total)
                    return h('span', { className: 'ofm_creditbadge strong', title: balanceLabel },
                      `${balanceLabel} ${reading}`)
                  })(),
                  h('span', { className: 'ofm_acctacts' },
                    h('button', {
                      type: 'button', className: 'ofm_minibtn', disabled: busy !== '' || !rpc,
                      onClick: () => accountAction('test:' + row.id, row.id, async () => {
                        const value = await rpc('account.test', { accountId: row.id }, 90_000)
                        // The RPC envelope is `ok: true` here even when the probe
                        // failed — `account.test` reports the outcome *inside*
                        // `value`, so a failed probe lands on this branch with its
                        // reason in `value.message`. Reading `value.error` (which
                        // the server never sets) printed an empty reason: the
                        // user saw "测试失败：" and nothing else (#681).
                        setNotice(value?.ok === false
                          ? t('chan.test.failed').replace('{reason}', value?.error ?? value?.message ?? '')
                          : t('chan.test.ok').replace('{ms}', String(value?.ms ?? value?.latencyMs ?? '—')))
                      }),
                    }, t('chan.act.test')),
                    h('button', {
                      type: 'button', className: 'ofm_minibtn', disabled: busy !== '' || !rpc,
                      onClick: () => accountAction('refresh:' + row.id, row.id, async () => {
                        await rpc('account.refresh', { accountId: row.id }, 90_000)
                        onChanged(); await loadAccounts(); void loadBalances(true)
                      }),
                    }, t('chan.act.refresh')),
                    h('button', {
                      type: 'button', className: 'ofm_minibtn', disabled: busy !== '' || !rpc,
                      onClick: () => accountAction('toggle:' + row.id, row.id, async () => {
                        await rpc('account.update', { accountId: row.id, patch: { enabled: row.enabled === false } })
                        onChanged(); await loadAccounts()
                      }),
                    }, row.enabled === false ? t('chan.act.enable') : t('chan.act.disable')),
                    h('button', {
                      type: 'button', className: 'ofm_minibtn danger', disabled: busy !== '' || !rpc,
                      onClick: () => void removeAccount(row.id),
                    }, t('chan.act.delete'))))
              }))) : null,
        open === 'models' ? h('div', { className: 'ofm_chanfold' },
          models === undefined ? h('div', { className: 'ofm_skel', style: { minHeight: 44 } })
            : models.length === 0 ? h('p', { className: 'ofm_note' }, '—')
              : h(Fragment, null,
                h('div', { className: 'ofm_row' },
                  h('span', { className: 'ofm_note' }, t('chan.model.enabledCount')
                    .replace('{enabled}', String(models.filter(model => model.disabled !== true).length))
                    .replace('{total}', String(models.length))),
                  h('button', {
                    type: 'button', className: 'ofm_btn ghost', disabled: busy !== '' || !rpc,
                    title: t('chan.model.allScope'), 'aria-busy': busy === 'models:show' ? 'true' : undefined,
                    onClick: () => void setAllModels(false),
                  }, t('chan.model.enableAll')),
                  h('button', {
                    type: 'button', className: 'ofm_btn ghost', disabled: busy !== '' || !rpc,
                    title: t('chan.model.allScope'), 'aria-busy': busy === 'models:hide' ? 'true' : undefined,
                    onClick: () => void setAllModels(true),
                  }, t('chan.model.disableAll'))),
                h('div', { className: 'ofm_modellist' }, models.map(model => h('div', {
                className: 'ofm_modelrow' + (model.disabled === true ? ' off' : ''),
                key: model.id,
              },
                h('span', { className: 'ofm_id', title: model.id }, model.name ?? model.id),
                model.isFree === true ? h('span', { className: 'ofm_tagpill free' }, t('chan.model.free')) : null,
                model.dead === true ? h('span', { className: 'ofm_tagpill dead' }, t('chan.model.dead')) : null,
                model.disabled === true ? h('span', { className: 'ofm_tagpill' }, t('chan.model.hidden')) : null,
                h('button', {
                  type: 'button', className: 'ofm_minibtn', disabled: busy !== '' || !rpc,
                  onClick: () => accountAction('model:' + model.id, '', async () => {
                    if (model.dead === true) await rpc('model.clearDead', { provider: channel.id, modelId: model.id })
                    else await rpc('model.setDisabled', { provider: channel.id, modelId: model.id, disabled: model.disabled !== true })
                    await loadModels(); onChanged()
                  }),
                }, model.dead === true ? t('chan.model.restore') : model.disabled === true ? t('chan.model.on') : t('chan.model.off'))))))) : null) : null)

      // 短信登录表单（Loomy）：手机号 → 发送验证码 → 提交。短信模式没有可打开的
      // 页面，所以它替代扫码模态框，而不是与它并存。
      const smsModal = sms === null ? null : h('div', { className: 'ofm_scrim' },
        h('div', { className: 'ofm_modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('chan.login.title').replace('{name}', channel.name) },
          h('div', { className: 'ofm_modalhead' }, t('chan.login.title').replace('{name}', channel.name)),
          h('div', { className: 'ofm_modalbody ofm_loginbody' },
            h('p', { className: 'ofm_note' }, t('chan.login.smsHint')),
            h('div', { className: 'ofm_row' },
              h('input', {
                className: 'ofm_input', type: 'tel', inputMode: 'numeric', autoComplete: 'tel',
                'aria-label': t('chan.login.smsPhone'), placeholder: t('chan.login.smsPhone'),
                maxLength: 11, value: sms.phone,
                onChange: event => setSms(current => current === null ? null
                  : { ...current, phone: event.target.value.replace(/\D/g, '').slice(0, 11) }),
              }),
              h('button', {
                type: 'button', className: 'ofm_btn ghost',
                disabled: sms.sending || sms.phone.length !== 11,
                onClick: () => void smsSend(),
              }, sms.sending ? t('chan.login.smsSending') : sms.sent ? t('chan.login.smsResend') : t('chan.login.smsSend'))),
            h('div', { className: 'ofm_row' },
              h('input', {
                className: 'ofm_input', type: 'text', inputMode: 'numeric', autoComplete: 'one-time-code',
                'aria-label': t('chan.login.smsCode'), placeholder: t('chan.login.smsCode'),
                maxLength: 6, value: sms.code,
                onChange: event => setSms(current => current === null ? null
                  : { ...current, code: event.target.value.replace(/\D/g, '').slice(0, 6) }),
              }),
              h('button', {
                type: 'button', className: 'ofm_btn primary',
                disabled: sms.verifying || sms.code.length === 0,
                onClick: () => void smsSubmit(),
              }, sms.verifying ? t('chan.login.smsVerifying') : t('chan.login.smsSubmit'))),
            sms.sent ? h('p', { className: 'ofm_note ofm_scanline' }, t('chan.login.smsSent')) : null,
            sms.error === '' ? null : h('div', { className: 'ofm_callout ofm_error' }, h('div', null, sms.error))),
          h('div', { className: 'ofm_modalfoot' },
            h('button', { type: 'button', className: 'ofm_btn ghost', onClick: () => setSms(null) }, t('chan.login.cancel')))))

      const modal = login === null ? null : h('div', { className: 'ofm_scrim' },
        h('div', { className: 'ofm_modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('chan.login.title').replace('{name}', channel.name) },
          h('div', { className: 'ofm_modalhead' }, t('chan.login.title').replace('{name}', channel.name)),
          h('div', { className: 'ofm_modalbody ofm_loginbody' },
            h('div', { className: 'ofm_loginstep' }, h('b', null, '1'), h('span', null, t('chan.login.step1'))),
            h('div', { className: 'ofm_loginstep' }, h('b', null, '2'), h('span', null, t('chan.login.step2'))),
            login.url === '' ? null : h('code', { className: 'ofm_mono', style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }, login.url),
            h('p', { className: 'ofm_note ofm_scanline' }, t('chan.login.waiting'))),
          h('div', { className: 'ofm_modalfoot' },
            login.url === '' ? null : h('a', { className: 'ofm_btn primary', href: login.url, target: '_blank', rel: 'noreferrer noopener' }, t('chan.login.open')),
            h('button', { type: 'button', className: 'ofm_btn ghost', onClick: () => setLogin(null) }, t('chan.login.cancel')))))

      return h(Fragment, null, card, smsModal, modal)
    }

    function ChannelsPage(props) {
      const { t, ctx, summary } = props
      const { available, rpc } = useChannelRpc(ctx)
      const [query, setQuery] = useState('')
      const [filter, setFilter] = useState('')
      // The pack runs a daily auto check-in engine across the credit channels;
      // this page is where it is switched and watched (usage.autoCheckin).
      const [auto, setAuto] = useState(undefined)
      const loadAuto = useCallback(async () => {
        if (!available) return
        try { const value = await rpc('usage.autoCheckin', {}, 30_000); setAuto(value?.autoCheckin ?? null) } catch { setAuto(null) }
      }, [available, rpc])
      useEffect(() => { void loadAuto() }, [loadAuto])
      const toggleAuto = async () => {
        try { const value = await rpc('usage.autoCheckin', { enabled: auto?.enabled !== true }, 60_000); setAuto(value?.autoCheckin ?? null) } catch { /* the status refresh tells */ }
      }
      const [statuses, setStatuses] = useState(undefined)
      const [error, setError] = useState('')
      const pack = summary?.channels ?? { state: 'pending', error: '' }
      // The pack is what answers this page's RPC, so *the RPC answering* is the
      // readiness signal — the summary's `channels` bit can be a step behind:
      // it is read when the page mounts, while the pack's dynamic import may
      // still be in flight, and a page that trusted it would show an empty grid
      // for as long as that stale read lasted. The summary state is then only
      // the failure *reason* when the probes never come back.
      const [ready, setReady] = useState(pack.state === 'ready')

      const statusGeneration = useRef(0)
      const statusRetry = useRef(null)
      const statusRequest = useRef(0)
      const statusApplied = useRef(0)
      const loadStatus = useCallback(async (attempt = 0, generation = statusGeneration.current) => {
        if (attempt === 0) { clearTimeout(statusRetry.current); statusRetry.current = null }
        if (!available) return
        const request = ++statusRequest.current
        const transport = channelTransport(rpc)
        const current = () => generation === statusGeneration.current && request >= statusApplied.current
          && sameChannelTransport(transport, channelTransport(rpc))
        try {
          const value = await rpc('provider.status', { providers: CHANNEL_PROVIDERS.map(row => row.id) })
          if (!current()) return
          statusApplied.current = request
          setStatuses(value?.statuses ?? {})
          setReady(true)
          setError('')
        } catch (err) {
          if (!current()) return
          // The pack imports asynchronously on a cold start; retry a bounded
          // few times before believing the failure and surfacing the reason.
          if (attempt < 4) {
            clearTimeout(statusRetry.current)
            statusRetry.current = setTimeout(() => { if (current()) void loadStatus(attempt + 1, generation) }, 4000)
            return
          }
          setError(String(err?.message ?? err))
        }
      }, [available, rpc])

      useEffect(() => {
        void loadStatus()
        return () => { statusGeneration.current++; clearTimeout(statusRetry.current); statusRetry.current = null }
      }, [loadStatus])
      // A second poll loop, slow: the pack pushes nothing for accounts changed
      // in another window, and a stale count on this page is the kind of quiet
      // wrongness that reads as a bug. Local actions refresh immediately.
      useEffect(() => {
        if (!available) return undefined
        const timer = setInterval(() => { void loadStatus() }, 45_000)
        return () => clearInterval(timer)
      }, [available, loadStatus])

      const onChanged = useCallback(() => {
        void loadStatus()
        try { window.dispatchEvent(new CustomEvent('ofm:channels')) } catch { /* no window */ }
      }, [loadStatus])

      const onError = useCallback((channel, err) => {
        const reason = String(err?.message ?? err)
        showToast({ title: t('chan.error').replace('{reason}', reason).slice(0, 120), body: channel.name, tone: 'warn' })
      }, [t])

      const stateOf = channel => !available ? 'disconnected' : statuses?.[channel.id]?.closed === true ? 'closed'
        : (statuses?.[channel.id]?.accounts?.enabled ?? 0) > 0 ? 'connected' : 'disconnected'
      const connected = CHANNEL_PROVIDERS.filter(row => stateOf(row) === 'connected').length
      const needle = query.trim().toLowerCase()
      const rows = CHANNEL_PROVIDERS.filter(channel =>
        (filter === '' || (statuses !== undefined || !available) && stateOf(channel) === filter)
        && (needle === '' || `${channel.id} ${channel.name} ${channel.org}`.toLowerCase().includes(needle)))
      const failed = !ready && pack.state === 'failed'

      return h('div', { className: 'ofm_page' },
        h('header', { className: 'ofm_directoryhero' },
          h('div', { className: 'ofm_pagehead' },
            h('div', { className: 'ofm_pagetitle' },
              h('h2', null, t('chan.title')),
              h('p', { className: 'ofm_pagesub' }, t('chan.sub'))),
            h('div', { className: 'ofm_pills' },
              h(Pill, { strong: true, tone: ready ? 'ok' : failed ? 'err' : 'warn' },
                ready ? `${connected}/${CHANNEL_PROVIDERS.length} ${t('chan.state.on')}` : t('chan.state.off')),
              h(Pill, null, `${t('chan.meta.accounts')} ${statuses === undefined ? '—' : CHANNEL_PROVIDERS.reduce((sum, row) => sum + (statuses[row.id]?.accounts?.enabled ?? 0), 0)}`))),
          auto == null ? null : h('div', { className: 'ofm_row' },
            h(Switch, { checked: auto.enabled === true, label: t('chan.auto.title'), onChange: () => void toggleAuto() }),
            h(Pill, { tone: auto.running === true ? 'warn' : auto.ranToday === true ? 'ok' : '' },
              auto.running === true ? t('chan.auto.running') : auto.ranToday === true ? t('chan.auto.ran') : t('chan.auto.off')),
            typeof auto.lastResult === 'string' && auto.lastResult !== '' ? h('span', { className: 'ofm_note', title: auto.lastResult }, t('chan.auto.last').replace('{result}', auto.lastResult.length > 60 ? `${auto.lastResult.slice(0, 60)}…` : auto.lastResult)) : null)),
        failed ? h('div', { className: 'ofm_callout ofm_error' },
          h('div', null, t('chan.pack.failed').replace('{reason}', pack.error ?? ''), h('div', { className: 'ofm_note' }, t('chan.pack.hint')))) : null,
        !available ? h('div', { className: 'ofm_callout' }, h('div', null, t('chan.rpc.unavailable'))) : null,
        h('div', { className: 'ofm_directorytools' },
          h('label', null, t('chan.search'),
            h('input', {
              className: 'ofm_input', type: 'search', value: query, placeholder: t('chan.search'),
              onChange: event => setQuery(event.target.value),
            })),
          h('label', null, t('chan.filterStatus'),
            h('select', { className: 'ofm_input', 'aria-label': t('chan.filterStatus'), value: filter, onChange: event => setFilter(event.target.value) },
              h('option', { value: '' }, t('chan.filterAll')),
              h('option', { value: 'connected' }, t('chan.state.on')),
              h('option', { value: 'disconnected' }, t('chan.state.off')),
              h('option', { value: 'closed' }, t('chan.state.closed'))))),
        h('div', { className: 'ofm_directorycount', role: 'status' },
          t('chan.showing').replace('{shown}', String(rows.length)).replace('{total}', String(CHANNEL_PROVIDERS.length))),
        rows.length === 0 ? h('p', { className: 'ofm_note' }, t('chan.filterEmpty')) : null,
        h('div', { className: 'ofm_directory' }, rows.map(channel => h(ChannelCard, {
          key: channel.id,
          channel,
          status: available ? statuses?.[channel.id] : undefined,
          rpc: available && ready ? rpc : null,
          compact: true,
          pending: available && statuses === undefined && !failed && error === '',
          t,
          onError,
          onChanged,
        }))),
        error !== '' && !failed ? h('p', { className: 'ofm_note' }, `${t('chan.error').replace('{reason}', error)}`) : null)
    }

    // ── 数据看板 / 运行日志 / 网关设置 ────────────────────────────────────────
    // The absorbed pack keeps a per-request token ledger (channel → provider →
    // account → model trees, plus a ring of individual requests). These three
    // pages are its reading surface, modelled on the standalone gateway
    // consoles users already know: KPI cards, an account pivot, a model
    // performance table, a paginated request log and the gateway's switches.
    const LEDGER_EMPTY = () => ({ requests: 0, reportedRequests: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, reasoningTokens: 0, errors: 0 })

    /** Weighted merge of tree rows: averages are re-weighted by request count
     *  so a cross-day or cross-account merge never pretends a heavy day and a
     *  light day average to their mean. */
    function mergeLedgerRows(rows) {
      const out = LEDGER_EMPTY()
      let ttftSum = 0; let ttftN = 0; let tpsSum = 0; let tpsN = 0
      for (const row of rows) {
        out.requests += row.requests ?? 0
        out.reportedRequests += row.reportedRequests ?? 0
        out.inputTokens += row.inputTokens ?? 0
        out.outputTokens += row.outputTokens ?? 0
        out.cacheReadTokens += row.cacheReadTokens ?? 0
        out.cacheWriteTokens += row.cacheWriteTokens ?? 0
        out.reasoningTokens += row.reasoningTokens ?? 0
        out.errors += row.errors ?? 0
        if (Number.isFinite(row.avgTtftMs) && (row.requests ?? 0) > 0) { ttftSum += row.avgTtftMs * row.requests; ttftN += row.requests }
        if (Number.isFinite(row.avgTps) && (row.requests ?? 0) > 0) { tpsSum += row.avgTps * row.requests; tpsN += row.requests }
      }
      out.avgTtftMs = ttftN > 0 ? Math.round(ttftSum / ttftN) : null
      out.avgTps = tpsN > 0 ? Math.round((tpsSum / tpsN) * 10) / 10 : null
      return out
    }

    /** Flatten the channel→provider→account tree into account rows. */
    function ledgerAccountRows(channels) {
      const rows = []
      for (const ch of channels ?? []) {
        for (const provider of ch.providers ?? []) {
          for (const account of provider.accounts ?? []) {
            rows.push({ channel: ch.channel, provider: provider.provider, accountId: account.accountId, ...mergeLedgerRows([account.totals ?? {}]), models: account.models ?? [] })
          }
        }
      }
      return rows
    }

    /** Aggregate the same tree into per-model rows (across accounts). */
    function ledgerModelRows(channels) {
      const map = new Map()
      for (const ch of channels ?? []) {
        for (const provider of ch.providers ?? []) {
          for (const account of provider.accounts ?? []) {
            for (const model of account.models ?? []) {
              const key = model.model
              const row = map.get(key) ?? { model: key, providers: new Set(), rows: [] }
              row.providers.add(provider.provider)
              row.rows.push(model)
              map.set(key, row)
            }
          }
        }
      }
      return [...map.values()].map(row => ({ model: row.model, providers: [...row.providers], ...mergeLedgerRows(row.rows) }))
    }

    /** Flatten history days into one merged tree (the 全部历史 view). */
    function mergedHistoryChannels(days) {
      const map = new Map()
      for (const day of days ?? []) {
        for (const ch of day.channels ?? []) {
          const slot = map.get(ch.channel) ?? { channel: ch.channel, providers: [] }
          for (const provider of ch.providers ?? []) {
            let pslot = slot.providers.find(row => row.provider === provider.provider)
            if (pslot === undefined) { pslot = { provider: provider.provider, accounts: [] }; slot.providers.push(pslot) }
            for (const account of provider.accounts ?? []) {
              let aslot = pslot.accounts.find(row => row.accountId === account.accountId)
              if (aslot === undefined) { aslot = { accountId: account.accountId, models: [] }; pslot.accounts.push(aslot) }
              aslot.models.push(...(account.models ?? []))
            }
          }
          map.set(ch.channel, slot)
        }
      }
      // Re-aggregate the piled-up model lists into proper totals per account.
      for (const ch of map.values()) {
        for (const provider of ch.providers) {
          for (const account of provider.accounts) {
            const byModel = new Map()
            for (const model of account.models) {
              const row = byModel.get(model.model) ?? { model: model.model, rows: [] }
              row.rows.push(model); byModel.set(model.model, row)
            }
            account.models = [...byModel.values()].map(row => ({ model: row.model, ...mergeLedgerRows(row.rows) }))
            account.totals = mergeLedgerRows(account.models)
          }
        }
      }
      return [...map.values()]
    }

    function todayKey() {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    }

    const fmtInt = value => Number.isFinite(value) ? value.toLocaleString() : '—'
    const fmtPct = (part, whole) => whole > 0 ? `${Math.round(100 * part / whole)}%` : '—'
    const fmtMs = value => Number.isFinite(value) && value > 0 ? `${value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`}` : '—'
    const fmtTps = value => Number.isFinite(value) && value > 0 ? `${value.toFixed(1)} tok/s` : '—'

    function useLedger(props) {
      const { available, rpc } = useChannelRpc(props.ctx)
      const [state, setState] = useState({ status: 'loading', history: [], snapshot: null, error: '' })
      const load = useCallback(async () => {
        if (!available) { setState(current => ({ ...current, status: 'unavailable', error: 'no-connection' })); return }
        try {
          const [ledger, history] = await Promise.all([
            rpc('usage.tokenLedger', { limit: 400 }, 60_000),
            rpc('usage.tokenLedgerHistory', { sinceDays: 90 }, 60_000),
          ])
          setState({ status: 'ready', snapshot: ledger?.snapshot ?? null, history: history?.history ?? [], totals: history?.totals ?? null, error: '' })
        } catch (error) { setState(current => ({ ...current, status: 'error', error: String(error?.message ?? error) })) }
      }, [available, rpc])
      useEffect(() => { void load() }, [load])
      return { ...state, reload: load }
    }

    /** KPI cards: one reading per card, exactly like the gateway consoles. */
    function KpiCard(props) {
      const { label, value, sub, tone } = props
      return h('div', { className: `ofm_kpi ofm_glass${tone ? ` ${tone}` : ''}` },
        h('span', { className: 'ofm_kpilabel' }, label),
        h('b', { className: 'ofm_kpivalue' }, value),
        sub === undefined ? null : h('span', { className: 'ofm_kpisub' }, sub))
    }

    function LedgerPage(props) {
      const { t, ctx } = props
      const ledger = useLedger(props)
      const [scope, setScope] = useState('today')
      const loaded = ledger.status === 'ready'
      // 今日 = the pack's live snapshot (its in-memory day tree); 全部 = the
      // persisted day aggregation, merged back into one tree. The grand
      // cumulative number always reads the history total — even on 今日 —
      // because "累计" that resets at midnight is a lie.
      const channels = scope === 'today'
        ? (ledger.snapshot?.channels ?? [])
        : mergedHistoryChannels(ledger.history)
      const totals = scope === 'today'
        ? mergeLedgerRows([ledger.snapshot?.totals ?? {}])
        : mergeLedgerRows((ledger.history ?? []).map(day => day.totals ?? {}))
      const cumulative = ledger.totals ?? ledger.snapshot?.totals ?? {}
      const accounts = ledgerAccountRows(channels)
      const models = ledgerModelRows(channels).sort((a, b) => (b.inputTokens + b.outputTokens) - (a.inputTokens + a.outputTokens))
      // The pack's ring is already newest-first (`token-ledger.ts`: "最近明细
      // （最新在前）", built with `unshift`), so it is used as served. Reversing it
      // here put the oldest request at the top of the table — and, behind the log
      // page's pagination, the request the user just made on the last page.
      const entries = ledger.snapshot?.entries ?? []
      const tokenTotal = totals.inputTokens + totals.outputTokens
      const cacheBase = totals.inputTokens + totals.cacheReadTokens

      if (ledger.status === 'unavailable') {
        return h('div', { className: 'ofm_page' },
          h(PageHero, { title: t('dash.title'), sub: t('dash.sub') }),
          h('div', { className: 'ofm_callout' }, h('div', null, t('chan.rpc.unavailable'))))
      }
      return h('div', { className: 'ofm_page' },
        h(PageHero, { t, titleKey: 'dash.title', subKey: 'dash.sub' },
          h('div', { className: 'ofm_seg', role: 'tablist' },
            ['today', 'all'].map(key => h('button', {
              key, type: 'button', 'aria-pressed': scope === key ? 'true' : 'false',
              onClick: () => setScope(key),
            }, key === 'today' ? t('dash.today') : t('dash.all')))),
          h(Button, { onClick: () => void ledger.reload() }, t('dash.refresh'))),
        !loaded ? h('div', { className: 'ofm_chanwrap' }, [0, 1, 2].map(i => h('div', { className: 'ofm_skel', key: i, style: { minHeight: 120 } }))) : null,
        loaded ? h('div', { className: 'ofm_kpis' },
          h(KpiCard, { label: scope === 'today' ? t('dash.kpiToday') : t('dash.kpiScopeAll'), value: fmtInt(tokenTotal), sub: `${t('dash.input')} ${fmtInt(totals.inputTokens)} · ${t('dash.output')} ${fmtInt(totals.outputTokens)} · ${t('dash.reasoning')} ${fmtInt(totals.reasoningTokens)}` }),
          h(KpiCard, { label: t('dash.kpiCumulative'), value: fmtInt((cumulative.inputTokens ?? 0) + (cumulative.outputTokens ?? 0)), sub: `${t('dash.input')} ${fmtInt(cumulative.inputTokens)} · ${t('dash.output')} ${fmtInt(cumulative.outputTokens)} · ${t('dash.reasoning')} ${fmtInt(cumulative.reasoningTokens)}` }),
          h(KpiCard, { label: t('dash.kpiSpeed'), value: fmtTps(totals.avgTps), sub: `${t('dash.ttft')} ${fmtMs(totals.avgTtftMs)}` }),
          h(KpiCard, { label: t('dash.kpiCache'), value: fmtPct(totals.cacheReadTokens, cacheBase), sub: `${t('dash.cacheTokens')} ${fmtInt(totals.cacheReadTokens)}` }),
          h(KpiCard, { label: t('dash.kpiRequests'), value: fmtInt(totals.requests), sub: `${t('dash.successRate')} ${fmtPct(totals.requests - totals.errors, totals.requests)} · ${t('dash.failed')} ${fmtInt(totals.errors)}`, tone: totals.errors > 0 ? 'warn' : '' })) : null,
        loaded ? h(Section, { title: t('dash.recentTitle'), hint: t('dash.recentHint') },
          entries.length === 0 ? h('p', { className: 'ofm_note' }, t('dash.empty'))
            : h('div', { className: 'ofm_tablewrap' }, h('table', { className: 'ofm_table' },
                h('thead', null, h('tr', null,
                h('th', { key: 'time' }, t('log.time')),
                h('th', { key: 'chan' }, t('chan.titleSingle')),
                h('th', { key: 'model' }, t('log.model')),
                h('th', { key: 'account' }, t('log.account')),
                h('th', { key: 'via' }, t('log.via')),
                h('th', { key: 'result' }, t('log.result')),
                h('th', { key: 'duration' }, t('log.duration')),
                h('th', { key: 'ttft' }, t('log.ttft')),
                h('th', { key: 'speed' }, t('log.speed')),
                h('th', { key: 'input' }, t('log.input')),
                h('th', { key: 'output' }, t('log.output')),
                h('th', { key: 'reasoning' }, t('log.reasoning')),
                h('th', { key: 'cache' }, t('log.cache')),
                h('th', { key: 'total' }, t('log.total')))),
              h('tbody', null, entries.slice(0, 12).map((entry, index) => h('tr', { key: index },
                h('td', null, new Date(entry.ts).toLocaleString()),
                h('td', null, entry.provider),
                h('td', null, entry.model),
                h('td', null, entry.accountId || '—'),
                h('td', null, entry.channel === 'gateway' ? t('log.viaGateway') : t('log.viaDirect')),
                h('td', null, entry.error ? h('span', { className: 'ofm_badge unavailable', title: entry.error }, t('log.failed')) : h('span', { className: 'ofm_badge available' }, t('log.ok'))),
                h('td', { className: 'ofm_num' }, fmtMs(entry.durationMs)),
                h('td', { className: 'ofm_num' }, fmtMs(entry.ttftMs)),
                h('td', { className: 'ofm_num' }, fmtTps(entry.tps)),
                h('td', { className: 'ofm_num' }, fmtInt(entry.inputTokens)),
                h('td', { className: 'ofm_num' }, fmtInt(entry.outputTokens)),
                h('td', { className: 'ofm_num' }, Number.isFinite(entry.reasoningTokens) ? fmtInt(entry.reasoningTokens) : '—'),
                h('td', { className: 'ofm_num' }, Number.isFinite(entry.cacheReadTokens) ? fmtInt(entry.cacheReadTokens) : '—'),
                h('td', { className: 'ofm_num' }, h('b', null, fmtInt(entry.inputTokens + entry.outputTokens))))))))) : null,
        loaded ? h(Section, { title: t('dash.accountsTitle'), hint: t('dash.accountsHint') },
          accounts.length === 0 ? h('p', { className: 'ofm_note' }, t('dash.empty'))
            : h('div', { className: 'ofm_tablewrap' }, h('table', { className: 'ofm_table' },
              h('thead', null, h('tr', null,
                h('th', { key: 'account' }, t('log.account')),
                h('th', { key: 'chan' }, t('chan.titleSingle')),
                h('th', { key: 'requests' }, t('log.requests')),
                h('th', { key: 'total' }, t('log.total')),
                h('th', { key: 'input' }, t('log.input')),
                h('th', { key: 'output' }, t('log.output')),
                h('th', { key: 'reasoning' }, t('log.reasoning')),
                h('th', { key: 'cache' }, t('log.cache')),
                h('th', { key: 'mix' }, t('log.modelMix')))),
              h('tbody', null, accounts.sort((a, b) => b.requests - a.requests).map((row, index) => h('tr', { key: index },
                h('td', null, h('b', null, row.accountId || t('log.unattributed'))),
                h('td', null, row.provider),
                h('td', { className: 'ofm_num' }, fmtInt(row.requests)),
                h('td', { className: 'ofm_num' }, fmtInt(row.inputTokens + row.outputTokens)),
                h('td', { className: 'ofm_num' }, fmtInt(row.inputTokens)),
                h('td', { className: 'ofm_num' }, fmtInt(row.outputTokens)),
                h('td', { className: 'ofm_num' }, fmtInt(row.reasoningTokens)),
                h('td', { className: 'ofm_num' }, fmtInt(row.cacheReadTokens)),
                h('td', null, (row.models ?? []).slice().sort((a, b) => ((b.inputTokens ?? 0) + (b.outputTokens ?? 0)) - ((a.inputTokens ?? 0) + (a.outputTokens ?? 0))).slice(0, 2).map(model => `${model.model} · ${fmtInt((model.inputTokens ?? 0) + (model.outputTokens ?? 0))}`).join('，') || '—'))))))) : null,
        loaded ? h(Section, { title: t('dash.modelsTitle'), hint: t('dash.modelsHint') },
          models.length === 0 ? h('p', { className: 'ofm_note' }, t('dash.empty'))
            : h('div', { className: 'ofm_tablewrap' }, h('table', { className: 'ofm_table' },
              h('thead', null, h('tr', null,
                h('th', { key: 'model' }, t('log.model')),
                h('th', { key: 'chan' }, t('chan.titleSingle')),
                h('th', { key: 'requests' }, t('log.requests')),
                h('th', { key: 'failed' }, t('log.failed')),
                h('th', { key: 'total' }, t('log.total')),
                h('th', { key: 'slash' }, t('log.inputSlash')),
                h('th', { key: 'ttft' }, t('log.ttft')),
                h('th', { key: 'speed' }, t('log.speed')),
                h('th', { key: 'hit' }, t('log.cacheHit')),
                h('th', { key: 'share' }, t('log.share')))),
              h('tbody', null, models.map(row => h('tr', { key: row.model },
                h('td', null, h('b', null, row.model)),
                h('td', null, row.providers.join('，')),
                h('td', { className: 'ofm_num' }, fmtInt(row.requests)),
                h('td', { className: 'ofm_num' }, row.errors > 0 ? h('span', { className: 'ofm_badge unavailable' }, fmtInt(row.errors)) : fmtInt(0)),
                h('td', { className: 'ofm_num' }, fmtInt(row.inputTokens + row.outputTokens)),
                h('td', { className: 'ofm_num' }, `${fmtInt(row.inputTokens)} / ${fmtInt(row.outputTokens)} / ${fmtInt(row.reasoningTokens)}`),
                h('td', { className: 'ofm_num' }, fmtMs(row.avgTtftMs)),
                h('td', { className: 'ofm_num' }, fmtTps(row.avgTps)),
                h('td', { className: 'ofm_num' }, fmtPct(row.cacheReadTokens, row.inputTokens + row.cacheReadTokens)),
                h('td', { className: 'ofm_num' }, `${fmtPct(row.inputTokens + row.outputTokens, tokenTotal)}`))))))) : null)
    }

    /** The log page: the same request ring, at full width and full detail. */
    function LogsPage(props) {
      const { t, ctx } = props
      const ledger = useLedger(props)
      const [pageSize, setPageSize] = useState(20)
      const [auto, setAuto] = useState(false)
      const reload = ledger.reload
      useEffect(() => {
        if (auto !== true) return undefined
        const timer = setInterval(() => { void reload() }, 10_000)
        return () => clearInterval(timer)
      }, [auto, reload])
      // Newest first, as the pack serves it — see the note in LedgerPage.
      const entries = ledger.snapshot?.entries ?? []
      const pages = Math.max(1, Math.ceil(entries.length / pageSize))
      const [page, setPage] = useState(1)
      const safePage = Math.min(page, pages)
      const rows = entries.slice((safePage - 1) * pageSize, safePage * pageSize)
      return h('div', { className: 'ofm_page' },
        h(PageHero, { title: t('logs.title'), sub: t('logs.sub') },
          h('div', { className: 'ofm_seg' }, [10, 20, 50, 100].map(size => h('button', {
            key: size, type: 'button', 'aria-pressed': pageSize === size ? 'true' : 'false',
            onClick: () => { setPageSize(size); setPage(1) },
          }, String(size)))),
          h(Switch, { checked: auto, label: t('logs.auto'), onChange: () => setAuto(value => !value) }),
          h(Button, { onClick: () => void reload() }, t('dash.refresh'))),
        ledger.status === 'unavailable' ? h('div', { className: 'ofm_callout' }, h('div', null, t('chan.rpc.unavailable'))) : null,
        ledger.status === 'loading' ? h('div', { className: 'ofm_skel', style: { minHeight: 200 } }) : null,
        ledger.status === 'ready' ? h(Section, {
          title: t('logs.title'),
          hint: t('logs.count').replace('{shown}', String(rows.length)).replace('{total}', String(entries.length)),
        },
          entries.length === 0 ? h('p', { className: 'ofm_note' }, t('logs.empty'))
            : h('div', { className: 'ofm_tablewrap' }, h('table', { className: 'ofm_table' },
              h('thead', null, h('tr', null,
                h('th', { key: 'time' }, t('log.time')),
                h('th', { key: 'chan' }, t('chan.titleSingle')),
                h('th', { key: 'model' }, t('log.model')),
                h('th', { key: 'account' }, t('log.account')),
                h('th', { key: 'via' }, t('log.via')),
                h('th', { key: 'result' }, t('log.result')),
                h('th', { key: 'duration' }, t('log.duration')),
                h('th', { key: 'ttft' }, t('log.ttft')),
                h('th', { key: 'speed' }, t('log.speed')),
                h('th', { key: 'input' }, t('log.input')),
                h('th', { key: 'output' }, t('log.output')),
                h('th', { key: 'reasoning' }, t('log.reasoning')),
                h('th', { key: 'cache' }, t('log.cache')),
                h('th', { key: 'total' }, t('log.total')))),
              h('tbody', null, rows.map((entry, index) => h('tr', { key: index, className: entry.error ? 'ofm_logfailed' : '' },
                h('td', null, new Date(entry.ts).toLocaleString()),
                h('td', null, entry.provider),
                h('td', null, entry.model),
                h('td', null, entry.accountId || '—'),
                h('td', null, entry.channel === 'gateway' ? t('log.viaGateway') : t('log.viaDirect')),
                h('td', null, entry.error ? h('span', { className: 'ofm_badge unavailable', title: entry.error }, t('log.failed')) : h('span', { className: 'ofm_badge available' }, t('log.ok'))),
                h('td', { className: 'ofm_num' }, fmtMs(entry.durationMs)),
                h('td', { className: 'ofm_num' }, fmtMs(entry.ttftMs)),
                h('td', { className: 'ofm_num' }, fmtTps(entry.tps)),
                h('td', { className: 'ofm_num' }, fmtInt(entry.inputTokens)),
                h('td', { className: 'ofm_num' }, fmtInt(entry.outputTokens)),
                h('td', { className: 'ofm_num' }, Number.isFinite(entry.reasoningTokens) ? fmtInt(entry.reasoningTokens) : '—'),
                h('td', { className: 'ofm_num' }, Number.isFinite(entry.cacheReadTokens) ? fmtInt(entry.cacheReadTokens) : '—'),
                h('td', { className: 'ofm_num' }, h('b', null, fmtInt(entry.inputTokens + entry.outputTokens)))))))),
          pages > 1 ? h('div', { className: 'ofm_row' },
            h(Button, { kind: 'ghost', disabled: safePage <= 1, onClick: () => setPage(value => Math.max(1, value - 1)) }, '‹'),
            h('span', { className: 'ofm_note' }, t('logs.page').replace('{page}', String(safePage)).replace('{pages}', String(pages))),
            h(Button, { kind: 'ghost', disabled: safePage >= pages, onClick: () => setPage(value => Math.min(pages, value + 1)) }, '›')) : null,
          h('p', { className: 'ofm_note' }, t('logs.windowNote'))) : null)
    }

    /** Shared page hero for the three gateway-console pages. The caller
     *  renders the copy: literal t() calls stay visible to the copy lint. */
    function PageHero(props) {
      const { title, sub, children } = props
      return h('header', { className: 'ofm_hero ofm_glass' },
        h('div', { className: 'ofm_pagehead' },
          h('div', { className: 'ofm_pagetitle' },
            h('h2', null, title),
            h('p', { className: 'ofm_pagesub' }, sub)),
          children))
    }

    // ── 省 Token / 订阅 ────────────────────────────────────────────────────────
    /**
     * One panel fetch per page, plus the merge for what a write answers with.
     *
     * `useAsync` above re-reads the whole payload after a write. These three
     * pages must not do that: every control's POST already answers with the state
     * the host stored, and a re-read would either double the round trips or open a
     * window where a switch shows what was *clicked* rather than what was saved.
     * So the payload lives here and the caller merges the POST answer in through
     * `patch`. The shimmer is for the first answer only — a reload after a write
     * keeps the current panel on screen instead of collapsing it back.
     */
    function usePanel(loader, deps) {
      const [state, setState] = useState({ status: 'loading', data: undefined, error: '' })
      const run = useCallback(() => {
        let alive = true
        setState(current => ({ status: current.data === undefined ? 'loading' : 'ready', data: current.data, error: '' }))
        loader()
          .then(data => { if (alive) setState({ status: 'ready', data, error: '' }) })
          .catch(error => {
            if (!alive) return
            setState(current => current.data === undefined
              ? { status: 'error', data: undefined, error: String(error?.message ?? error) }
              : { status: 'ready', data: current.data, error: String(error?.message ?? error) })
          })
        return () => { alive = false }
      }, deps)
      useEffect(() => run(), [run])
      const patch = useCallback(update => setState(current => current.data === undefined
        ? current
        : { ...current, data: typeof update === 'function' ? update(current.data) : { ...current.data, ...update } }), [])
      return { ...state, reload: run, patch }
    }

    /** First-fetch placeholder: three shimmering cards, not one grey line. */
    function PanelSkeleton() {
      return h('div', { className: 'ofm_grid', 'aria-hidden': 'true' },
        h('div', { className: 'ofm_skel' }), h('div', { className: 'ofm_skel' }), h('div', { className: 'ofm_skel' }))
    }

    /**
     * A load failure that names what failed and offers the retry.
     *
     * The older pages render nothing at all when a route refuses, which reads as
     * "this plugin has no such feature". Each of the three new pages passes its
     * own title, because "cannot read the provider registry" and "cannot read the
     * chain settings" are different sentences to act on.
     */
    function PanelError(props) {
      const { t, title, message, onRetry } = props
      return h('div', { className: 'ofm_callout ofm_error ofm_rise' },
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('b', null, title),
          h('div', null, message)),
        h(Button, { kind: 'ghost', onClick: onRetry }, t('retry')))
    }

    /** Copy-to-clipboard that answers the click, so a copy is never silent. */
    function CopyButton(props) {
      const { t, text } = props
      const [done, setDone] = useState(false)
      useEffect(() => {
        if (!done) return
        const timer = setTimeout(() => setDone(false), 1400)
        return () => clearTimeout(timer)
      }, [done])
      return h(Button, {
        kind: 'ghost',
        onClick: () => copy(text, ok => { if (ok) setDone(true) }),
      }, done ? t('eac.copied') : t('eac.copy'))
    }

    /** A switch with its one-line explanation underneath. */
    function SubscriptionImport(props) {
      const { t, localProvider, busy, onImport, onCancel } = props
      const [provider, setProvider] = useState(localProvider ?? 'codex')
      const [label, setLabel] = useState('')
      const [modelText, setModelText] = useState('')
      const [mode, setMode] = useState('paste')
      const [json, setJson] = useState('')
      const [apiKey, setApiKey] = useState('')
      const [baseUrl, setBaseUrl] = useState('')
      const [format, setFormat] = useState('openai-chat')
      const [error, setError] = useState('')
      const [reading, setReading] = useState(false)
      const fileRef = useRef(null)
      const readEpoch = useRef(0)
      useEffect(() => () => { readEpoch.current++ }, [])
      const clearCredentials = () => {
        readEpoch.current++
        setJson(''); setApiKey(''); setError(''); setReading(false)
        if (fileRef.current) fileRef.current.value = ''
      }
      const readFile = async event => {
        const file = event.target.files?.[0]
        const epoch = ++readEpoch.current
        setError(''); setJson(''); setReading(false)
        if (!file) return
        if (file.size > 1024 * 1024) { setError(t('sub.fileTooLarge')); return }
        setReading(true)
        try {
          const contents = await file.text()
          if (epoch === readEpoch.current) setJson(contents)
        } catch {
          if (epoch === readEpoch.current) setError(t('sub.fileFailed'))
        } finally {
          if (epoch === readEpoch.current) setReading(false)
        }
      }
      const submit = async event => {
        event.preventDefault()
        if (busy || reading) return
        setError('')
        const models = [...new Set(parseModelIds(modelText))]
        if (models.length === 0 || models.length > 200 || models.some(id =>
          id.length > 240 || !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/.test(id) || id.startsWith('subscription:'))) {
          setError(t('sub.invalidModels')); return
        }
        const body = { provider, models, ...(label.trim() ? { label: label.trim() } : {}) }
        if (!localProvider && provider === 'api') {
          if (!apiKey.trim()) { setError(t('sub.keyRequired')); return }
          let endpoint
          try { endpoint = new URL(baseUrl) } catch { setError(t('sub.invalidEndpoint')); return }
          if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
            setError(t('sub.invalidEndpoint')); return
          }
          body.credentials = { apiKey: apiKey.trim() }
          body.baseUrl = endpoint.href.replace(/\/$/, '')
          body.format = format
        } else if (!localProvider) {
          let credentials
          try { credentials = JSON.parse(json.replace(/^\uFEFF/, '')) } catch { setError(t('sub.invalidJson')); return }
          if (credentials === null || typeof credentials !== 'object' || Array.isArray(credentials)) {
            setError(t('sub.invalidJson')); return
          }
          body.credentials = credentials
        }
        if (await onImport(localProvider ? 'import-local' : 'import', body)) {
          clearCredentials()
          onCancel()
        }
      }
      const disabled = busy || reading
      return h('form', { className: 'ofm_subform', onSubmit: submit, 'aria-label': t('sub.add'), 'aria-busy': disabled },
        h('div', { className: 'ofm_duo' },
          h('label', null, t('sub.provider'),
            h('select', {
              className: 'ofm_input', 'aria-label': t('sub.provider'), value: provider, disabled: disabled || !!localProvider,
              onChange: event => { clearCredentials(); setProvider(event.target.value) },
            }, Object.entries(SUBSCRIPTION_PROVIDERS).map(([id, name]) => h('option', { key: id, value: id }, name)))),
          h('label', null, t('sub.label'),
            h('input', { className: 'ofm_input', value: label, maxLength: 120, disabled,
              onChange: event => setLabel(event.target.value), autoComplete: 'off' }))),
        h('label', null, t('sub.models'),
          h('textarea', { className: 'ofm_input', value: modelText, rows: 3, disabled, spellCheck: false,
            onChange: event => setModelText(event.target.value) })),
        localProvider ? null : provider === 'api'
          ? h(Fragment, null,
            h('div', { className: 'ofm_duo' },
              h('label', null, t('sub.baseUrl'),
                h('input', { className: 'ofm_input', value: baseUrl, disabled, inputMode: 'url', autoComplete: 'off',
                  onChange: event => setBaseUrl(event.target.value) })),
              h('label', null, t('sub.format'),
                h('select', { className: 'ofm_input', 'aria-label': t('sub.format'), value: format, disabled, onChange: event => setFormat(event.target.value) },
                  ['openai-chat', 'openai-responses', 'anthropic-messages'].map(id => h('option', { key: id, value: id }, id))))),
            h('label', null, t('sub.key'),
              h('input', { className: 'ofm_input', type: 'password', value: apiKey, disabled, autoComplete: 'new-password',
                spellCheck: false, onChange: event => setApiKey(event.target.value) })))
          : h(Fragment, null,
            h('div', { className: 'ofm_seg', role: 'group', 'aria-label': t('sub.credentials') },
              h('button', { type: 'button', disabled, 'aria-pressed': mode === 'paste',
                onClick: () => { clearCredentials(); setMode('paste') } }, t('sub.paste')),
              h('button', { type: 'button', disabled, 'aria-pressed': mode === 'file',
                onClick: () => { clearCredentials(); setMode('file') } }, t('sub.upload'))),
            mode === 'paste'
              ? h('label', null, t('sub.credentials'),
                h('textarea', { className: 'ofm_input', value: json, rows: 5, disabled, autoComplete: 'off', spellCheck: false,
                  onChange: event => setJson(event.target.value) }))
              : h('label', null, t('sub.file'),
                h('input', { className: 'ofm_input', ref: fileRef, type: 'file', accept: '.json,application/json',
                  disabled: busy, onChange: readFile }))),
        error ? h('div', { className: 'ofm_callout ofm_error', role: 'alert' }, error) : null,
        h('div', { className: 'ofm_row' },
          h('button', { type: 'submit', className: 'ofm_btn primary', disabled }, disabled ? t('sub.working') : t('sub.import')),
          h(Button, { kind: 'ghost', disabled: busy, onClick: () => { clearCredentials(); onCancel() } }, t('sub.cancel'))))
    }

    function SubscriptionWindow({ t, window, fallback }) {
      const numeric = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
      const used = numeric(window?.usedPercent) ? window.usedPercent : null
      const remaining = numeric(window?.remainingPercent) ? window.remainingPercent : null
      const id = window?.id ?? window?.name ?? ''
      const label = fallback ?? (window?.kind === 'five_hour' || id === 'five_hour' ? t('sub.fiveHour')
        : window?.kind === 'weekly' || id === 'weekly' || id.startsWith('seven_day')
          ? t('sub.weekly') + (id.startsWith('seven_day_') ? ` · ${id.slice(10)}` : '')
          : window?.model ?? window?.name ?? id)
      const reset = typeof window?.resetsAt === 'string' ? Date.parse(window.resetsAt) : NaN
      return h('div', { className: 'ofm_subwindow' },
        h('span', null, label),
        h('strong', null, used !== null ? t('sub.used').replace('{n}', String(Math.round(used * 10) / 10))
          : remaining !== null ? t('sub.remaining').replace('{n}', String(Math.round(remaining * 10) / 10)) : t('sub.unknown')),
        used === null && remaining === null ? null : h('progress', {
          max: 100, value: used ?? 100 - remaining, 'aria-label': label,
        }),
        Number.isFinite(reset) ? h('span', { className: 'ofm_note' }, `${t('sub.resets')} `,
          h('time', { dateTime: window.resetsAt }, new Date(reset).toLocaleString(t.locale === 'zh' ? 'zh-CN' : 'en-US'))) : null)
    }

    function SubscriptionAccount({ t, account, busy, mutate }) {
      const [confirm, setConfirm] = useState(false)
      const quota = account.quota ?? {}
      const windows = Array.isArray(quota.windows) ? quota.windows : []
      const fiveHour = quota.fiveHour ?? windows.find(row => row.kind === 'five_hour' || row.id === 'five_hour' || row.name === 'five_hour')
      const weekly = quota.weekly ?? windows.find(row => row.id === 'seven_day' || row.id === 'weekly'
        || row.name === 'seven_day' || row.name === 'weekly')
      const sameWindow = (row, other) => other && (row === other || (row.id ?? row.name) === (other.id ?? other.name))
      const extra = windows.filter(row => row !== fiveHour && row !== weekly
        && !sameWindow(row, fiveHour) && !sameWindow(row, weekly))
      const checked = typeof quota.checkedAt === 'string' ? Date.parse(quota.checkedAt) : NaN
      const modelIds = (Array.isArray(account.models) ? account.models : []).map(model => typeof model === 'string' ? model : model.id)
      return h('article', { className: 'ofm_subaccount', 'data-subscription': account.id },
        h('div', { className: 'ofm_directoryactions' },
          h('div', null,
            h('h3', null, account.label ?? SUBSCRIPTION_PROVIDERS[account.provider]),
            h('span', { className: 'ofm_note' }, SUBSCRIPTION_PROVIDERS[account.provider] ?? account.provider)),
          h(Switch, { checked: account.enabled !== false, label: t('sub.enabled'), disabled: !!busy,
            onChange: () => mutate('enabled', { id: account.id, enabled: account.enabled === false }) })),
        h('div', { className: 'ofm_submeta' },
          h('span', null, `${t('sub.plan')}: ${quota.plan ?? t('sub.unknown')}`),
          h('span', null, `${t('sub.balance')}: `, quota.balance?.unlimited === true ? t('sub.unlimited')
            : typeof quota.balance?.amount === 'number' && Number.isFinite(quota.balance.amount)
              ? `${quota.balance.amount} ${quota.balance.unit === 'credits' ? t('sub.credits') : quota.balance.unit ?? ''}`
              : t('sub.unknown')),
          Number.isFinite(checked) ? h('span', null, `${t('sub.checked')}: `,
            h('time', { dateTime: quota.checkedAt }, new Date(checked).toLocaleString(t.locale === 'zh' ? 'zh-CN' : 'en-US'))) : null),
        quota.status === 'error' ? h('div', { className: 'ofm_callout ofm_error', role: 'alert' },
          h('b', null, t('sub.quotaFailed')), quota.error?.message ? h('span', null, quota.error.message) : null) : null,
        h('div', { className: 'ofm_subwindows' },
          h(SubscriptionWindow, { t, window: fiveHour, fallback: t('sub.fiveHour') }),
          h(SubscriptionWindow, { t, window: weekly, fallback: t('sub.weekly') }),
          extra.map((window, index) => h(SubscriptionWindow, { key: window.id ?? index, t, window }))),
        modelIds.length ? h('ul', { className: 'ofm_submodels', 'aria-label': t('sub.models') },
          modelIds.map(id => h('li', { key: id }, id))) : h('span', { className: 'ofm_note' }, t('sub.noModels')),
        h('div', { className: 'ofm_row' },
          h(Button, { disabled: !!busy, onClick: () => mutate('quota', { id: account.id }) },
            busy === `quota:${account.id}` ? t('sub.working') : t('sub.refreshQuota')),
          h(Button, { kind: 'ghost', disabled: !!busy, onClick: () => setConfirm(value => !value) }, confirm ? t('sub.cancel') : t('sub.remove'))),
        confirm ? h('div', { className: 'ofm_row' },
          h('span', null, t('sub.removeQuestion')),
          h(Button, { disabled: !!busy, onClick: () => mutate('remove', { id: account.id }) }, t('sub.confirmRemove'))) : null)
    }


    /** The segmented level picker the two prompt savers share. */
    const SAVER_LEVEL = t => ({
      off: t('saver.level.off'),
      lite: t('saver.level.lite'),
      full: t('saver.level.full'),
      ultra: t('saver.level.ultra'),
      'wenyan-lite': t('saver.level.wenyanLite'),
      wenyan: t('saver.level.wenyan'),
      'wenyan-ultra': t('saver.level.wenyanUltra'),
    })

    function LevelPicker(props) {
      const { t, levels, value, disabled, onChange } = props
      const labels = SAVER_LEVEL(t)
      return h('div', { className: 'ofm_seg', role: 'group' },
        levels.map(level => h('button', {
          key: level, type: 'button', disabled, 'aria-pressed': level === value ? 'true' : 'false',
          onClick: () => { if (!disabled && level !== value) onChange(level) },
        }, labels[level] ?? level)))
    }

    /** The savings bar: it grows into place once the first measurement lands, so
     *  the number reads as a measurement rather than as decoration. */
    function SavingsMeter(props) {
      const { t, percent } = props
      const [live, setLive] = useState(0)
      useEffect(() => {
        const timer = setTimeout(() => setLive(Math.max(0, Math.min(100, percent))), 60)
        return () => clearTimeout(timer)
      }, [percent])
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 } },
        h('div', { className: 'ofm_row' },
          h('span', { className: 'ofm_note' }, t('saver.percent')),
          h('b', { className: 'ofm_kpivalue', style: { fontSize: 20 } }, `${percent}%`)),
        h('div', {
          className: 'ofm_meter', role: 'progressbar',
          'aria-valuenow': percent, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': t('saver.percent'),
        }, h('i', { style: { width: `${live}%` } })))
    }

    /**
     * 省 Token: the three savers and what they have actually saved.
     *
     * Every control posts and then renders the host's own answer; nothing here
     * shows a switch state the settings file does not have. The dashboard reads
     * the measurement the host keeps, and says so explicitly when there is none —
     * an empty meter is not a claim that nothing was saved, it is the absence of a
     * measurement.
     */
    function SaverPage(props) {
      const { t } = props
      const panel = usePanel(() => Promise.all([api('/token-saver'), api('/local-optimize')])
        .then(([saver, local]) => ({ saver, local })), [])
      const [busy, setBusy] = useState('')
      const [error, setError] = useState('')
      const saver = panel.data?.saver
      const local = panel.data?.local
      const savings = saver?.savings ?? null

      const write = async (kind, action) => {
        setBusy(kind)
        setError('')
        try { await action() } catch (failure) {
          // The route refuses an unknown level with a 400 and a sentence naming
          // the legal ones; showing it is more useful than swallowing it.
          setError(String(failure?.message ?? failure))
          showToast({ title: t('saver.failed'), body: String(failure?.message ?? failure), tone: 'warn', holdMs: 6000 })
        } finally { setBusy('') }
      }
      const saveSaver = patch => write('saver', async () => {
        const answer = await post('/token-saver', patch)
        // The POST answer carries the stored switches; the measurement is the
        // host's own tally and is only served by the GET, so it is kept as-is.
        panel.patch(current => ({ ...current, saver: { ...answer.tokenSaver, savings: current.saver?.savings } }))
        showToast({ title: t('saver.saved'), body: t('saver.savedBody'), holdMs: 3200 })
      })
      const saveLocal = patch => write('local', async () => {
        const answer = await post('/local-optimize', patch)
        panel.patch(current => ({ ...current, local: answer.localOptimize }))
        showToast({ title: t('saver.saved'), body: t('saver.savedBody'), holdMs: 3200 })
      })

      return h('div', { className: 'ofm_page' },
        h(PageHero, { title: t('saver.title'), sub: t('saver.sub') },
          h('div', { className: 'ofm_pills' },
            h(Pill, { strong: true, tone: saver?.enabled === false ? 'warn' : 'ok' },
              saver?.enabled === false ? t('saver.disabled') : t('saver.enabled')))),
        panel.status === 'loading' ? h(PanelSkeleton) : null,
        panel.status === 'error'
          ? h(PanelError, { t, title: t('saver.loadFailed'), message: panel.error, onRetry: panel.reload })
          : null,
        error === '' ? null : h('div', { className: 'ofm_callout ofm_error ofm_rise' }, h('div', null, error)),
        panel.status === 'ready'
          ? h(Fragment, null,
            // The master switch governs all three savers, so it stands on its own
            // above them: inside the prompt-shaping section it read as that
            // section's switch, which is the one thing it is not.
            h('div', { className: 'ofm_panel ofm_rise' },
              h('div', { className: 'ofm_row' },
                h(Switch, {
                  checked: saver.enabled !== false, label: t('saver.master'), disabled: busy !== '',
                  onChange: () => { if (busy === '') saveSaver({ enabled: saver.enabled === false }) },
                }),
                h('span', { className: 'ofm_note' }, t('saver.masterHint')))),
            h(Section, { title: t('saver.dashTitle'), hint: t('saver.dashHint') },
              savings === null
                ? h('p', { className: 'ofm_note' }, t('saver.noData'))
                : h('div', { className: 'ofm_panel ofm_rise' },
                  h('div', { className: 'ofm_stats' },
                    stat(`${fmtInt(savings.bytesBefore)} B`, t('saver.bytesBefore')),
                    stat(`${fmtInt(savings.bytesAfter)} B`, t('saver.bytesAfter')),
                    stat(`${fmtInt(savings.saved)} B`, t('saver.bytesSaved')),
                    stat(String(savings.blocks), t('saver.blocks')),
                    stat(String(savings.calls), t('saver.calls')),
                    stat(String(savings.promptCalls), t('saver.promptCalls'))),
                  savings.bytesBefore > 0
                    ? h(SavingsMeter, { t, percent: savings.percent })
                    : h('p', { className: 'ofm_note' }, t('saver.noData')),
                  savings.summary === undefined || savings.summary === ''
                    ? null
                    : h('p', { className: 'ofm_note' }, `${t('saver.report')} · ${savings.summary}`))),
            h(Section, { title: t('saver.promptTitle'), hint: t('saver.promptHint') },
              h('div', { className: 'ofm_panel ofm_rise' },
                h('div', { className: 'ofm_duo' },
                  h('div', { className: 'ofm_field' },
                    h('span', null, t('saver.caveman')),
                    h(LevelPicker, {
                      t, levels: saver.cavemanLevels ?? [], value: saver.prompts?.caveman, disabled: busy !== '',
                      onChange: level => saveSaver({ prompts: { caveman: level } }),
                    }),
                    h('span', null, t('saver.cavemanWhat'))),
                  h('div', { className: 'ofm_field' },
                    h('span', null, t('saver.ponytail')),
                    h(LevelPicker, {
                      t, levels: saver.ponytailLevels ?? [], value: saver.prompts?.ponytail, disabled: busy !== '',
                      onChange: level => saveSaver({ prompts: { ponytail: level } }),
                    }),
                    h('span', null, t('saver.ponytailWhat')))),
                h('p', { className: 'ofm_note' }, t('saver.voiceWarn')))),
            h(Section, { title: t('saver.rtk'), hint: t('saver.rtkWhat') },
              h('div', { className: 'ofm_panel ofm_rise' },
                h('div', { className: 'ofm_row' },
                  h(Switch, {
                    checked: saver.rtk === true, label: t('saver.rtk'), disabled: busy !== '',
                    onChange: () => { if (busy === '') saveSaver({ rtk: saver.rtk !== true }) },
                  })),
                h('p', { className: 'ofm_note' }, t('saver.rtkSafety')))),
            h(Section, { title: t('saver.localTitle'), hint: t('saver.localHint') },
              h('div', { className: 'ofm_panel ofm_rise' },
                h('div', { className: 'ofm_row' },
                  h(Switch, {
                    checked: local.enabled !== false, label: t('saver.local.enabled'), disabled: busy !== '',
                    onChange: () => { if (busy === '') saveLocal({ enabled: local.enabled === false }) },
                  })),
                h('div', { className: 'ofm_duo' },
                  h('div', { className: 'ofm_field' },
                    h(Switch, {
                      checked: local.quota !== false, label: t('saver.local.quota'), disabled: busy !== '',
                      onChange: () => { if (busy === '') saveLocal({ quota: local.quota === false }) },
                    }),
                    h('span', null, t('saver.local.quotaHint'))),
                  h('div', { className: 'ofm_field' },
                    h(Switch, {
                      checked: local.prefix !== false, label: t('saver.local.prefix'), disabled: busy !== '',
                      onChange: () => { if (busy === '') saveLocal({ prefix: local.prefix === false }) },
                    }),
                    h('span', null, t('saver.local.prefixHint'))),
                  h('div', { className: 'ofm_field' },
                    h(Switch, {
                      checked: local.title !== false, label: t('saver.local.title'), disabled: busy !== '',
                      onChange: () => { if (busy === '') saveLocal({ title: local.title === false }) },
                    }),
                    h('span', null, t('saver.local.titleHint'))),
                  h('div', { className: 'ofm_field' },
                    h(Switch, {
                      checked: local.suggestion !== false, label: t('saver.local.suggestion'), disabled: busy !== '',
                      onChange: () => { if (busy === '') saveLocal({ suggestion: local.suggestion === false }) },
                    }),
                    h('span', null, t('saver.local.suggestionHint'))),
                  h('div', { className: 'ofm_field' },
                    h(Switch, {
                      checked: local.filepath !== false, label: t('saver.local.filepath'), disabled: busy !== '',
                      onChange: () => { if (busy === '') saveLocal({ filepath: local.filepath === false }) },
                    }),
                    h('span', null, t('saver.local.filepathHint')))))))
          : null)
    }

    /** The chain editor's member picker: searchable, and it shows the lane and
     *  the vision flag, because those are what decide a chain's order. */
    function SettingsPage(props) {
      const tagged = props.locale === undefined ? props.t : Object.assign(x => props.t(x), { locale: props.locale })
      const t = tagged
      const summary = useAsync(() => api('/summary'), [])

      if (summary.status === 'loading' && summary.data === undefined) return h('div', { className: 'ofm_root' }, h('p', { className: 'ofm_note' }, t('loading')))
      if (summary.status === 'error') {
        return h('div', { className: 'ofm_root' },
          h('div', { className: 'ofm_callout ofm_error' }, h('div', null, h('b', null, t('loadFailed')), h('div', null, summary.error))),
          h('div', null, h(Button, { onClick: () => summary.reload() }, t('retry'))))
      }
      return h(Shell, {
        t: tagged, summary, ctx: props.ctx,
      })
    }

    // ── the tabbed shell ──────────────────────────────────────────────────────
    // The settings section used to be one long scroll. It is now a set of pages
    // behind one glass navigation bar. The two free lanes the plugin used to own
    // — the anonymous/Kilo 免费模型 page and the GitHub-auth EAC 模型 page — are
    // gone; what is left all answers a question about the lanes the host still
    // routes: account channels, aggregation, the workspace, savings, routing,
    // the ledger, logs, the local gateway, upgrades and the starred picks.
    // The active page lives in localStorage so a reload — or the hot reload the
    // upgrader triggers — comes back to the page the user was reading. A saved id
    // of a page that no longer exists falls back to the channels page.
    const EFFECTS_KEY = 'ofm.visualEffects'
    const TAB_KEY = 'ofm.tab'


    function Shell(props) {
      const { t, summary, ctx } = props
      const [tab, setTab] = useState(() => {
        try {
          const saved = window.localStorage?.getItem(TAB_KEY)
          const pages = ['channels', 'subscriptions', 'saver', 'ledger', 'logs']
          if (saved === 'workspace') return 'subscriptions'
          return pages.includes(saved) ? saved : 'channels'
        } catch { return 'channels' }
      })
      const [effects, setEffects] = useState(() => {
        try { return window.localStorage?.getItem(EFFECTS_KEY) === 'on' } catch { return false }
      })
      const toggleEffects = () => setEffects(current => {
        const next = !current
        try { window.localStorage?.setItem(EFFECTS_KEY, next ? 'on' : 'off') } catch { /* 当前页面仍可切换 */ }
        return next
      })
      /* The disclaimer is not a gate on the lanes: it reads once on the first
         settings visit and is reopenable afterwards. `undefined` means the answer
         has not arrived yet, which is neither "show it" nor "hide it". */
      const [disclaimer, setDisclaimer] = useState(undefined)
      const [disclaimerOpen, setDisclaimerOpen] = useState(false)
      useEffect(() => {
        let alive = true
        api('/disclaimer')
          .then(payload => { if (alive) setDisclaimer(payload) })
          .catch(() => { if (alive) setDisclaimer({ acknowledged: true }) })
        return () => { alive = false }
      }, [])
      useEffect(() => {
        if (disclaimer === undefined) return
        if (disclaimer.acknowledged !== true) setDisclaimerOpen(true)
      }, [disclaimer])
      const shellRef = useRef(null)
      const [active, setActive] = useState(true)
      useEffect(() => {
        let inViewport = true
        const update = () => setActive(inViewport && document.hidden !== true)
        update()
        document.addEventListener?.('visibilitychange', update)
        const observer = typeof IntersectionObserver === 'function' && shellRef.current
          ? new IntersectionObserver(entries => { inViewport = entries.some(entry => entry.isIntersecting); update() }) : null
        if (observer) observer.observe(shellRef.current)
        return () => { document.removeEventListener?.('visibilitychange', update); observer?.disconnect() }
      }, [])
      const tabRefs = useRef({})
      const [glider, setGlider] = useState({ left: 0, top: 0, width: 0, height: 0 })
      useEffect(() => {
        try { window.localStorage?.setItem(TAB_KEY, tab) } catch { /* storage unavailable */ }
        const measure = () => {
          const node = tabRefs.current[tab]
          if (node) setGlider({ left: node.offsetLeft, top: node.offsetTop, width: node.offsetWidth, height: node.offsetHeight })
        }
        measure()
        const node = tabRefs.current[tab]
        const observer = typeof ResizeObserver === 'function' && node?.parentElement ? new ResizeObserver(measure) : null
        if (observer) observer.observe(node.parentElement)
        window.addEventListener('resize', measure)
        return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
      }, [tab, t.locale])

      const tabs = [
        ['channels', t('nav.tab.channels'), CHANNEL_PROVIDERS.length],
        ['saver', t('nav.tab.saver'), null],
        ['ledger', t('nav.tab.ledger'), null],
        ['logs', t('nav.tab.logs'), null],
      ]
      const nav = h('nav', { className: 'ofm_nav' },
        h('span', { className: 'ofm_navbrand' },
          h('span', { className: 'ofm_navmark', 'aria-hidden': 'true' },
            h('img', { src: BRAND_ICON, alt: '' })),
          t('title')),
        h('div', { className: 'ofm_tabs', role: 'tablist', 'aria-label': t('title'), onKeyDown: event => {
          const steps = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
          if (!Object.hasOwn(steps, event.key) && event.key !== 'Home' && event.key !== 'End') return
          event.preventDefault()
          const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
            : (tabs.findIndex(([id]) => id === tab) + steps[event.key] + tabs.length) % tabs.length
          setTab(tabs[index][0])
          event.currentTarget.querySelectorAll('[role="tab"]')[index]?.focus()
        } },
          h('span', { className: 'ofm_tabglider', 'aria-hidden': 'true',
            style: { transform: `translate(${glider.left}px, ${glider.top}px)`, width: `${glider.width}px`, height: `${glider.height}px` } }),
          tabs.map(([id, label, num]) => h('button', {
            key: id, type: 'button', role: 'tab', 'aria-selected': tab === id ? 'true' : 'false', className: 'ofm_tab', 'data-on': tab === id ? 'true' : 'false',
            tabIndex: tab === id ? 0 : -1,
            ref: node => { tabRefs.current[id] = node },
            id: `ofm-tab-${id}`, 'aria-controls': 'ofm-workspace',
            onClick: () => setTab(id),
          }, label, num === null ? null : h('span', { className: 'ofm_tabnum' }, String(num))))),
        h('div', { className: 'ofm_navtools', title: t('effects.hint') },
          h(Switch, { checked: effects, label: t('effects.enabled'), onChange: toggleEffects })))

      const page = tab === 'channels'
        ? h(ChannelsPage, { t, ctx, summary })
        : tab === 'saver'
            ? h(SaverPage, { t })
            : tab === 'ledger'
                ? h(LedgerPage, { t, ctx })
                : tab === 'logs'
                  ? h(LogsPage, { t, ctx })
                  : null

      return h('div', { className: 'ofm_root ofm_shell', ref: shellRef, 'data-ofm-effects': effects ? 'on' : 'off', 'data-ofm-active': active ? 'true' : 'false' },
        nav,
        h('div', { className: 'ofm_workspace', id: 'ofm-workspace', role: 'tabpanel', 'aria-labelledby': `ofm-tab-${tab}` }, page),
        h('footer', { className: 'ofm_shellfoot' },
          h('button', {
            type: 'button', className: 'ofm_linkbtn',
            onClick: () => setDisclaimerOpen(true),
          }, t('disclaimer.reopen'))),
        disclaimerOpen && disclaimer !== undefined
          ? h(Disclaimer, { t, copy: disclaimer, onClose: () => setDisclaimerOpen(false) })
          : null)
    }

    // ── announcement ──────────────────────────────────────────────────────────
    const PAGES = ['ann.preamble', 'ann.models', 'ann.steps', 'ann.features', 'ann.updates']

    function announcementPortalHost() {
      let host = document.querySelector('[data-ofm-announcement-root]')
      if (host === null) {
        host = document.createElement('div')
        host.setAttribute('data-ofm-announcement-root', 'true')
        document.body.appendChild(host)
      }
      return host
    }

    /**
     * The disclaimer: what this build does not offer, and whose responsibility
     * a third-party channel is.
     *
     * Shown once on the first settings visit (and whenever the copy version
     * moves), then reopenable from the footer link so a user who dismissed it
     * can read it again. It never blocks the model lanes — acknowledging is a
     * settings write, not a gate on inference.
     */
    function Disclaimer(props) {
      const { t, onClose } = props
      const [busy, setBusy] = useState(false)
      const copy = props.copy
      const dismiss = async () => {
        if (busy) return
        setBusy(true)
        try { await post('/disclaimer/ack') } catch { /* ack is best effort */ }
        onClose()
      }
      const host = announcementPortalHost()
      useEffect(() => () => {
        if (host.parentNode !== null) host.parentNode.removeChild(host)
      }, [host])
      return ReactDOM.createPortal(h('div', { className: 'ofm_scrim' },
        h('div', { className: 'ofm_ann ofm_disclaimer', role: 'dialog', 'aria-modal': 'true', 'aria-label': copy.title },
          h('div', { className: 'ofm_annhead' },
            h('h2', { className: 'ofm_anntitle' }, copy.title),
            h('p', { className: 'ofm_annsub' }, copy.subtitle)),
          h('div', { className: 'ofm_annbody' },
            h('p', null, copy.intro),
            copy.sections.map(section => h('section', { key: section.id, className: 'ofm_disclaimersec' },
              h('h3', null, section.heading),
              h('p', null, section.body)))),
          h('div', { className: 'ofm_annfoot' },
            h('span', { className: 'ofm_note' }, t('disclaimer.version').replace('{n}', copy.version)),
            h('span', { className: 'spacer' }),
            h(Button, { kind: 'primary', disabled: busy, onClick: dismiss }, busy ? t('disclaimer.saving') : copy.accept)))), host)
    }

    function Announcement(props) {
      const { t, complete, openSection, page, setPage, summary, acknowledged } = props
      useEffect(() => { if (acknowledged) complete() }, [acknowledged, complete])
      /* Not `#root.inert`, even though the shell does that for its own onboarding
         modals: those portal out of `#root`, while a slot-mounted step stays
         inside it, and inert has no opt-out for descendants. Measured with it on,
         `document.elementFromPoint` over the next-page button returned BODY — the
         dialog could not be clicked at all. The full-viewport scrim already
         swallows every pointer event aimed at the app behind it. */
      const host = acknowledged ? null : announcementPortalHost()
      useEffect(() => () => {
        if (host && host.parentNode !== null) host.parentNode.removeChild(host)
      }, [host])
      if (acknowledged) return null
      const last = page === PAGES.length - 1
      const finish = async () => {
        try { await post(`/announcement/ack?version=${encodeURIComponent(summary?.announcementVersion ?? '')}`) } catch { /* ack is best effort */ }
        complete()
      }
      return ReactDOM.createPortal(h('div', { className: 'ofm_scrim' },
        h('div', { className: 'ofm_ann', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('title') },
          h('div', { className: 'ofm_annhead' },
            h('h2', { className: 'ofm_anntitle' }, t('title')),
            h('p', { className: 'ofm_annsub' }, t(PAGES[page]))),
          h('div', { className: 'ofm_steps', 'aria-hidden': 'true' },
            PAGES.map((key, index) => h('span', { key, className: 'ofm_step', 'data-on': index <= page ? 'true' : 'false' }))),
          h('div', { className: 'ofm_annbody' }, h(PageBody, { page, t, summary })),
          h('div', { className: 'ofm_annfoot' },
            h('span', { className: 'ofm_note' }, t('ann.page').replace('{n}', page + 1).replace('{total}', PAGES.length)),
            h('span', { className: 'spacer' }),
            page === 0 ? h(Button, { kind: 'ghost', onClick: finish }, t('ann.later')) : h(Button, { kind: 'ghost', onClick: () => setPage(p => Math.max(0, p - 1)) }, '‹'),
            last
              ? h(Button, { kind: 'primary', onClick: async () => { await finish(); openSection?.('route-models') } }, t('ann.openSettings'))
              : h(Button, { kind: 'primary', onClick: () => setPage(p => Math.min(PAGES.length - 1, p + 1)) }, '›')))), host)
    }

    const list = (t, keys) => keys.map(key => h('li', { key }, t(key)))

    function PageBody(props) {
      const { page, t, summary } = props
      if (page === 0) return h(Fragment, null,
        h('h3', null, t('ann.preamble')),
        h('p', null, t('ann.pitch')),
        h('ul', null, list(t, ['ann.p1', 'ann.p2', 'ann.p3'])))
      if (page === 1) {        // Advertised models first: this page is the tour a new user reads before
        // they pick anything, and a refused id at the top of it is a bad first
        // impression of a lane that is actually working.
        const rows = (summary?.catalog ?? []).slice().sort((a, b) => (a.route === null ? 1 : 0) - (b.route === null ? 1 : 0))
        if (rows.length === 0) return h('p', null, t('loading'))
        return h(Fragment, null,
          h('h3', null, t('ann.models')),
          h('div', { className: 'ofm_kv' }, rows.slice(0, 8).map(m => h('div', { key: m.id, className: 'ofm_kvc' },
            h('b', null, m.name),
            h('span', null, `${t(`state.${m.availability}`)} · ${m.vision ? t('tag.vision') : t('tag.text')} · ${kilo(m.contextWindow)}`)))),
          rows.some(m => m.availability === 'region-blocked') ? h('p', { className: 'ofm_note' }, t('hint.region')) : null)
      }
      if (page === 2) return h(Fragment, null,
        h('h3', null, t('ann.steps')),
        h('ul', null, list(t, ['ann.s1', 'ann.s2', 'ann.s3', 'ann.s4'])))
      if (page === 3) return h(Fragment, null,
        h('h3', null, t('ann.features')),
        h('ul', null, list(t, ['ann.f1', 'ann.f2', 'ann.f3', 'ann.f4', 'ann.f5'])))
      return h(Fragment, null,
        h('h3', null, t('ann.updates')),
        h('ul', null, list(t, ['ann.u1', 'ann.u2', 'ann.u3', 'ann.u4'])))
    }

    // ── registration ──────────────────────────────────────────────────────────
    // The shell mirrors the active language onto <html lang>, so a render-time
    // read survives a language switch without owning a subscription.
    function localeTag(ctx) {
      try {
        const snapshot = typeof ctx.locale?.getLocale === 'function' ? ctx.locale.getLocale() : ctx.locale?.getSnapshot?.()
        const value = snapshot?.active ?? ctx.locale?.locale
        return typeof value === 'string' ? value : document.documentElement.lang || 'en'
      } catch { return 'en' }
    }

    function apply(ctx) {
      const t = ctx.locale.bind(NS)
      ctx.effect(() => ctx.locale.register(NS, { zh: DICT.zh, en: DICT.en }), 'route-models: dictionaries')

      ctx.effect(() => {
        const style = document.createElement('style')
        style.setAttribute('data-plugin', 'dsh-route-models')
        style.textContent = CSS
        document.head.appendChild(style)
        return () => style.remove()
      }, 'route-models: styles')

      // ── push subscription ───────────────────────────────────────────────────
      // One EventSource for the whole app surface: new announcements become
      // toasts (and OS notifications when opted in), urgent ones open a modal,
      // update availability and completed upgrades broadcast onto window so
      // whichever panel is mounted can refresh itself. EventSource reconnects
      // by itself; the hot reload closes every stream server-side, so a swap
      // simply shows up as a fresh `hello` a second later.
      ctx.effect(() => {
        if (typeof EventSource !== 'function') return
        let osEnabled = false
        let disposed = false
        let source
        let retryTimer
        // 重连轮次必须活在 open() 之外：open() 每次重连都会重入，计数器若在里面
        // 会被清零，退避就永远是第一档而不是 30s 翻倍到 5 分钟。
        let retries = 0
        api('/announcements').then(payload => { osEnabled = payload?.notifyOs === true }).catch(() => {})
        const open = () => {
          if (disposed) return
          source = new EventSource(`${API}/events`)
          // 断连保护：服务端不可达时 EventSource 默认无限自动重连（持续占连接池）。
          // 连续失败达到上限先关闭让出连接，但按退避（30s 翻倍、封顶 5 分钟）定时
          // 重新打开——永久关闭让公告/更新/升级推送在宿主重启或休眠后整体静默失效，
          // 只有刷新页面才能恢复；退避重连在恢复连接性的同时保住连接池。
          let errCount = 0
          source.onopen = () => { errCount = 0; retries = 0 }
          source.onerror = () => {
            errCount += 1
            if (errCount < 5) return
            try { source.close() } catch { /* 已关闭 */ }
            if (disposed || retryTimer !== undefined) return
            retryTimer = setTimeout(() => {
              retryTimer = undefined
              open()
            }, Math.min(30_000 * 2 ** retries, 300_000))
            retries += 1
          }
          source.addEventListener('announcements', event => {
            errCount = 0
            let data
            try { data = JSON.parse(event.data) } catch { return }
            for (const item of data.items ?? []) {
              osNotify(t('toast.annTitle'), item.title)
              if (item.level === 'urgent') {
                showUrgentModal({
                  title: `${t('news.urgentTitle')} · ${item.title}`,
                  html: item.html ?? '',
                  confirmLabel: t('news.gotIt'),
                  onClose: () => { void post('/announcements/ack', { id: item.id }).catch(() => {}) },
                })
              } else {
                showToast({ title: t('toast.annTitle'), body: item.title, tone: item.level === 'warn' ? 'warn' : undefined })
              }
            }
            window.dispatchEvent(new CustomEvent('ofm:announcements', { detail: data }))
          })
          source.addEventListener('hello', event => {
            let data
            try { data = JSON.parse(event.data) } catch { data = {} }
            window.dispatchEvent(new CustomEvent('ofm:hello', { detail: data }))
          })
        }
        open()
        return () => {
          disposed = true
          if (retryTimer !== undefined) { clearTimeout(retryTimer); retryTimer = undefined }
          try { source?.close() } catch { /* already closed */ }
        }
      }, 'route-models: push subscription')

      // A hot reload or in-app upgrade swaps this bundle while the page stays
      // open. The only durable marker across that swap is localStorage, so the
      // successor announces what happened exactly once.
      ctx.effect(() => {
        void (async () => {
          try {
            const meta = await api('/meta')
            const at = Number(meta?.reloadedAt ?? 0)
            if (at <= 0) return
            let seen = ''
            try { seen = window.localStorage?.getItem('ofm.reloadedAt') ?? '' } catch { /* storage unavailable */ }
            if (String(at) === seen) return
            try { window.localStorage?.setItem('ofm.reloadedAt', String(at)) } catch { /* ignore */ }
            showToast({
              title: meta.version !== '' ? `${t('title')} ${meta.version}` : t('title'),
              body: t('reload.done').replace('{n}', String(meta.reloadCount ?? 0)),
              actions: [{ label: t('reload.refresh'), onClick: () => { try { window.location.reload() } catch { /* top-level navigation refused */ } } }],
              holdMs: 12000,
            })
          } catch { /* backend absent */ }
        })()
        return () => {}
      }, 'route-models: reload notice')

      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'route-models',
        order: 35,
        label: () => t('nav'),
        locale: NS,
      }, props => h(SettingsPage, { ...props, locale: localeTag(ctx), ctx })))

      ctx.slots.inject('settings.onboarding', () => ctx.slots.register({
        name: 'settings.onboarding',
        id: 'route-models-announcement',
        order: -50,
        locale: NS,
      }, props => h(AnnouncementGate, { ...props, t: Object.assign(x => t(x), { locale: localeTag(ctx) }) })))
    }
    /**
     * Owns the announcement's readiness.
     *
     * The onboarding coordinator mounts one ordered step at a time and waits for
     * the registrant to either show something or call `complete`. This renders
     * null until the ack state is known — a step that paints a skeleton then
     * removes it is worse than one that waits — and completes immediately when
     * the user already acknowledged the current copy version.
     */
    function AnnouncementGate(props) {
      const { t, complete, openSection, explicit } = props
      const [ack, setAck] = useState(undefined)
      const [summary, setSummary] = useState(undefined)
      const [page, setPage] = useState(0)
      useEffect(() => {
        let alive = true
        api('/announcement')
          .then(payload => { if (alive) setAck(payload) })
          .catch(() => { if (alive) setAck({ acknowledged: true, version: '' }) })
        api('/summary').then(payload => { if (alive) setSummary(payload) }).catch(() => {})
        // 超时兜底：3 秒拿不到 ack（后端挂起/超时/异常）→ 当作已 ack 主动放行——
        // 本组件是 settings.onboarding 协调器最先执行的 step（order:-50），complete 依赖 ack；
        // ack 永远 undefined 会永久卡住 onboarding 流程（连带阻塞后续 step 与主题启动画面）。
        const timer = setTimeout(() => {
          if (alive) setAck(current => current ?? { acknowledged: true, version: '' })
        }, 3000)
        return () => { alive = false; clearTimeout(timer) }
      }, [])
      const acknowledged = ack?.acknowledged === true && explicit !== true
      useEffect(() => {
        if (ack === undefined) return
        if (acknowledged) complete?.()
      }, [ack, acknowledged, complete])
      if (ack === undefined || acknowledged) return null
      return h(Announcement, { t, complete, openSection, page, setPage, summary, acknowledged: false })
    }
    exports.apply = apply
    exports.inject = inject
    exports.name = 'route-models'
    // Headless test seams use the same stub React as scripts/client-lint.mjs.
    exports.__test = { parseSafeHtml, safeUrl, sanitizeStyle, htmlToDom, ChannelsPage, DICT, useChannelRpc, Shell, Disclaimer, CSS }
    return module.exports
  },
})
