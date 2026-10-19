// Suchpfad für Claude Code und Codex.
// Aus dem Startmenü oder Dock gestartet, bekommt ein Programm unter macOS und Linux nur einen knappen
// Suchpfad ohne die Ordner, in denen Claude Code und Codex meist liegen. Deshalb wird der Suchpfad der
// Anmelde-Shell des Nutzers übernommen und um die üblichen Installationsordner ergänzt.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { delimiter, join } from 'node:path'

// Suchpfad, den die Anmelde-Shell setzt (z. B. aus .profile, .zshrc); null, wenn das nicht gelingt
function loginShellPath(): string | null {
  const shell = process.env.SHELL || (process.platform === 'darwin' ? '/bin/zsh' : '/bin/bash')
  try {
    const result = spawnSync(shell, ['-ilc', 'printf "__MMPATH__%s__MMPATH__" "$PATH"'], {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const match = /__MMPATH__(.*?)__MMPATH__/s.exec(result.stdout ?? '')
    return match?.[1]?.trim() || null
  } catch {
    return null
  }
}

// Übliche Installationsordner von Claude Code, Codex (npm) und Node-Werkzeugen
function knownFolders(): string[] {
  const home = homedir()
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA ?? join(home, 'AppData', 'Roaming')
    return [join(home, '.local', 'bin'), join(appData, 'npm')]
  }
  return [
    join(home, '.local', 'bin'),
    join(home, '.claude', 'local'),
    join(home, '.npm-global', 'bin'),
    join(home, '.volta', 'bin'),
    join(home, '.bun', 'bin'),
    '/usr/local/bin',
    '/opt/homebrew/bin',
  ]
}

// Vollständigen Suchpfad bilden: bisheriger Pfad, Pfad der Anmelde-Shell, bekannte Ordner (ohne Doppelte)
export function completeSearchPath(): string {
  const current = (process.env.PATH ?? '').split(delimiter)
  const shell = process.platform === 'win32' ? [] : (loginShellPath() ?? '').split(delimiter)
  const extra = knownFolders().filter((folder) => existsSync(folder))
  const seen = new Set<string>()
  return [...current, ...shell, ...extra]
    .filter((folder) => {
      if (!folder || seen.has(folder)) return false
      seen.add(folder)
      return true
    })
    .join(delimiter)
}
