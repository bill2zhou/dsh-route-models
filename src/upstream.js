/**
 * Shared request-identity and wire helpers.
 *
 * This module used to be the upstream wire of the anonymous free lane: the
 * public pooled credential, the client fingerprint headers, the per-model
 * endpoint split, and the free-tier tool-fingerprint gate (the port of the
 * reference gateway `opencode2api` lives on in `src/o2a/`). The lane itself —
 * its catalog, its listing round and its availability probes — was removed
 * from the plugin, so the shaping pass, the endpoint table and the
 * free-lane request assembly are gone with it.
 *
 * What survives here is what the kept lanes and listeners still import:
 * - `baseModelId` / `MAX_TOOL_NAME_LEN` / `restoreToolName` /
 *   `FINGERPRINT_TOOLS`: id and tool-name utilities used by the adapter,
 *   `messages.js`, `stream.js` and the forward listener. (`restoreToolName`
 *   is now identity for every dispatch — the rename map that carried the
 *   injected officials went away with the lane — but its callers keep the
 *   same contract.)
 * - the session identity layer (`sessionForConversation` and its persisted
 *   map, `canonicalizeSession`, `mintSessionId`, `mintRequestId`,
 *   `truncateSession`): the aggregate lane still rides one stable, canonical
 *   session per conversation.
 * - `gatewayHeaders` / `CLIENT_UA` / `UPSTREAM_BASE`: the header shaper that
 *   `src/http.js` imports for the generic `postStreamed`/`getJson` helpers.
 *   No kept producer calls them any more; they stay exported so `http.js`
 *   (outside this removal's file scope) keeps evaluating.
 *
 * @module src/upstream.js
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { DATA_DIR_NAME, resolveDshHome } from './store.js'
// 发布形态唯一导入点：src/o2a.js 由 scripts/build-legacy-payload.mjs 把
// src/o2a/ 八个模块（官方资产内联）打成单文件；开发/测试直接跑仓库里的产物。
import {
  BASE62_ALPHABET,
  CANONICAL_SESSION_RE,
  CLIENT_UA,
  DESCENDING_TIME_RE,
  O2A_VERSION,
  canonicalSessionID,
  gatewayHeaders as o2aGatewayHeaders,
  isOfficialSessionID,
  phaseAgeMs,
  randomID,
  sessionPhaseMs,
} from './o2a.js'

/**
 * Overridable so the selftest could point the adapter at a dead port. Kept as
 * an import surface for `src/http.js`; no kept producer dials it.
 */
export const UPSTREAM_BASE = process.env.OUR_FREE_MODEL_BASE ?? 'https://opencode.ai'

export { CLIENT_UA }

/**
 * Which opencode2api release the identity layer currently mirrors. Bumped with
 * `src/o2a/version.js` on every port refresh.
 */
export const O2A_PORTED_VERSION = O2A_VERSION

const MAX_SESSION_LENGTH = 256
export const MAX_TOOL_NAME_LEN = 128
const BASE62 = BASE62_ALPHABET

/**
 * The names the removed free tier's v2 gate validated verbatim. The forward
 * listener still uses this list to suppress hallucinated decoy tool calls.
 */
export const FINGERPRINT_TOOLS = ['read', 'shell']

export const SESSION_RE = CANONICAL_SESSION_RE

export const SESSION_DESCENDING_RE = DESCENDING_TIME_RE

/** Whether `id` is a session the canonical layout accepts as-is. */
export function isCanonicalSession(id) {
  return typeof id === 'string' && SESSION_RE.test(id.trim()) && SESSION_DESCENDING_RE.test(id.trim().slice(4, 16))
}

/**
 * Re-encode any session signal into the canonical layout (`o2a/identity.canonicalSessionID`):
 * official sessions pass through, and a synthesized one carries a slow-clock
 * timestamp inside the window upstream keeps, salted per process so a restart
 * re-mints.
 */
export function canonicalizeSession(signal) {
  return canonicalSessionID(signal)
}

/** Render `bytes` as base62, one character per byte (`base62From`). */
function base62From(bytes) {
  let out = ''
  for (const byte of bytes) out += BASE62[byte % 62]
  return out
}

let lastStamp = 0
let seq = 0

/**
 * Mint a canonical session id (time-prefixed, monotonic counter).
 *
 * Kept for bookkeeping and tests: sessions mint through
 * {@link canonicalizeSession} now. The encoding is the gate's:
 * `~(ts_ms * 0x1000 + counter)`, whose low 12 bits land at `0xfff - counter`.
 */
export function mintSessionId(timestamp = Date.now()) {
  if (timestamp !== lastStamp) { lastStamp = timestamp; seq = 0 }
  seq += 1
  const value = ~(BigInt(timestamp) * 0x1000n + BigInt(seq))
  let hex = ''
  for (let i = 0; i < 6; i += 1) hex += Number((value >> BigInt(40 - 8 * i)) & 0xffn).toString(16).padStart(2, '0')
  return `ses_${hex}${base62From(crypto.randomBytes(14))}`
}

/**
 * Mint a `msg_`-shaped id for local bookkeeping (turn/recovery records).
 * It never goes on the wire; it is a one-shot identifier.
 */
export function mintRequestId(timestamp = Date.now()) {
  const value = BigInt(timestamp) * 0x1000n + 1n
  let hex = ''
  for (let i = 0; i < 6; i += 1) hex += Number((value >> BigInt(40 - 8 * i)) & 0xffn).toString(16).padStart(2, '0')
  return `msg_${hex}${base62From(crypto.randomBytes(14))}`
}

/**
 * The phase age a kept session may carry. The wire's time part is a 36-bit
 * millisecond phase (~795-day cycle, see o2a/identity.js), and the slow clock
 * mints phases at most 30 days old; a 60-day ceiling accepts every id this
 * module mints (active conversations keep theirs indefinitely) while re-minting
 * the pre-port ids, whose hash-derived phase landed uniformly across the whole
 * cycle.
 */
const SESSION_PLAUSIBILITY_MS = 60 * 24 * 60 * 60 * 1000

const SESSION_MAP_FILE = 'session-map.json'
let sessions

function sessionStorePath() {
  try { return path.join(path.resolve(resolveDshHome(), DATA_DIR_NAME), SESSION_MAP_FILE) } catch { return undefined }
}

function loadSessions() {
  if (sessions !== undefined) return sessions
  sessions = new Map()
  try {
    const file = sessionStorePath()
    if (file === undefined) return sessions
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
    for (const [seed, id] of Object.entries(parsed?.sessions ?? {})) {
      if (typeof id === 'string' && SESSION_RE.test(id)) sessions.set(seed, id)
    }
  } catch { /* first run or unreadable store: start empty */ }
  return sessions
}

function rememberSession(seed, id) {
  loadSessions().set(seed, id)
  try {
    const file = sessionStorePath()
    if (file === undefined) return
    fs.mkdirSync(path.dirname(file), { recursive: true })
    const temp = `${file}.tmp`
    fs.writeFileSync(temp, JSON.stringify({ version: 2, at: Date.now(), sessions: Object.fromEntries(sessions) }, undefined, 2))
    fs.renameSync(temp, file)
  } catch { /* non-fatal: the id still works, it just will not survive a restart */ }
}

/**
 * Whether a canonical session's embedded time phase is inside the accepted
 * window. The wire carries a 36-bit millisecond phase (see `o2a/identity.js`),
 * not an absolute date, so plausibility is "dated within the last two months of
 * the current phase cycle" — exactly what the slow clock mints and what a
 * hash-derived 1970 landing (the pre-port ids) almost never satisfies.
 */
function plausibleSession(id) {
  const phase = sessionPhaseMs(id)
  return phase !== null && phaseAgeMs(phase) < SESSION_PLAUSIBILITY_MS
}

/**
 * Map one downstream conversation onto one stable canonical session.
 *
 * Mint once and persist the result. Never rotate IDs on retries or model
 * errors. A caller's canonical OC ID is kept, and a remembered id whose date
 * has left the accepted window is re-minted instead of replayed.
 */
export function sessionForConversation(sessionId) {
  if (typeof sessionId === 'string' && isCanonicalSession(sessionId)) return sessionId.trim()
  const seed = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : 'global'
  const remembered = loadSessions().get(seed)
  if (remembered !== undefined && isCanonicalSession(remembered) && plausibleSession(remembered)) return remembered
  const minted = canonicalizeSession(seed)
  rememberSession(seed, minted)
  return minted
}

/** Strip a trailing "(level)" thinking suffix so lookups hit the base id. */
export function baseModelId(model) {
  return String(model ?? '').replace(/\([^()]+\)\s*$/, '').trim()
}

/**
 * The header set `o2a/headers.js` shapes for the (removed) free-tier gate.
 * Kept for `src/http.js`, whose generic `postStreamed`/`getJson` take their
 * headers from here; no kept producer calls those helpers any more.
 */
export function gatewayHeaders(options) {
  return o2aGatewayHeaders(options)
}

function truncateSession(value) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed.length > MAX_SESSION_LENGTH ? trimmed.slice(0, MAX_SESSION_LENGTH) : trimmed
}

/** Restore the caller's tool spelling in a streaming delta or a final payload.
 *  With the free lane's rename pass removed the map is always empty, so this
 *  answers with the name unchanged; the contract stays for `messages.js` and
 *  `stream.js`. */
export function restoreToolName(name, map) {
  if (!map) return name
  if (typeof map.resolve === 'function') return map.resolve(name)
  if (map.size === 0) return name
  return map.get(name) ?? name
}

export { truncateSession, randomID, isOfficialSessionID }
