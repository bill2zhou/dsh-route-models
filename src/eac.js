/**
 * REMOVED — the EAC co-paid lane was deleted from the plugin backend.
 *
 * This file is an inert stub: it exports the old names so a consumer that has
 * not been updated yet still loads, but every call rejects with a
 * `LANE_REMOVED` error and nothing here opens a socket, reads the vault, or
 * signs a request. The plugin's own code (index.js, src/adapter.js,
 * src/core/runtime.js) no longer imports any of it.
 *
 * The sandbox that performed the removal could not unlink a pre-existing
 * file; finishing the job is `git rm src/eac.js` plus dropping its
 * package.json `files` entry.
 *
 * @module src/eac.js
 */

const REMOVED = () => Object.assign(new Error('the EAC co-paid lane was removed from this plugin'), { code: 'LANE_REMOVED' })

/** Inert: no transport is wired any more. */
export const lane = { fetch: null, proxy: undefined }
export const laneUser = { token: undefined }

export async function directFetch() { throw REMOVED() }
export function signSealedRequest() { throw REMOVED() }
export async function fetchSealedListing() { throw REMOVED() }
export async function postSealedStreamed() { throw REMOVED() }
