/**
 * REMOVED — the EAC co-paid lane's per-user GitHub authorization token store
 * was deleted from the plugin backend.
 *
 * Inert stub: readers answer "no user" and writers reject, so a consumer that
 * has not been updated yet still loads. No file is read or written any more.
 * The plugin no longer imports it. Finish with `git rm src/eac-user.js` plus
 * dropping its package.json `files` entry.
 *
 * @module src/eac-user.js
 */

const REMOVED = () => Object.assign(new Error('the EAC co-paid lane was removed from this plugin'), { code: 'LANE_REMOVED' })

export const EAC_USER_FILE = 'eac-user.json'

export function eacUserPath() { throw REMOVED() }
export function readEacUser() { return null }
export function writeEacUser() { throw REMOVED() }
export function clearEacUser() { return false }
