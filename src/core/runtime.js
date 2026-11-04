/**
 * The model runtime shared by both products (plugin host + standalone app).
 *
 * The three fixed producers — the anonymous free lane (an upstream listing +
 * per-model availability probes), the EAC co-paid lane (a sealed credential and
 * its own relay), and the Kilo free pool (a keyless gateway listing) — were
 * removed. What the runtime composes now is every row the surviving lanes
 * materialize locally: the account-channel subscriptions. Nothing is named by a
 * remote listing, so there is no listing round and no probe round left to run:
 * a refresh re-derives the catalog from the subscription runtime.
 *
 * 宿主仅注入能力，不传入 Cordis ctx。创建不启动网络任务；入口先绑定本地
 * 监听器，再决定何时刷新。
 * Optional subscriptionRuntime supplies catalog() and complete(request, onChunk);
 * its helper owns accounting. Call syncAggregateCatalog() after account mutations.
 */
import fs from 'node:fs'
import path from 'node:path'
import { FreeModelAdapter, ROUTE_MAIN, ROUTE_REGION } from '../adapter.js'
import { JsonStore, SETTINGS_INITIAL, STATS_INITIAL, STATS_VERSION, migrateStats, pruneDays, recordTurn, recordUsage, isModelHidden } from '../store.js'
import { STATE, detectEgress } from '../probe.js'
import { CODE, UpstreamError } from '../http.js'
import { runModelTest, modelAvailability } from '../model-test.js'
import { DEFAULT_LEVEL } from '../effort.js'
import { createForwardCompletion, publicModelRows } from './completion.js'
import { isSubscriptionEntry, subscriptionCatalog } from '../subscription-adapter.js'

/** 路径由产品入口决定；核心不解析 DSH_HOME，也不发现宿主服务。 */
export function createRuntimeStores({ dataDir, logger = console }) {
  if (typeof dataDir !== 'string' || !path.isAbsolute(dataDir)) {
    throw new TypeError('dataDir must be an absolute path')
  }
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 })
  const open = (file, initial) => new JsonStore(path.join(dataDir, file), structuredClone(initial), {
    log: message => logger.warn?.(message),
  })
  const settingsInitial = structuredClone(SETTINGS_INITIAL)
  const settingsPath = path.join(dataDir, 'settings.json')
  const settings = new JsonStore(settingsPath, settingsInitial, {
    log: message => logger.warn?.(message),
  })
  const stats = open('stats.json', STATS_INITIAL)
  const availability = open('availability.json', { version: 1, at: 0, egress: null, results: {} })
  // The catalog file survives as a store (an older build's rows may still be
  // on disk; it is no longer read): no surviving lane derives rows from a
  // persisted listing.
  const catalogStore = open('catalog.json', { version: 1, at: 0, entries: [] })
  if (stats.get().version !== STATS_VERSION) stats.edit(migrateStats)
  return {
    settings, stats, availability, catalogStore,
    dispose() {
      settings.dispose(); stats.dispose(); availability.dispose(); catalogStore.dispose()
    },
  }
}

export function createModelRuntime({
  settings, stats, availability,
  logger = console,
  attributionUserAgent = 'route-models',
  resolveImage,
  onTopology = () => {},
  subscriptionRuntime,
}) {
  let subscriptionEntries = []
  let catalog = []
  let egress = availability.get().egress ?? null
  /** Inert since the fixed lanes were removed: there is no upstream gateway left
   *  for the outlet's latency reading to measure against. Kept because the
   *  settings surface still reports the field. */
  const gatewayLatency = { ms: 0, at: 0 }
  let disposed = false
  const lifetime = new AbortController()
  let egressGeneration = 0

  /**
   * Rebuild the merged catalog from its parts.
   *
   * Rebuilt rather than appended to, because the subscription list can shrink:
   * an account the user removed stops contributing its rows.
   */
  const rebuildCatalog = () => {
    const seen = new Set()
    const merged = []
    for (const entry of subscriptionEntries) {
      if (entry === null || entry === undefined || seen.has(entry.id)) continue
      seen.add(entry.id)
      merged.push(entry)
    }
    catalog = merged
  }
  const mergeCatalogs = () => {
    subscriptionEntries = subscriptionCatalog(subscriptionRuntime)
    rebuildCatalog()
  }
  mergeCatalogs()
  const state = () => ({
    catalog,
    membership: computeMembership(catalog, availability.get(), settings.get()),
    settings: settings.get(),
    attributionUserAgent,
    routing: {
      quota: subscriptionRuntime?.routingQuota?.() ?? {},
      usage: Object.fromEntries(catalog.map(row => [row.id, stats.get().models?.[row.id]?.calls ?? 0])),
    },
  })
  const emitTopology = () => { if (!disposed) onTopology() }
  const adapter = new FreeModelAdapter({
    state,
    resolveImage,
    subscriptionRuntime,
    recordUsage: record => {
      if (disposed) return
      recordUsage(stats, record)
      stats.edit(value => pruneDays(value, 120))
    },
    recordTurn: record => { if (!disposed) recordTurn(stats, record) },
    warn: message => logger.warn?.(message) ?? logger.log?.(message),
  })

  // Kept shape for both product entries: a refresh used to mean one listing
  // round per producer. With the fixed lanes gone it only re-derives the merged
  // view from settings; `sources` stays an (empty) map so callers that printed
  // per-producer verdicts keep working.
  async function refreshCatalog(opts) {
    const { report = false } = opts ?? {}
    const result = value => report ? value : value.catalog
    if (disposed) return result({ catalog, sources: {} })
    mergeCatalogs()
    emitTopology()
    return result({ catalog, sources: {} })
  }

  /**
   * No lane left in the runtime is pinged for availability: a subscription row's
   * health is its account. Manual text tests still record samples. The call
   * stays a cheap no-op so `/reprobe` keeps answering.
   */
  async function refreshAvailability() {
    if (disposed) return {}
    emitTopology()
    return {}
  }

  async function watchEgress() {
    if (disposed) return false
    const seen = await detectEgress({ signal: lifetime.signal })
    if (disposed || seen === undefined) return false
    const previous = availability.get().egress
    const changed = previous === null || previous === undefined
      || previous.ip !== seen.ip || (seen.country !== undefined && previous.country !== seen.country)
    egress = seen
    if (changed) {
      egressGeneration++
      // 保留历史记录，但旧出口的测量均不能代表新出口。
      const expire = rows => Object.fromEntries(Object.entries(rows ?? {}).map(([id, row]) => [id, { ...row, stale: true }]))
      availability.edit(value => ({
        ...value, egress: seen, at: 0,
        results: expire(value.results), manualResults: expire(value.manualResults),
      }))
      availability.flush()
      emitTopology()
      logger.info?.(`route-models: egress changed to ${seen.ip}${seen.country ? ` (${seen.country})` : ''}; previous availability marked stale`)
    }
    return true
  }

  const latestTests = new Map()
  async function testModel(id, effort = DEFAULT_LEVEL, { signal } = {}) {
    if (disposed) throw new UpstreamError('Model runtime stopped', CODE.aborted)
    if (settings.get().enabled === false) throw new UpstreamError('Inference is paused', CODE.client)
    const entry = catalog.find(candidate => candidate.id === id)
    if (!entry) throw new UpstreamError('Unknown model "' + id + '"', CODE.client, { status: 404 })
    const token = {}
    latestTests.set(id, token)
    const generation = egressGeneration
    const selectedEffort = effort === undefined || effort === '' ? DEFAULT_LEVEL : effort
    const linkedSignal = signal ? AbortSignal.any([signal, lifetime.signal]) : lifetime.signal
    const persist = row => {
      if (disposed || linkedSignal.aborted || latestTests.get(id) !== token || generation !== egressGeneration) return false
      availability.edit(value => ({ ...value, manualResults: { ...value.manualResults, [id]: row } }))
      availability.flush()
      emitTopology()
      return !availability.writeFailed
    }
    try {
      const measured = await runModelTest(testSignal => adapter.stream({
        provider: ROUTE_MAIN, model: entry.id,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        reasoningEffort: selectedEffort, sessionId: 'bench:' + entry.id + ':' + selectedEffort,
        signal: testSignal,
      }, entry, state()), { signal: linkedSignal })
      if (linkedSignal.aborted || disposed) throw new UpstreamError('Text test cancelled', CODE.aborted)
      if (generation !== egressGeneration) throw new UpstreamError('Network egress changed during the text test; please test again', CODE.aborted)
      const persisted = persist({ state: STATE.available, source: 'manual', at: Date.now(), ttftMs: measured.ttftMs, latencyMs: measured.totalMs })
      return { model: entry.id, effort: selectedEffort, ok: true, ...measured, persisted }
    } catch (error) {
      // Cancellation is a user action, not a fresh availability verdict. Other failures
      // remain unknown instead of silently banning a paid/region-gated route.
      if (error?.code !== CODE.aborted) persist({ state: STATE.unknown, source: 'manual', at: Date.now(), detail: String(error?.message ?? error).slice(0, 200) })
      throw error
    } finally {
      if (latestTests.get(id) === token) latestTests.delete(id)
    }
  }

  return {
    testModel, state, adapter, refreshCatalog, refreshAvailability, watchEgress, fetchListing, publicModelRows: () => publicModelRows(state()),
    complete: createForwardCompletion({
      adapter, signal: lifetime.signal,
      state: () => {
        const snapshot = state()
        // Hiding advertisements must not invalidate requests using a saved id.
        return { ...snapshot, membership: computeMembership(snapshot.catalog, availability.get(), {
          ...snapshot.settings, hiddenModelIds: [], hideFreeModels: false, hideEacModels: false,
        }) }
      },
    }),
    // A settings write that changes the aggregate lane or the chains (a key
    // saved, a subscription imported/toggled/removed, a combo edited) rebuilds
    // the merged view without any upstream round.
    syncAggregateCatalog() {
      if (disposed) return catalog
      mergeCatalogs()
      emitTopology()
      return catalog
    },
    get catalog() { return catalog },
    get egress() { return egress },
    get gatewayLatency() { return gatewayLatency },
    setAttributionUserAgent(value) { attributionUserAgent = value },
    dispose() {
      if (disposed) return
      disposed = true
      lifetime.abort()
    },
  }

  /**
   * Kept as an inert seam: the outlet's latency panel used to time a real
   * gateway round trip through it. There is no upstream gateway left to dial,
   * so the reading is simply "no reading".
   */
  async function fetchListing() {
    if (disposed) return { data: [] }
    return { data: [] }
  }
}

export function computeMembership(catalog, availabilitySnapshot, settings) {
  const expose = settings?.exposeRegionModels !== false
  // Every surviving row carries a channel, and a channel row has no
  // availability verdict of its own: `modelAvailability(..., listed = true)`
  // reads the row as "named by its own source", never as refused. Keeping such
  // rows usable — into ROUTE_MAIN — is the whole membership rule now; the
  // region route only ever held free-lane verdicts.
  const verdictOf = entry => modelAvailability(entry.id, availabilitySnapshot, Boolean(entry.channel)).availability
  const usable = catalog.filter(entry => verdictOf(entry) !== STATE.unavailable)
  const main = []
  const region = []
  for (const entry of usable) {
    if (isModelHidden(entry, settings)) continue
    const verdict = verdictOf(entry)
    if (verdict !== STATE.regionBlocked) main.push(entry.id)
    else if (expose) region.push(entry.id)
  }
  const membership = {}
  if (main.length > 0) membership[ROUTE_MAIN] = main
  if (region.length > 0) membership[ROUTE_REGION] = region
  return membership
}
