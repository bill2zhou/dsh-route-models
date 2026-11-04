/** 为旧升级器生成兼容的运行时资源；不改变其 80 文件和 4 MiB 限制。 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import zlib from 'node:zlib'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const checking = process.argv.includes('--check')
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const require = createRequire(import.meta.url)
let esbuild
try {
  esbuild = await import(pathToFileURL(require.resolve('esbuild', { paths: [root] })).href)
} catch (error) {
  // release-sign 在无依赖的裸检出上跑发布套件（"plain Node scripts"）；打包校验
  // 在那里没有意义，真正的守卫是装好依赖的 test.yml。写模式没有 esbuild 仍然硬失败。
  if (checking && error?.code === 'MODULE_NOT_FOUND') {
    console.log('legacy-payload: skipped — esbuild 不可用（无依赖安装）；守卫在装好依赖的环境里运行')
    process.exit(0)
  }
  throw error
}
const result = await esbuild.build({
  stdin: { contents: "export * from './src/token-saver/index.js'; export * from './src/token-saver/prompts.js';", resolveDir: root, sourcefile: 'token-saver-entry.js' },
  bundle: true, write: false, format: 'esm', platform: 'node', target: 'node22', legalComments: 'inline',
})
const write = (rel, bytes) => {
  const target = path.join(root, rel)
  const body = Buffer.from(bytes)
  if (checking) {
    if (!fs.existsSync(target) || !fs.readFileSync(target).equals(body)) throw new Error(`生成资源不一致：${rel}`)
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, body)
  }
}
write('src/token-saver.js', result.outputFiles[0].contents)

// ---- 发布 bundle：o2a 与 core 各并为单文件（80 文件预算）----
// 源目录（src/o2a/、src/core/）保留在仓库里供开发与测试；插件包只随 bundle
// 走。o2a 的两个官方资产由插件内联进 bundle（assets/ 不随包发布）；core 的
// 兄弟模块依赖保持外部引用（避免把 adapter/http 一整串拖进来），并把
// '../x.js' 改写成 './x.js' 以匹配 bundle 在 src/ 下的落点。
const o2aInlineAssets = {
  name: 'o2a-inline-assets',
  setup(build) {
    build.onLoad({ filter: /o2a[\\/]asset-source\.js$/ }, () => ({
      loader: 'js',
      contents: [
        '// 由 scripts/build-legacy-payload.mjs 生成：发布 bundle 的内联资产；开发形态见 src/o2a/asset-source.js。',
        `export const OFFICIAL_PROMPT_V2 = ${JSON.stringify(fs.readFileSync(path.join(root, 'src/o2a/assets/opencode_prompt_v2.txt'), 'utf8'))}`,
        `export const OFFICIAL_TOOLS_V2 = ${JSON.stringify(fs.readFileSync(path.join(root, 'src/o2a/assets/opencode_tools.json'), 'utf8'))}`,
        'export function officialPromptText() { return OFFICIAL_PROMPT_V2 }',
        'export function officialToolsText() { return OFFICIAL_TOOLS_V2 }',
      ].join('\n'),
    }))
  },
}

// core 的兄弟目录依赖（http、adapter、store…）不能打进 bundle：既会复制
// token-saver 的模块级状态，也会让文件膨胀成半个应用。外部化时把相对上级
// 路径改写为同级（bundle 落点 src/core.js 与旧 src/core/*.js 的 ../ 视角差一层）。
const keepParentExternals = {
  name: 'keep-parent-externals',
  setup(build) {
    build.onResolve({ filter: /^\.\.[\\/]/ }, args => ({ path: `./${path.basename(args.path)}`, external: true }))
  },
}

/** Exported names of one module, parsed from its source (explicit barrel input). */
function exportedNames(rel) {
  const source = fs.readFileSync(path.join(root, rel), 'utf8')
  const names = []
  for (const m of source.matchAll(/^export\s+(?:async\s+)?(?:const|let|var|function\s*\*?|class)\s+([A-Za-z_$][\w$]*)/gm)) names.push(m[1])
  for (const m of source.matchAll(/^export\s*\{([^}]+)\}/gm)) {
    for (const part of m[1].split(',')) {
      const segment = part.trim()
      if (segment === '' || segment === 'default') continue
      const aliased = segment.split(/\s+as\s+/)
      names.push((aliased[1] ?? aliased[0]).trim())
    }
  }
  if (names.length === 0) throw new Error(`未能解析导出名：${rel}`)
  return names
}

async function bundleToFile(name, specs, plugins) {
  const barrel = specs.map(([module, names]) => `export { ${names.join(', ')} } from '${module}';`).join('\n')
  const built = await esbuild.build({
    stdin: { contents: barrel, resolveDir: root, sourcefile: `${name}-entry.js` },
    bundle: true, write: false, format: 'esm', platform: 'node', target: 'node22', legalComments: 'inline',
    plugins,
  })
  write(`src/${name}.js`, built.outputFiles[0].contents)
}

const o2aModules = ['version', 'identity', 'tool-renames', 'official-tools', 'official-prompt', 'gateway-body', 'headers', 'toolshape']
const seenExports = new Map()
const o2aSpecs = []
for (const mod of o2aModules) {
  const rel = `src/o2a/${mod}.js`
  const names = exportedNames(rel)
  for (const name of names) {
    if (seenExports.has(name)) throw new Error(`o2a 导出名冲突：${name} 同时来自 ${seenExports.get(name)} 与 ${rel}`)
    seenExports.set(name, rel)
  }
  o2aSpecs.push([`./src/o2a/${mod}.js`, names])
}
await bundleToFile('o2a', o2aSpecs, [o2aInlineAssets])

const coreSpecs = ['completion', 'runtime', 'stats'].map(mod => [`./src/core/${mod}.js`, exportedNames(`src/core/${mod}.js`)])
await bundleToFile('core', coreSpecs, [keepParentExternals])

console.log('旧版兼容资源一致：省 Token 单文件，o2a/core 发布 bundle')
