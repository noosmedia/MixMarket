// KI-Anbieter für die Bewertung von Firmen. Beide laufen über die auf diesem
// Rechner installierten und angemeldeten Programme und damit über das Abo des
// Nutzers, ohne API-Schlüssel:
// - Claude-Abo über Claude Code (`claude -p`)
// - ChatGPT-Abo über Codex (`codex exec`)
//
// Sicherheit: Die Eingaben enthalten Text fremder Webseiten. Darin können
// versteckte Anweisungen stehen. Deshalb bekommt die KI keine Werkzeuge:
// - Claude Code: alle Werkzeuge aus (--tools ""), keine MCP-Server, keine
//   Einstellungen und Hooks des Nutzers, leerer Arbeitsordner
// - Codex: Befehle, Code-Modus, Unteragenten, Plugins, Browser, Bilder,
//   Websuche und weitere Zusatzfunktionen aus, nur lesende Umgebung,
//   leerer Arbeitsordner. Jeder Schritt wird überwacht; taucht etwas anderes
//   als Text auf, wird der Lauf sofort beendet und das Ergebnis verworfen.
//
// Weitere Anbieter (z. B. API-Schlüssel oder "Sign in with ChatGPT") lassen
// sich später als zusätzliche Einträge in AI_PROVIDERS ergänzen.
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { logger } from '../../utils/logger.js'

export type AiProviderKey = 'claude' | 'codex'

export interface AiCheckResult {
  ok: boolean
  message: string
}

export interface AiProvider {
  key: AiProviderKey
  // Verbindung prüfen: Programm vorhanden und angemeldet
  check(model?: string | null): Promise<AiCheckResult>
  // Text senden, Antworttext zurückgeben. schema beschreibt die erwartete JSON-Antwort.
  complete(prompt: string, options: { model?: string | null; schema?: object; timeoutMs?: number }): Promise<string>
}

const DEFAULT_TIMEOUT_MS = 240_000
const MAX_OUTPUT_BYTES = 4_000_000

// Fehler mit verständlicher Meldung für die Oberfläche
export class AiError extends Error {
  constructor(
    message: string,
    readonly retryable = true,
  ) {
    super(message)
  }
}

// KI-Pause: das Abo ist bis zur eingestellten Grenze ausgelastet. Aufträge bleiben liegen und laufen später weiter.
export class AiPausedError extends AiError {
  constructor(
    message: string,
    readonly until: string | null,
  ) {
    super(message, false)
  }
}

// Umgebung für die KI-Programme: Suchpfad, Benutzerordner, Sprache, Proxy- und Zertifikatsangaben
// sowie die Konfigurationsordner von Claude Code und Codex
// Unter Windows schreiben sich die Namen anders (z. B. "Path", "SystemRoot"); dort zählt die Großschreibung nicht,
// und dazu kommen die Angaben, ohne die Windows-Programme nicht starten (PATHEXT, COMSPEC, Programmordner)
const PASS_ENV = /^(PATH|HOME|USER|LOGNAME|SHELL|LANG|LANGUAGE|LC_[A-Z]+|TZ|TMPDIR|TEMP|TMP|SYSTEMROOT|APPDATA|LOCALAPPDATA|USERPROFILE|HOMEDRIVE|HOMEPATH|XDG_[A-Z_]+|CLAUDE_CONFIG_DIR|CODEX_HOME|HTTPS?_PROXY|https?_proxy|NO_PROXY|no_proxy|NODE_EXTRA_CA_CERTS|SSL_CERT_FILE|SSL_CERT_DIR)$/
const PASS_ENV_WINDOWS = /^(PATHEXT|COMSPEC|WINDIR|PROGRAMFILES|PROGRAMFILES\(X86\)|PROGRAMW6432|PROGRAMDATA|CLAUDE_CODE_GIT_BASH_PATH)$/
const IS_WINDOWS = process.platform === 'win32'
function aiEnvironment(): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = {}
  for (const [key, value] of Object.entries(process.env)) {
    const name = IS_WINDOWS ? key.toUpperCase() : key
    if (PASS_ENV.test(name) || (IS_WINDOWS && PASS_ENV_WINDOWS.test(name))) out[key] = value
  }
  return out
}

// Windows: Programm im Suchpfad finden. Claude Code liegt meist als .exe vor, über npm installierte
// Programme (z. B. Codex) als .cmd. Eine .cmd startet Windows nur über die Eingabeaufforderung.
// Auf anderen Systemen sucht spawn selbst im Suchpfad.
function resolveCommand(command: string): { file: string; viaShell: boolean } {
  if (!IS_WINDOWS) return { file: command, viaShell: false }
  const extensions = (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD')
    .split(';')
    .map((ext) => ext.trim().toLowerCase())
    .filter((ext) => ['.com', '.exe', '.bat', '.cmd'].includes(ext))
  for (const dir of (process.env.PATH || '').split(';')) {
    const folder = dir.trim().replace(/^"|"$/g, '')
    if (!folder) continue
    for (const ext of extensions) {
      const file = join(folder, command + ext)
      if (existsSync(file)) return { file, viaShell: ext === '.cmd' || ext === '.bat' }
    }
  }
  // Nicht gefunden: spawn meldet ENOENT, das wird als "nicht installiert" angezeigt
  return { file: command, viaShell: false }
}

// Für die Eingabeaufforderung: jedes Argument in Anführungszeichen, innere Anführungszeichen verdoppelt
// (auch leere Argumente wie bei --tools "" bleiben so erhalten)
function cmdQuote(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

interface RunResult {
  code: number | null
  stdout: string
  stderr: string
}

// Programm starten, Eingabe über stdin, Zeitlimit, optionale Überwachung jeder Ausgabezeile
async function run(
  command: string,
  args: string[],
  input: string,
  options: { cwd: string; timeoutMs: number; onLine?: (line: string) => string | null },
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    let child
    const target = resolveCommand(command)
    try {
      child = spawn(target.viaShell ? cmdQuote(target.file) : target.file, target.viaShell ? args.map(cmdQuote) : args, {
        cwd: options.cwd,
        // Nur die nötigen Umgebungsvariablen weitergeben, keine Geheimnisse von MixMarket (JWT, SMTP usw.)
        env: { ...aiEnvironment(), NO_COLOR: '1' },
        stdio: ['pipe', 'pipe', 'pipe'],
        // Eigene Prozessgruppe, damit alle Unterprozesse beendet werden können. Unter Windows würde das
        // ein sichtbares Konsolenfenster öffnen; dort beendet taskkill den ganzen Prozessbaum.
        detached: !IS_WINDOWS,
        windowsHide: true,
        shell: target.viaShell,
      })
    } catch (error) {
      reject(error)
      return
    }
    let stdout = ''
    let stderr = ''
    let buffered = ''
    let aborted: string | null = null

    // Ganze Prozessgruppe hart beenden (Windows: Prozessbaum über taskkill)
    const killAll = () => {
      if (IS_WINDOWS && child.pid) {
        spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }).on('error', () => child.kill())
        return
      }
      try {
        if (child.pid) process.kill(-child.pid, 'SIGKILL')
      } catch {
        child.kill('SIGKILL')
      }
    }
    const timer = setTimeout(() => {
      aborted = 'Zeitüberschreitung'
      killAll()
    }, options.timeoutMs)

    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8')
      if (stdout.length < MAX_OUTPUT_BYTES) stdout += text
      if (!options.onLine) return
      buffered += text
      let idx: number
      while ((idx = buffered.indexOf('\n')) >= 0) {
        const line = buffered.slice(0, idx)
        buffered = buffered.slice(idx + 1)
        const problem = options.onLine(line)
        if (problem && !aborted) {
          aborted = problem
          killAll()
        }
      }
    })
    child.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length < 20_000) stderr += chunk.toString('utf8')
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (aborted) reject(new AiError(aborted, aborted === 'Zeitüberschreitung'))
      else resolve({ code, stdout, stderr })
    })
    child.stdin.on('error', () => {
      // Programm hat die Eingabe vorzeitig geschlossen; Ergebnis kommt über close
    })
    child.stdin.end(input)
  })
}

// Leeren Arbeitsordner anlegen und danach wieder entfernen
async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'mixmarket-ki-'))
  try {
    return await fn(dir)
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined)
  }
}

// Fehlermeldung kürzen, ohne Zugangsdaten zu zeigen
function shortError(text: string): string {
  return text.replace(/(sk-|eyJ)[A-Za-z0-9._-]{10,}/g, '***').trim().split('\n').slice(-3).join(' ').slice(0, 300)
}

// --- Claude-Abo über Claude Code ---

const claude: AiProvider = {
  key: 'claude',
  async check(model) {
    try {
      const text = await this.complete('Antworte nur mit dem Wort OK.', { model, timeoutMs: 90_000 })
      return text.trim().toUpperCase().startsWith('OK')
        ? { ok: true, message: 'ok' }
        : { ok: false, message: `Unerwartete Antwort: ${text.slice(0, 80)}` }
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Claude Code nicht erreichbar' }
    }
  },
  async complete(prompt, options) {
    return withTempDir(async (dir) => {
      const args = [
        '-p',
        '--output-format', 'json',
        '--tools', '', // keinerlei Werkzeuge
        '--strict-mcp-config', // keine MCP-Server des Nutzers
        '--setting-sources', '', // keine Einstellungen und Hooks des Nutzers
        '--no-session-persistence',
      ]
      if (options.model) args.push('--model', options.model)
      let result: RunResult
      try {
        result = await run('claude', args, prompt, { cwd: dir, timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS })
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new AiError('Claude Code ist auf diesem Rechner nicht installiert', false)
        }
        throw error
      }
      // Antwort ist ein JSON-Objekt mit dem Ergebnistext
      let payload: { result?: string; is_error?: boolean; subtype?: string } | null = null
      try {
        payload = JSON.parse(result.stdout.trim())
      } catch {
        payload = null
      }
      if (result.code !== 0 || !payload || payload.is_error) {
        const detail = shortError(payload?.result || result.stderr || result.stdout)
        const auth = /log ?in|auth|unauthori|credential|subscription/i.test(detail)
        throw new AiError(
          auth ? 'Claude Code ist nicht angemeldet. Bitte einmal im Terminal "claude" starten und anmelden.' : `Claude Code: ${detail || 'unbekannter Fehler'}`,
          !auth,
        )
      }
      return payload.result ?? ''
    })
  },
}

// --- ChatGPT-Abo über Codex ---

// Zusatzfunktionen, die für reine Textantworten abgeschaltet werden
const CODEX_DISABLED_FEATURES = [
  'apps', 'auth_elicitation', 'browser_annotation_api', 'browser_use', 'browser_use_external',
  'browser_use_full_cdp_access', 'code_mode_host', 'computer_use', 'goals', 'hooks', 'image_generation',
  'in_app_browser', 'in_app_local_automation', 'memories', 'multi_agent', 'plugin_sharing', 'plugins',
  'remote_plugin', 'shell_snapshot', 'shell_tool', 'skill_mcp_dependency_install', 'skill_search',
  'sleep_tool', 'tool_call_mcp_elicitation', 'tool_suggest', 'unified_exec', 'unified_exec_tty',
  'view_image', 'workspace_dependencies', 'worktrees', 'write_stdin_approval',
]

// Erlaubte Ereignisse: nur Text, Gedankengang und der Hinweis, dass der Code-Modus gesperrt ist
function codexLineProblem(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  let event: { type?: string; item?: { type?: string; message?: string } }
  try {
    event = JSON.parse(trimmed)
  } catch {
    return null
  }
  const itemType = event.item?.type
  if (!itemType) return null
  if (itemType === 'agent_message' || itemType === 'reasoning') return null
  if (itemType === 'error' && /code mode/i.test(event.item?.message ?? '')) return null
  logger.warn(`Codex-Lauf abgebrochen: unerwarteter Schritt "${itemType}"`)
  return `Sicherheitsabbruch: Codex wollte ein Werkzeug benutzen (${itemType}). Das Ergebnis wurde verworfen.`
}

const codex: AiProvider = {
  key: 'codex',
  async check() {
    try {
      const result = await withTempDir((dir) => run('codex', ['login', 'status'], '', { cwd: dir, timeoutMs: 30_000 }))
      const text = `${result.stdout}\n${result.stderr}`
      if (/chatgpt/i.test(text) && result.code === 0) return { ok: true, message: 'ok' }
      if (/api key/i.test(text)) return { ok: false, message: 'Codex ist mit einem API-Schlüssel angemeldet, nicht mit dem ChatGPT-Abo' }
      return { ok: false, message: 'Codex ist nicht angemeldet. Bitte einmal im Terminal "codex login" ausführen.' }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { ok: false, message: 'Codex ist auf diesem Rechner nicht installiert' }
      return { ok: false, message: error instanceof Error ? error.message : 'Codex nicht erreichbar' }
    }
  },
  async complete(prompt, options) {
    return withTempDir(async (dir) => {
      const args = [
        'exec', '--json', '--ephemeral', '--skip-git-repo-check', '--ignore-user-config', '--ignore-rules',
        '-s', 'read-only', '-C', dir, '-c', 'web_search="disabled"',
      ]
      for (const feature of CODEX_DISABLED_FEATURES) args.push('--disable', feature)
      if (options.model) args.push('-m', options.model)
      if (options.schema) {
        // Codex verlangt die Antwortform als Datei
        const schemaPath = join(dir, 'antwort.schema.json')
        await writeFile(schemaPath, JSON.stringify(options.schema))
        args.push('--output-schema', schemaPath)
      }
      args.push('-')
      let result: RunResult
      try {
        result = await run('codex', args, prompt, {
          cwd: dir,
          timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
          onLine: codexLineProblem,
        })
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new AiError('Codex ist auf diesem Rechner nicht installiert', false)
        }
        throw error
      }
      // Letzte Textantwort aus den Ereignissen holen
      let answer = ''
      let failure = ''
      for (const line of result.stdout.split('\n')) {
        try {
          const event = JSON.parse(line) as { type?: string; item?: { type?: string; text?: string }; error?: { message?: string }; message?: string }
          if (event.item?.type === 'agent_message' && event.item.text) answer = event.item.text
          if (event.type === 'turn.failed' || event.type === 'error') failure = event.error?.message ?? event.message ?? 'Fehler'
        } catch {
          // keine JSON-Zeile
        }
      }
      if (failure || result.code !== 0 || !answer) {
        const detail = shortError(failure || result.stderr || result.stdout)
        const auth = /log ?in|auth|unauthori|401|credential/i.test(detail)
        const quota = /usage limit|rate limit|quota|429/i.test(detail)
        throw new AiError(
          auth
            ? 'Codex ist nicht angemeldet. Bitte einmal im Terminal "codex login" ausführen.'
            : quota
              ? 'Das Nutzungskontingent des ChatGPT-Abos ist erreicht. Bitte später erneut versuchen.'
              : `Codex: ${detail || 'keine Antwort'}`,
          !auth && !quota,
        )
      }
      return answer
    })
  },
}

export const AI_PROVIDERS: Record<AiProviderKey, AiProvider> = { claude, codex }

export function isAiProviderKey(value: unknown): value is AiProviderKey {
  return value === 'claude' || value === 'codex'
}
