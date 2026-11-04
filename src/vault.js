/**
 * REMOVED — the EAC co-paid lane's sealed credential store (host gate +
 * AES-256-GCM seal) was deleted from the plugin backend, together with
 * `vault-data.js` and `vault-anchor.js` (both already inert: no shards, no
 * seal, no anchor).
 *
 * This file is a stub that keeps the old export names so a consumer outside the
 * plugin backend (an out-of-scope script or the standalone app) still loads,
 * but the lane is permanently dark: `detectSealedHost`/`openSeal`/
 * `unlockSealedLane` answer "no lane" and the key derivation throws. No seal
 * material ships, so nothing could open even if a caller asked.
 *
 * The sandbox that performed the removal could not unlink pre-existing files;
 * finishing the job is `git rm src/vault.js src/vault-data.js src/vault-anchor.js`
 * plus dropping their package.json `files` entries.
 *
 * @module src/vault.js
 */

export const SEAL_AAD = 'ofm-eac-desktop/v1'
export const IV_BYTES = 12
export const TAG_BYTES = 16

/** The shell names the gate used to recognize, kept only as string values. */
export const FLAVOR_AIO = 'aio'
export const FLAVOR_HARNESS = 'harness'
export const FLAVOR_WEB = 'web'

/** The lane was removed: no host is ever recognized. */
export function detectSealedHost() { return null }

/** No seal material ships any more, so there is no key to derive. */
export function deriveSealKey() {
  throw Object.assign(new Error('the EAC co-paid lane was removed from this plugin'), { code: 'LANE_REMOVED' })
}

export function openSealWith(unmasked, packed) { return null }
export function openSealFrom(rows, sealB64) { return null }
export function openSeal() { return null }

/** Gate, then unlock — now always "no lane", which is what every caller already tolerates. */
export function unlockSealedLane() { return null }
