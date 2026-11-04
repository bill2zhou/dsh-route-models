/**
 * How the installed package got here.
 *
 * The self-updater is gone, but the distribution policy that keeps an
 * upgrade managed by the host (or by an integration pack) still needs to know
 * whether the files on disk belong to a package-manager store: those installs
 * must never be written by the plugin itself.
 */
import fs from 'node:fs'
import path from 'node:path'

/** Detect a plugin install whose package files still belong to a package-manager store. */
export function packageUsesHardLinks(pkgDir) {
  for (const rel of ['package.json', 'index.js', 'client.js']) {
    try { if (fs.statSync(path.join(pkgDir, rel)).nlink > 1) return true } catch { /* incomplete package: normal startup diagnostics handle it */ }
  }
  return false
}

/** Detect host rollback to a package version older than the code in memory. */
export function installationIsManaged(pkgDir) {
  return packageUsesHardLinks(pkgDir)
}
