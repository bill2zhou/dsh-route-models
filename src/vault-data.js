/**
 * REMOVED — the EAC co-paid lane's seal material was deleted from the plugin
 * backend. This file is an inert stub: the shards and the seal are gone, and
 * nothing in the plugin imports it.
 *
 * The sandboxed session that performed the removal could not unlink a
 * pre-existing file, so the removal needs `git rm src/vault-data.js` plus the
 * package.json `files` entry dropped.
 *
 * @module src/vault-data.js
 */
export const LANE_SHARDS = []
export const LANE_SEAL = ''
