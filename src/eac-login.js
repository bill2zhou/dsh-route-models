/**
 * REMOVED — the EAC co-paid lane's GitHub login/star authorization poller was
 * deleted from the plugin backend.
 *
 * Inert stub: the factory returns a poller whose every hop reports
 * `{ error: 'lane-removed' }`, so a consumer that has not been updated yet
 * still loads and fails plainly instead of crashing on a missing import. The
 * plugin no longer imports it. Finish with `git rm src/eac-login.js` plus the
 * package.json `files` entry.
 */

const GONE = { error: 'lane-removed' }

export function createEacLoginPoller() {
  return {
    prepare: async () => ({ ...GONE }),
    poll: async () => ({ ...GONE }),
    cancel: () => ({ ...GONE }),
    reset: () => {},
  }
}
