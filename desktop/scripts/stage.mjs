// Stellt den Inhalt des Programmpakets in desktop/stage zusammen:
//   main.js, preload.js, splash-preload.js   Programmhülle (aus desktop/src übersetzt)
//   static/                                  Startbildschirm und Symbol
//   server/                                  fertig übersetzter Server mit Datenbankaufbau (schema.prisma)
//   web/                                     fertig gebaute Oberfläche
//   node_modules/                            nur die Laufzeitpakete des Servers (genau die installierten Versionen)
// electron-builder packt diesen Ordner danach und passt native Module (SQLite) an Electron an.
// Aufruf: node scripts/stage.mjs [--skip-build] [--arch x64|arm64]   (ohne --arch: Architektur dieses Rechners)
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const desktop = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = resolve(desktop, '..')
const stage = join(desktop, 'stage')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const skipBuild = process.argv.includes('--skip-build')
const archIndex = process.argv.indexOf('--arch')
const arch = archIndex > 0 ? process.argv[archIndex + 1] : process.arch
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

// Befehl ausführen und bei Fehler mit vollständiger Ausgabe abbrechen
function run(command, args, cwd) {
  console.log(`> ${command} ${args.join(' ')}  (${cwd})`)
  execFileSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
}

// Genau die Version, die im Hauptprojekt installiert ist (so läuft im Paket derselbe Stand wie getestet)
function installedVersion(name) {
  const file = join(root, 'node_modules', name, 'package.json')
  if (!existsSync(file)) throw new Error(`Paket ${name} ist nicht installiert. Bitte zuerst im Hauptordner "npm install" ausführen.`)
  return readJson(file).version
}

// 1. Server und Oberfläche bauen (Prisma-Client erzeugen, TypeScript übersetzen, Vite)
if (!skipBuild) run(npm, ['run', 'build'], root)

// 2. Ordner neu anlegen; die installierten Pakete bleiben erhalten, wenn sich die Liste nicht geändert hat
const rootPkg = readJson(join(root, 'package.json'))
const serverPkg = readJson(join(root, 'server', 'package.json'))
const desktopPkg = readJson(join(desktop, 'package.json'))
for (const entry of ['server', 'web', 'static', 'main.js', 'preload.js', 'splash-preload.js', 'texts.js', 'environment.js', 'server.js', 'window.js', 'updater.js', 'linux-menu.js', 'i18n']) {
  rmSync(join(stage, entry), { recursive: true, force: true })
}
mkdirSync(stage, { recursive: true })

// 3. Server: übersetzter Code, Datenbankaufbau und Prisma-Einstellung
cpSync(join(root, 'server', 'dist'), join(stage, 'server', 'dist'), { recursive: true })
mkdirSync(join(stage, 'server', 'prisma'), { recursive: true })
cpSync(join(root, 'server', 'prisma', 'schema.prisma'), join(stage, 'server', 'prisma', 'schema.prisma'))
cpSync(join(root, 'server', 'prisma.config.ts'), join(stage, 'server', 'prisma.config.ts'))
writeFileSync(join(stage, 'server', 'package.json'), `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`)

// 4. Oberfläche
cpSync(join(root, 'web', 'dist'), join(stage, 'web'), { recursive: true })

// 5. Programmhülle übersetzen, Startbildschirm und Symbol
run(process.execPath, [join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', 'tsconfig.json', '--outDir', stage], desktop)
cpSync(join(desktop, 'static'), join(stage, 'static'), { recursive: true })
cpSync(join(desktop, 'assets', 'icon.png'), join(stage, 'static', 'icon.png'))

// 6. package.json des Pakets: Laufzeitpakete des Servers in den installierten Versionen, dazu das
//    Prisma-Werkzeug (richtet die Datenbank ein) und der Updater
const dependencies = {}
for (const name of Object.keys(serverPkg.dependencies)) dependencies[name] = installedVersion(name)
dependencies.prisma = installedVersion('prisma')
dependencies['electron-updater'] = desktopPkg.dependencies['electron-updater']
const appPkg = {
  name: 'mixmarket',
  productName: 'MixMarket',
  version: rootPkg.version,
  description: 'Firmen finden und gezielt anschreiben',
  author: { name: 'MixMarket', email: 'mixmarket@users.noreply.github.com' },
  homepage: 'https://github.com/noosmedia/MixMarket',
  license: rootPkg.license,
  private: true,
  main: 'main.js',
  // Linux: verbindet das Fenster mit dem Startmenü-Eintrag (Symbol und Gruppierung in der Taskleiste)
  desktopName: 'mixmarket.desktop',
  dependencies,
}
const pkgFile = join(stage, 'package.json')
const previous = existsSync(pkgFile) ? readFileSync(pkgFile, 'utf8') : ''
const next = `${JSON.stringify(appPkg, null, 2)}\n`
writeFileSync(pkgFile, next)
if (desktopPkg.version !== rootPkg.version) console.warn(`Hinweis: desktop/package.json hat ${desktopPkg.version}, MixMarket ${rootPkg.version}`)

// 7. Laufzeitpakete installieren (nur wenn sich die Liste geändert hat oder sie fehlen)
const depsChanged = JSON.stringify(readJsonSafe(previous)?.dependencies) !== JSON.stringify(dependencies)
if (depsChanged || !existsSync(join(stage, 'node_modules'))) {
  rmSync(join(stage, 'node_modules'), { recursive: true, force: true })
  rmSync(join(stage, 'package-lock.json'), { force: true })
  run(npm, ['install', '--omit=dev', '--no-audit', '--no-fund', '--ignore-scripts=false'], stage)
}

// 8. Ungenutzte Teile entfernen (geprüft: Datenbankaufbau und Server laufen ohne sie)
//    - Prisma-Client: Abfrage-Übersetzer für andere Datenbanken als SQLite und Quellkarten
//    - PGlite: Entwicklungsdatenbank für "prisma dev", wird nie gestartet
//    Das Prisma-Werkzeug lädt "Studio" und "@prisma/dev" beim Start; beide bleiben deshalb drin.
const runtimeDir = join(stage, 'node_modules', '@prisma', 'client', 'runtime')
for (const name of readdirSync(runtimeDir)) {
  if (/^query_compiler_(fast|small)_bg\.(sqlserver|cockroachdb|postgresql|mysql)\./.test(name) || name.endsWith('.map')) {
    rmSync(join(runtimeDir, name), { force: true })
  }
}
rmSync(join(stage, 'node_modules', '@electric-sql'), { recursive: true, force: true })

// 9. SQLite für Electron und die Zielarchitektur übersetzen, nur im Paketordner (nie im Hauptordner)
const electronVersion = readJson(join(desktop, 'node_modules', 'electron', 'package.json')).version
run(
  join(desktop, 'node_modules', '.bin', process.platform === 'win32' ? 'electron-rebuild.cmd' : 'electron-rebuild'),
  ['--version', electronVersion, '--arch', arch, '--module-dir', stage, '--only', 'better-sqlite3', '--force'],
  desktop,
)
console.log(`Paketinhalt bereit: ${stage} (MixMarket ${rootPkg.version}, ${process.platform} ${arch})`)

function readJsonSafe(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
