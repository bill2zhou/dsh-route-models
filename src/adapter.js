/**
 * The provider adapter.
 *
 * It satisfies the harness adapter contract structurally — `registerAdapter`
 * validates by calling the methods, not by an `instanceof` test — which is what
 * lets this plugin mount on more than one kernel line without importing a
 * version-pinned adapter base class.
 *
 * Two routes are published from one adapter instance, because the harness groups
 * the model picker strictly by provider route and offers no other grouping
 * field: `route-models` carries what this egress can use right now, and
 * `route-models-region` carries what the gateway refuses on this egress. A
 * group with no models is dropped from the picker by the client, so a user whose
 * VPN unlocks the region-gated models sees one group, and a user without sees
 * the second group labelled as such.
 *
 * @module src/adapter.js
 */

import { baseModelId, mintRequestId, sessionForConversation } from './upstream.js'
import { toChatMessages, toClaudeMessages, toResponseInput, toToolDefs, repairToolPairing } from './messages.js'
import { CODE, UpstreamError } from './http.js'
import { finishReason, readStream, windowTokens } from './stream.js'
import { DEFAULT_LEVEL, MIN_BUDGET, budgetFor, defaultEffortFor, effortPatchFor, effortsFor, hasDeclaredEffortMenu, resolveLevel } from './effort.js'
import { createChannel } from './channel.js'
import { recoveryPolicy, canRecover, canRecoverSilentStop, recoveryMessages, continuationMessages, checkpointFits, addUsage, createBlockTracker } from './recovery.js'
import { applyTokenSavers, saverConfig } from './token-saver.js'
import { classifyFailure, describeVerdict, shouldAdvance } from './route/classify.js'
import { FALLBACK_IMAGE_PRICING } from './image-pricing.js'
import { isSubscriptionEntry, subscriptionChunks } from './subscription-adapter.js'


export const ROUTE_MAIN = 'route-models'
export const ROUTE_REGION = 'route-models-region'

/** Group headings — the only strings the picker shows as a section title. */
export const ROUTE_LABELS = {
  [ROUTE_MAIN]: 'Route Models',
  [ROUTE_REGION]: 'Route Models · region-limited',
}

const STYLE_FOR_WIRE = { chat: 'chat', responses: 'flat', messages: 'claude' }

// One process-level flag, not per-turn: the first id-less turn that lands on the
// reserved "global" session is what the user needs to hear about, not every
// title generation or summary that follows it.
let globalSessionWarned = false

export class FreeModelAdapter {
  /**
   * @param {object} dependencies
   * @param {() => {catalog: Array<object>, membership: Record<string, string[]>, settings: object, attributionUserAgent: string}} dependencies.state
   * @param {(ref: object) => string | undefined} [dependencies.resolveImage]
   * @param {(record: object) => void} dependencies.recordUsage
   * @param {(record: object) => void} [dependencies.recordTurn]
   * @param {(message: string) => void} [dependencies.warn]
   * @param {{complete: (request: object, onChunk: Function) => Promise<object>}} [dependencies.subscriptionRuntime]
   */
  constructor(dependencies) {
    this.deps = dependencies
  }

  providerInfo(provider) {
    return { id: provider, name: ROUTE_LABELS[provider] ?? provider }
  }

  /**
   * A fully resolved policy, not a configuration fragment.
   *
   * Both the 0.1.5 and 0.1.7 kernels store this object verbatim instead of
   * running it through their policy resolver, and the backoff scheduler reads the
   * delay fields off the top level. Reporting them nested under `backoff` makes
   * every scheduled delay `NaN`, which the durable session log then rejects —
   * turning a recoverable transient failure into an aborted turn.
   */
  providerRetryPolicy() {
    return Object.freeze({
      mode: 'normal',
      maxRetries: 2,
      // A regional refusal is a property of the egress, not a transient fault;
      // retrying it only spends quota. It is deliberately absent here. So is
      // RATE_LIMIT: this lane's 429 carries a *growing* retry-after, and the two
      // automatic retries turned every quota wall into three walls — the same
      // turn, paid thrice, arriving later (issue #13).
      retryableCodes: Object.freeze(['EMPTY_RESPONSE', 'SERVER', 'TIMEOUT', 'TRANSPORT']),
      initialDelayMs: 700,
      maxDelayMs: 8000,
      jitterRatio: 0.2,
    })
  }

  /**
   * Resolve provider-side request-image pricing for one exact model route.
   *
   * 宿主 spill-policy 遇到 undefined 会放弃整条含图结果的落盘（issue #151）。
   * 免费出口没有统一视觉计价协议，提供同步估算以支持预算与落盘。
   *
   * Must stay synchronous: the token meter resolves it per measurement, with no
   * I/O window (issue #42).
   *
   * @param {string} _provider - a route passed to `registerAdapter()` for this instance.
   * @param {string} _model - exact model id passed to GenerateOptions.model.
   * @returns {typeof FALLBACK_IMAGE_PRICING} 视觉 Token 估算，不是厂商真实消耗。
   */
  imageRequestPricing(_provider, _model) {
    return FALLBACK_IMAGE_PRICING
  }

  /** Models this route advertises right now. */
  async listModels(provider) {
    const state = this.deps.state()
    const ids = new Set(state.membership[provider] ?? [])
    return state.catalog
      .filter(entry => ids.has(entry.id))
      .map(entry => ({
        provider,
        id: entry.id,
        name: entry.name,
        description: describe(entry, state.settings),
        inputModalities: entry.vision ? ['text', 'image'] : ['text'],
      }))
  }

  async resolveModel(provider, model) {
    const state = this.deps.state()
    const entry = state.catalog.find(candidate => candidate.id === baseModelId(model))
    if (entry === undefined) {
      return {
        provider,
        id: baseModelId(model),
        name: baseModelId(model),
        context: { contextWindow: 131072 },
        defaultMaxTokens: 8192,
      }
    }
    const ceiling = Math.min(entry.maxOutput, state.settings.defaultMaxTokens ?? 32768)
    const efforts = effortsFor(entry, undefined, state.settings.defaultMaxTokens)
    return {
      provider,
      id: entry.id,
      name: entry.name,
      inputModalities: entry.vision ? ['text', 'image'] : ['text'],
      context: { contextWindow: entry.contextWindow },
      defaultMaxTokens: ceiling,
      ...efforts === undefined ? {} : { reasoning: { efforts, defaultEffort: defaultEffortFor(entry) } },
    }
  }

  /**
   * Bind model metadata and the dispatch closure to one state snapshot, so a
   * catalog refresh arriving mid-turn cannot mix one generation's capacities
   * with another's endpoint table.
   */
  async prepareCall(provider, model) {
    const snapshot = this.deps.state()
    const entry = snapshot.catalog.find(candidate => candidate.id === baseModelId(model)) ?? null
    return {
      model: await this.resolveModel(provider, model),
      stream: options => this.stream(options, entry, snapshot),
    }
  }

  /**
   * @param {object} options - GenerateOptions
   * @param {object|null} pinned - catalog row frozen by `prepareCall`, if any
   * @param {object} [snapshot] - state generation frozen by `prepareCall`
   */
  stream(options, pinned, snapshot = this.deps.state()) {
    const controller = new AbortController()
    const onAbort = () => controller.abort(options.signal?.reason)
    if (options.signal?.aborted === true) onAbort()
    else options.signal?.addEventListener('abort', onAbort, { once: true })
    const iterator = this.runStream({ ...options, signal: controller.signal }, pinned, snapshot)
    const cleanup = () => options.signal?.removeEventListener('abort', onAbort)
    const step = async (method, value) => {
      try {
        const row = await iterator[method](value)
        if (row.done) cleanup()
        return row
      } catch (error) {
        cleanup()
        throw error
      }
    }
    // 原生生成器把 return 排在 pending next 后；先取消请求才能立即退出。
    return {
      [Symbol.asyncIterator]() { return this },
      next: value => step('next', value),
      return: value => { controller.abort(); cleanup(); return step('return', value) },
      throw: error => { controller.abort(error); cleanup(); return step('throw', error) },
    }
  }

  /**
   * One turn: a single model.
   *
   * Every catalog row is a subscription row; a row that is not fails the turn as
   * a configuration state instead of dialing an endpoint that no longer exists.
   */
  async * runStream(options, pinned, snapshot) {
    const modelId = baseModelId(options.model)
    const entry = pinned ?? snapshot.catalog.find(candidate => candidate.id === modelId) ?? null
    yield * this.runSingle(options, entry, snapshot, {})
  }

  /**
   * One model's turn.
   *
   * @param {object} [plan] - `{ turnModel?, recordTurn?, allowAdvance? }`.
   *   `turnModel` re-attributes the logical turn; `recordTurn: false` leaves the
   *   turn record to the caller; `allowAdvance` makes a pre-output failure report
   *   itself as advanceable instead of ending the turn outright.
   * @returns the turn's own summary.
   */
  async * runSingle(options, entry, snapshot, plan = {}) {
    const settings = snapshot.settings ?? {}
    const started = Date.now()
    const turnModel = plan.turnModel ?? baseModelId(options.model)
    const recordRejectedTurn = () => {
      if (plan.recordTurn === false) return
      this.deps.recordTurn?.({
        at: started,
        model: turnModel,
        ok: false,
        recovered: false,
        attempts: 0,
        origin: 'harness',
      })
    }

    if (settings.enabled === false) {
      recordRejectedTurn()
      yield { type: 'finish', reason: { kind: 'error', failure: { message: 'Route Models is switched off in its settings page', code: 'CONFIG_DISABLED' } } }
      return { advance: false, verdict: null, ok: false }
    }
    if (entry === null) {
      recordRejectedTurn()
      yield { type: 'finish', reason: { kind: 'error', failure: { message: `Route Models does not serve "${options.model}" on this egress`, code: CODE.server } } }
      return { advance: false, verdict: null, ok: false }
    }
    if (isSubscriptionEntry(entry)) return yield * this.runSubscription({
      ...options, maxTokens: Math.min(options.maxTokens ?? settings.defaultMaxTokens ?? entry.maxOutput, entry.maxOutput),
    }, entry, plan)

    // Every row this adapter dials is a subscription row, handled above. A row
    // that reached here anyway — a stale catalog persisted by an older build —
    // fails the turn as a configuration state, without a network attempt.
    recordRejectedTurn()
    yield { type: 'finish', reason: { kind: 'error', failure: { message: `Route Models no longer serves "${entry.id}"`, code: 'LANE_LOCKED' } } }
    return { advance: false, verdict: null, ok: false }
  }

  /** The subscription helper owns physical usage; the caller owns the turn. */
  async * runSubscription(options, entry, plan) {
    let answered = false
    let terminal = false
    let ending
    let stream
    const blocks = createBlockTracker()
    try {
      const request = {
        ...options, model: entry.id,
        resolveImage: this.deps.resolveImage,
        toolChoice: subscriptionToolChoice(options.toolChoice, options.tools),
        maxTokens: Math.min(options.maxTokens ?? entry.maxOutput, entry.maxOutput),
        messages: repairToolPairing(options.messages ?? []),
        // A combo chain records one logical turn for the whole chain; letting
        // the member record its own would count that turn twice.
        recordTurn: plan.recordTurn !== false,
      }
      stream = subscriptionChunks(this.deps.subscriptionRuntime, request)
      while (true) {
        const row = await stream.next()
        if (row.done) {
          if (row.value?.error) throw Object.assign(new Error(row.value.error), row.value.failure)
          break
        }
        const chunk = row.value
        if (chunk.type === 'finish') {
          // Wait for complete() to settle before certifying a successful turn.
          ending = chunk
          terminal = true
          continue
        }
        if (commitsAnswer(chunk)) answered = true
        blocks.accept(chunk)
        yield chunk
      }
      if (!terminal) throw new UpstreamError('Subscription stream ended before completion', CODE.transport)
      if (ending.reason?.kind === 'error' || ending.reason?.kind === 'aborted') {
        throw Object.assign(new Error(ending.reason.failure?.message ?? 'Subscription completion failed'), ending.reason.failure, {
          code: ending.reason.kind === 'aborted' ? CODE.aborted : ending.reason.failure?.code,
        })
      }
      yield ending
      return { advance: false, verdict: null, ok: true, recovered: false }
    } catch (error) {
      const aborted = options.signal?.aborted === true || error?.code === CODE.aborted
      const failure = toFailure({
        message: error?.message ?? 'Subscription completion failed',
        code: error?.code,
        status: error?.status ?? error?.statusCode,
      })
      const verdict = aborted ? null : classifyFailure(failure)
      for (const chunk of blocks.close()) yield chunk
      yield { type: 'finish', reason: { kind: aborted ? 'aborted' : 'error', failure } }
      return {
        ok: false,
        advance: plan.allowAdvance === true && !aborted && !answered
          && (shouldAdvance(verdict) || ['DISABLED', 'NOT_FOUND'].includes(failure.code)),
        verdict,
      }
    } finally {
      await stream?.return()
    }
  }
}

/** Validate subscription-only restrictions before account resolution or dispatch. */
function subscriptionToolChoice(value, tools) {
  if (value === undefined) return undefined
  const names = new Set((Array.isArray(tools) ? tools : []).map(tool => tool?.name ?? tool?.function?.name).filter(name => typeof name === 'string'))
  const named = value !== null && typeof value === 'object' && !Array.isArray(value)
    && ((value.type === 'function' && (value.function?.name ?? value.name)) || (value.type === 'tool' && value.name)
      || (value.type === undefined && value.name))
  const validName = typeof named === 'string' && named.length > 0 && names.has(named)
  if (value === 'auto' || value === 'none') return value
  if ((value === 'required' || value === 'any') && names.size > 0) return value
  if (validName) return { type: 'function', function: { name: named } }
  throw new UpstreamError('Invalid subscription tool choice', 'INVALID_INPUT', { status: 400 })
}

function buildPayload(wire, modelId, messages, options, budget, resolveImage, warnings) {
  if (wire === 'responses') {
    const input = toResponseInput(messages, resolveImage, warnings)
    return {
      model: modelId,
      input: input.length > 0 ? input : [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: '...' }] }],
      stream: true,
      store: false,
      max_output_tokens: budget,
    }
  }
  if (wire === 'messages') {
    const shaped = toClaudeMessages(messages, resolveImage, warnings)
    return {
      model: modelId,
      messages: shaped.messages,
      stream: true,
      max_tokens: budget,
      ...shaped.system === undefined ? {} : { system: shaped.system },
    }
  }
  const chat = toChatMessages(messages, resolveImage, warnings)
  return {
    model: modelId,
    messages: typeof options.system === 'string' && options.system !== ''
      ? [{ role: 'system', content: options.system }, ...chat]
      : chat,
    stream: true,
    max_tokens: budget,
  }
}

/**
 * Shape one thrown error into the harness's `LlmFailure` vocabulary.
 *
 * The harness writes this object straight into a durable session event, and that
 * log rejects anything that does not survive a lossless JSON round trip — an
 * Error instance, a `NaN`, an explicit `undefined` field. A rejected append
 * aborts the whole turn, so a malformed failure is strictly worse than a sparse
 * one: only the whitelisted fields are carried, each validated, and each dropped
 * rather than emitted in a degraded form.
 */
function toFailure(error) {
  const message = typeof error?.message === 'string' && error.message.length > 0
    ? error.message
    : String(error ?? 'Route Models request failed')
  const code = typeof error?.code === 'string' && error.code.length > 0 ? error.code : CODE.transport
  const status = error?.status
  const retryAfter = error?.providerRetryAfterMs
  return {
    message,
    code,
    ...Number.isInteger(status) && status >= 100 && status <= 599 ? { status } : {},
    ...Number.isFinite(retryAfter) && retryAfter > 0 ? { providerRetryAfterMs: Math.trunc(retryAfter) } : {},
  }
}

/**
 * Which wire serves one catalog row.
 *
 * A subscription row carries the wire its account speaks.
 */
function wireOf(entry) {
  if (isSubscriptionEntry(entry)) return entry.wire ?? 'chat'
  return 'chat'
}

/**
 * Does this chunk carry an answer the caller would have to un-see?
 *
 * A combo may only abandon a candidate while the answer is still entirely
 * inside its own buffer. Reasoning deltas are excluded on purpose: thinking is
 * not the answer, and "thought for a minute, then hit a quota wall" is the
 * most valuable failure to fail over — the held thinking is dropped with the
 * rest of the discarded attempt, so the caller never learns it happened. A
 * `block-end` for a reasoning block is the tail of that same reasoning stream
 * (`closeAll` emits it when the SSE loop ends), so it does not commit either;
 * letting it commit would pin the chain one chunk before the failure it
 * exists to survive. Text commits only when it carries visible content, the
 * same bar `sawAnswer` uses, so whitespace noise cannot pin a chain either.
 */
function commitsAnswer(chunk) {
  if (chunk === null || typeof chunk !== 'object') return false
  if (chunk.type === 'text-delta') return typeof chunk.text === 'string' && chunk.text.trim() !== ''
  if (chunk.type === 'tool-call-delta') return true
  if (chunk.type !== 'block-end') return false
  if (chunk.block?.type === 'reasoning') return false
  if (chunk.block?.type === 'text') return typeof chunk.block.text === 'string' && chunk.block.text.trim() !== ''
  return true
}

/** What the token savers measured for one dispatched body, as usage-record fields. */
function savingsFields(report) {
  if (report === null || report === undefined) return {}
  const saved = Number(report.saved) || 0
  const promptInjected = report.prompt?.injected === true
  if (saved === 0 && promptInjected !== true) return {}
  return {
    savings: {
      saved,
      bytesBefore: Number(report.bytesBefore) || 0,
      // Carried alongside the other two, not derived from them later: the panel
      // shows "before → after", and an after of 0 beside a before of 2599 reads
      // as "the body became empty" rather than "this field was never recorded".
      bytesAfter: Number(report.bytesAfter) || 0,
      blocks: Array.isArray(report.rtk?.hits) ? report.rtk.hits.length : 0,
      ...promptInjected ? { prompt: report.prompt.families ?? [] } : {},
    },
  }
}

/**
 * The `/model` popup's detail line. The composer renders only the model name, so
 * the capacities that matter for choosing a model — modality, window, whether an
 * effort menu exists — have to fit here.
 *
 * A model that cannot switch its thinking off names the shared ceiling outright:
 * on that lane the rung is not only the answer's budget, and a picker that
 * implied otherwise is how "why is it cut off at 8K when my ceiling is 32K" gets
 * asked.
 */
function describe(entry, settings) {
  const parts = [entry.vision ? 'vision + text input' : 'text input', `${Math.round(entry.contextWindow / 1024)}K context`]
  if (entry.reasoning === true) {
    // A declared menu is the model's own level list on the wire — naming the
    // levels is the honest detail line; "budget" would describe the free lane's
    // ladder, which is exactly what a menu model does not use.
    if (Array.isArray(entry.efforts) && entry.efforts.length > 0) {
      parts.push(`thinking levels: ${entry.efforts.join(' / ')}`)
    } else {
      const rung = Math.round(budgetFor(DEFAULT_LEVEL, entry, undefined, settings?.defaultMaxTokens) / 1024)
      parts.push(entry.canDisableThinking === false
        ? `thinking always on · ${rung}K default ceiling, shared with the answer`
        : 'tunable thinking budget')
    }
  }
  return parts.join(' · ')
}
