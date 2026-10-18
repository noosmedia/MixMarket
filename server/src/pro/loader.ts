// Lädt das Pro-Paket beim Start des Servers.
// Im Betrieb kommt es signiert vom Lizenzserver (license.ts). Entwicklungsmodus: MIXMARKET_PRO_DIR zeigt
// auf einen Ordner mit manifest.json, server.mjs und web.js (Ausgabe des Pro-Builds), ohne Lizenz.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { logger } from '../utils/logger.js'
import { proCore } from './api.js'
import { activatePro, type ProFeature } from './host.js'
import { startLicense } from './license.js'

export async function startPro(): Promise<void> {
  const dir = process.env.MIXMARKET_PRO_DIR
  if (!dir) {
    await startLicense()
    return
  }
  try {
    const manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')) as { version: string; features: ProFeature[] }
    const serverCode = await readFile(join(dir, 'server.mjs'), 'utf8')
    const webCode = await readFile(join(dir, 'web.js'), 'utf8').catch(() => null)
    await activatePro({ version: manifest.version, features: manifest.features, serverCode, webCode }, proCore)
  } catch (error) {
    logger.error('MixMarket Pro konnte nicht geladen werden', error)
  }
}
