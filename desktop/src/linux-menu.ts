// Linux: Startmenü-Eintrag für das AppImage.
// .deb und .rpm tragen MixMarket bei der Installation selbst ins Startmenü ein. Ein AppImage ist nur eine
// Datei; deshalb legt MixMarket beim Start einen Eintrag für den angemeldeten Benutzer an (auf dem
// Desktop nichts). Wechselt man später zu .deb oder .rpm, wird dieser Eintrag wieder entfernt.
import { app } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { log } from './server'
import { text } from './texts'

// Kennzeichen in der Datei: nur selbst angelegte Einträge werden geändert oder entfernt
const MARKER = 'X-MixMarket-AppImage=true'

function entryFile(): string {
  const base = process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share')
  return join(base, 'applications', 'mixmarket.desktop')
}

export function syncLinuxMenuEntry(iconSource: string): void {
  if (process.platform !== 'linux' || !app.isPackaged) return
  const file = entryFile()
  const ours = existsSync(file) && readFileSync(file, 'utf8').includes(MARKER)
  const appImage = process.env.APPIMAGE
  try {
    // Kein AppImage (sondern .deb oder .rpm): eigenen alten Eintrag entfernen, damit er den neuen nicht verdeckt
    if (!appImage) {
      if (ours) {
        rmSync(file, { force: true })
        log(`Alter AppImage-Eintrag im Startmenü entfernt: ${file}`)
      }
      return
    }
    // Einen fremden Eintrag gleichen Namens nicht überschreiben
    if (existsSync(file) && !ours) return
    const icon = join(app.getPath('userData'), 'mixmarket-icon.png')
    copyFileSync(iconSource, icon)
    const quoted = `"${appImage.replace(/(["`$\\])/g, '\\$1')}"`
    const content = [
      '[Desktop Entry]',
      'Type=Application',
      'Name=MixMarket',
      `Comment=${text('appComment')}`,
      `Exec=${quoted} %U`,
      `TryExec=${appImage}`,
      `Icon=${icon}`,
      'Terminal=false',
      'Categories=Office;',
      'StartupWMClass=mixmarket',
      MARKER,
      '',
    ].join('\n')
    if (ours && readFileSync(file, 'utf8') === content) return
    mkdirSync(join(file, '..'), { recursive: true })
    writeFileSync(file, content)
    log(`Startmenü-Eintrag für das AppImage angelegt: ${file}`)
  } catch (error) {
    log(`Startmenü-Eintrag konnte nicht angelegt werden: ${error instanceof Error ? error.message : String(error)}`)
  }
}
