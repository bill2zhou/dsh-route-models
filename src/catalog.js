/**
 * Model-id display helpers.
 *
 * This module used to be the catalog builder for three producers — the
 * anonymous free lane (`buildCatalog` over the upstream listing), the EAC
 * co-paid lane (`buildEacCatalog`) and the Kilo free pool
 * (`buildKiloCatalog`/`reviveKiloCatalog`). All three were removed from the
 * plugin, so the whole free-lane capability table, the `-free` id detection,
 * the listing parser and both channels' row builders went with them.
 *
 * What stays is the one thing a surviving lane actually calls:
 * {@link displayModelName}, the title-casing that keeps a raw upstream id out
 * of the picker.
 *
 * @module src/catalog.js
 */

import { baseModelId } from './upstream.js'

/** Human-facing display names, so a raw upstream id never reaches the picker. */
const DISPLAY_NAMES = {
  'mimo-v2.6-flash-free': 'MiMo V2.6 Flash',
  'mimo-v2.5-free': 'MiMo V2.5',
  'muse-spark-1.3-contributor-free': 'Muse Spark 1.3',
  'muse-spark-1.2-contributor-free': 'Muse Spark 1.2',
  'nemotron-3-ultra-free': 'Nemotron 3 Ultra',
  'nemotron-3.5-lightning-free': 'Nemotron 3.5 Lightning',
  'ling-3.0-flash-fin-free': 'Ling 3.0 Flash Fin',
  'space-bunny-free': 'Space Bunny',
  'union-alpha': 'Union Alpha',
  'deepseek-v4-flash-free': 'DeepSeek V4 Flash',
  'deepseek-v4.1-flash-free': 'DeepSeek V4.1 Flash',
  'glm-5.3-flash-free': 'GLM 5.3 Flash',
  'jev-1.13-free': 'Jev 1.13',
}

/** Title-case a bare upstream id into something a picker can show. */
export function displayModelName(modelId) {
  const base = baseModelId(modelId)
  const known = DISPLAY_NAMES[base]
  if (known !== undefined) return known
  const words = base
    .replace(/[-_.]+/g, ' ')
    .replace(/(\d)\s+/g, '$1 ')
    .trim()
    .split(' ')
    .map(word => (/^\d/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
  return words
}
