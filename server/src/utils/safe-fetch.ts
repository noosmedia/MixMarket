// Abruf fremder Webseiten ohne Zugriff auf das eigene Netz (Schutz vor SSRF).
// Geprüft wird zweimal: vorab die Adresse (Schema, Port, IP-Schreibweisen) und beim Verbindungsaufbau
// die tatsächlich aufgelöste IP. So hilft auch kein Umbiegen der DNS-Antwort zwischen Prüfung und Abruf.
import { lookup as dnsLookup, type LookupAddress, type LookupOptions } from 'node:dns'
import { BlockList, isIP } from 'node:net'
import { Agent, fetch as undiciFetch, type RequestInit, type Response } from 'undici'

// Gesperrte Bereiche: privat, lokal, verbindungslokal, Dokumentation, Multicast, Übersetzungs- und Sonderbereiche.
// Getrennte Listen für IPv4 und IPv6, weil Node IPv4-Adressen sonst auch gegen IPv6-Regeln prüft.
const blockedV4 = new BlockList()
const blockedV6 = new BlockList()
for (const [net, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blockedV4.addSubnet(net, prefix, 'ipv4')
}
for (const [net, prefix] of [
  ['::', 96], // unbestimmt, Loopback und eingebettete IPv4-Adressen
  ['::ffff:0:0', 96], // nur falls eine Schreibweise nicht in IPv4 zurückgewandelt werden konnte
  ['64:ff9b::', 96],
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001::', 32],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['fc00::', 7],
  ['fe80::', 10],
  ['fec0::', 10],
  ['ff00::', 8],
] as const) {
  blockedV6.addSubnet(net, prefix, 'ipv6')
}

// IPv4 in IPv6-Schreibweise (::ffff:7f00:1 oder ::ffff:127.0.0.1) in IPv4 zurückwandeln
function unmapIPv4(ip: string): string | null {
  const m = /^(?:0{0,4}:){0,5}:?ffff:(.+)$/i.exec(ip)
  if (!m?.[1]) return null
  const tail = m[1]
  if (isIP(tail) === 4) return tail
  const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(tail)
  if (!hex) return null
  const hi = Number.parseInt(hex[1] as string, 16)
  const lo = Number.parseInt(hex[2] as string, 16)
  return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`
}

export function isBlockedAddress(ip: string): boolean {
  const clean = ip.replace(/^\[|\]$/g, '').split('%')[0] as string
  const family = isIP(clean)
  if (family === 4) return blockedV4.check(clean, 'ipv4')
  if (family === 6) {
    const v4 = unmapIPv4(clean)
    if (v4) return blockedV4.check(v4, 'ipv4')
    return blockedV6.check(clean, 'ipv6')
  }
  // Keine gültige IP: sicherheitshalber sperren
  return true
}

// Vorabprüfung einer Adresse: nur http und https, nur Standard-Ports, keine internen Namen oder IPs
export function assertPublicUrl(url: URL): void {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Nur http und https erlaubt')
  if (url.port && !['80', '443'].includes(url.port)) throw new Error('Ungewöhnlicher Port')
  if (url.username || url.password) throw new Error('Adressen mit Zugangsdaten sind nicht erlaubt')
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (!host || host === 'localhost' || /\.(local|localhost|internal|lan|home|intranet)$/.test(host)) throw new Error('Interne Adresse')
  if (isIP(host) && isBlockedAddress(host)) throw new Error('Interne Adresse')
}

// DNS-Auflösung beim Verbindungsaufbau: interne Ziele führen zum Abbruch
function guardedLookup(
  hostname: string,
  options: LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
): void {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, [])
    const list = addresses as LookupAddress[]
    if (!list.length || list.some((a) => isBlockedAddress(a.address))) {
      const error = new Error(`Interne Adresse für ${hostname} gesperrt`) as NodeJS.ErrnoException
      error.code = 'EBLOCKED'
      return callback(error, [])
    }
    if (options.all) return callback(null, list)
    const first = list[0] as LookupAddress
    return callback(null, first.address, first.family)
  })
}

const agent = new Agent({ connect: { lookup: guardedLookup as never }, headersTimeout: 15_000, bodyTimeout: 20_000 })

// Abruf über den gesicherten Verbindungsaufbau; Weiterleitungen nie automatisch folgen
export async function safeFetch(url: URL, init: Omit<RequestInit, 'dispatcher' | 'redirect'> = {}): Promise<Response> {
  assertPublicUrl(url)
  return undiciFetch(url, { ...init, redirect: 'manual', dispatcher: agent })
}

// Seite mit begrenzter Größe laden und Weiterleitungen einzeln prüfen
export async function fetchPublicText(
  rawUrl: string,
  options: { maxBytes: number; timeoutMs: number; headers?: Record<string, string>; maxRedirects?: number },
): Promise<{ url: string; status: number; contentType: string; bytes: Uint8Array }> {
  let url = new URL(rawUrl)
  for (let hop = 0; hop <= (options.maxRedirects ?? 5); hop++) {
    const res = await safeFetch(url, { headers: options.headers, signal: AbortSignal.timeout(options.timeoutMs) })
    const location = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel()
      url = new URL(location, url)
      continue
    }
    const reader = res.body?.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    while (reader) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      size += value.length
      if (size > options.maxBytes) {
        await reader.cancel()
        break
      }
    }
    const total = Math.min(size, options.maxBytes)
    const bytes = new Uint8Array(total)
    let offset = 0
    for (const c of chunks) {
      const part = c.subarray(0, Math.max(0, total - offset))
      bytes.set(part, offset)
      offset += part.length
      if (offset >= total) break
    }
    return { url: url.toString(), status: res.status, contentType: res.headers.get('content-type') ?? '', bytes }
  }
  throw new Error('Zu viele Weiterleitungen')
}
