/**
 * REMOVED — the Kilo free pool channel was deleted from the plugin backend.
 *
 * Inert stub: the listing never resolves and the poster rejects, so a consumer
 * that has not been updated yet still loads. Nothing here opens a socket. The
 * plugin no longer imports any of it. Finish with `git rm src/kilo.js` plus the
 * package.json `files` entry.
 *
 * @module src/kilo.js
 */

const REMOVED = () => Object.assign(new Error('the Kilo free pool was removed from this plugin'), { code: 'LANE_REMOVED' })

export const KILO_BASE = ''

export async function fetchKiloListing() { throw REMOVED() }
export async function postKiloStreamed() { throw REMOVED() }
