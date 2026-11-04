/**
 * Egress watching.
 *
 * This module used to own availability probing for the anonymous free lane:
 * the gateway did not disclose which models an egress could use, so the answer
 * came from asking with the smallest request that could produce a verdict.
 * That lane (and `probeModel`/`probeCatalog` with it) was removed from the
 * plugin, so no lane left here dials the gateway this probe spoke to.
 *
 * What stays is the egress half, which the kept features still need: the
 * answer to "which models exist for the user" and the outlet's own node
 * readings are properties of the network path, and turning a VPN on changes
 * them live. The cheapest reliable signal is the public address the machine
 * presents to the internet.
 *
 * @module src/probe.js
 */

import { egressFetch } from './egress.js'

/** Public-echo sources, tried in order; any one answering is enough. */
const ECHO_SOURCES = [
  { url: 'https://api.ipify.org?format=json', pick: payload => payload?.ip },
  { url: 'https://ipinfo.io/json', pick: payload => payload?.ip, extra: payload => payload?.country },
  { url: 'https://ipapi.co/json/', pick: payload => payload?.ip, extra: payload => payload?.country_code },
]

/** Verdicts the manual text tests record, and how each maps to picker membership. */
export const STATE = {
  available: 'available',
  regionBlocked: 'region-blocked',
  unavailable: 'unavailable',
  throttled: 'throttled',
  unknown: 'unknown',
}

/**
 * Resolve the public address the gateway will see, plus its country when an echo
 * discloses one. Fail-open: an absent answer simply means "no egress signal".
 */
export async function detectEgress({ signal, timeoutMs = 8000 } = {}) {
  for (const source of ECHO_SOURCES) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    timer.unref?.()
    const relayAbort = () => controller.abort()
    signal?.addEventListener('abort', relayAbort, { once: true })
    try {
      const response = await egressFetch(source.url, { signal: controller.signal, redirect: 'error', headers: { accept: 'application/json' } })
      if (!response.ok) continue
      const payload = await response.json()
      const ip = source.pick(payload)
      if (typeof ip !== 'string' || ip === '') continue
      const country = source.extra?.(payload)
      return { ip, ...country === undefined ? {} : { country: String(country) } }
    } catch {
      // try the next echo
    } finally {
      // The deadline has to outlive the response head: response.json() is where
      // a slow echo used to stall past the 8s budget and freeze the probe loop.
      // And the caller's signal only borrowed this listener for this attempt.
      clearTimeout(timer)
      signal?.removeEventListener('abort', relayAbort)
    }
  }
  return undefined
}
