// Baut Tracking in den HTML-Inhalt ein: Öffnungs-Pixel, Klick-Umleitungen
// und einen Abmelde-Link. Alle Links zeigen auf das oeffentliche Backend.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '../utils/env.js'

// Signatur der Klick-Links: nur Ziele, die MixMarket selbst in eine Mail geschrieben hat, werden ohne
// Rückfrage weitergeleitet. Eigener Schlüssel, abgeleitet vom Geheimnis der App, getrennt nach Zweck.
const linkKey = createHmac('sha256', env.secretsKey).update('mixmarket-tracking-links-v1').digest()

export function signLink(trackingId: string, target: string): string {
  return createHmac('sha256', linkKey).update(`${trackingId}\n${target}`).digest('base64url').slice(0, 22)
}

export function linkSignatureValid(trackingId: string, target: string, signature: string | undefined): boolean {
  if (!signature) return false
  const expected = Buffer.from(signLink(trackingId, target))
  const given = Buffer.from(signature)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

// Unsichtbares Zählpixel für Öffnungen
export function buildOpenPixel(trackingId: string): string {
  const url = `${env.publicApiUrl}/t/o/${trackingId}.png`
  return `<img src="${url}" alt="" width="1" height="1" style="display:none;width:1px;height:1px;border:0;" />`
}

// Abmelde-Link für den Footer
export function buildUnsubscribeUrl(trackingId: string): string {
  return `${env.publicApiUrl}/t/u/${trackingId}`
}

// Alle echten Links im HTML durch Tracking-Umleitungen ersetzen.
// Der Abmelde- und Pixel-Link selbst werden nicht umgeschrieben.
export function rewriteLinksForTracking(html: string, trackingId: string): string {
  return html.replace(/href\s*=\s*"(https?:\/\/[^"]+)"/gi, (match, originalUrl: string) => {
    // Bereits getrackte oder interne Tracking-Links nicht erneut umschreiben
    if (originalUrl.includes('/t/o/') || originalUrl.includes('/t/u/') || originalUrl.includes('/t/c/')) {
      return match
    }
    const encoded = encodeURIComponent(originalUrl)
    const trackedUrl = `${env.publicApiUrl}/t/c/${trackingId}?u=${encoded}&amp;s=${signLink(trackingId, originalUrl)}`
    return `href="${trackedUrl}"`
  })
}

// Emojis und Bildsymbole aus KI-Texten entfernen (Geschäftsmails enthalten nie Emojis).
// ©, ® und ™ bleiben erhalten, sie gehören oft zu Firmen- und Produktnamen.
export function stripEmojis(text: string): string {
  return text
    .replace(/(?![©®™])[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
}

// Nutzertext sicher in HTML einsetzen
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// HTML in lesbaren Text umwandeln: Absätze und Umbrüche bleiben erhalten, Links stehen in Klammern dahinter
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<a\s[^>]*href\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, url: string, label: string) => {
      const text = label.replace(/<[^>]+>/g, '').trim()
      return text && text !== url ? `${text} (${url})` : url
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|tr|ul|ol)>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Signatur darf normaler Text sein (Zeilenumbrüche bleiben erhalten) oder HTML; Text wird sicher umgewandelt
export function signatureToHtml(signature: string | null | undefined): string {
  const sig = signature?.trim()
  if (!sig) return ''
  // Nur echte HTML-Auszeichnungen zählen, nicht etwa spitze Klammern im normalen Text
  if (/<\/?(p|br|div|span|a|b|strong|i|em|u|img|table|tbody|tr|td|ul|ol|li|h[1-6]|font|hr|small)\b[^>]*>/i.test(sig)) return sig
  return escapeHtml(sig).replace(/\r?\n/g, '<br />')
}

// Enthält die Signatur schon eine Grußformel? Dann setzt das Programm keine eigene darüber
export function signatureHasClosing(signature: string | null | undefined): boolean {
  const text = htmlToText(signature ?? '')
  return /(gr(?:ü|ue)(?:ß|ss)e|gru(?:ß|ss)|\bmfg\b|regards|sincerely|cheers|best wishes|greetings)/i.test(text)
}

export interface EmailParts {
  body: string
  trackingId: string
  // Sprache der Vorlage: bestimmt Abmelde-Hinweis und Text des Abmeldelinks
  language?: 'de' | 'en'
  signatureHtml?: string | null
  unsubFooter?: string | null
  postalAddress?: string | null
}

// Vollständige versandfertige Mail als HTML und als reine Textfassung.
// Fügt Signatur, Tracking, Abmelde-Footer und Pflicht-Postanschrift hinzu.
export function assembleEmail(options: EmailParts): { html: string; text: string } {
  const { body, trackingId, signatureHtml, unsubFooter, postalAddress } = options
  const en = options.language === 'en'
  const unsubUrl = buildUnsubscribeUrl(trackingId)
  const pixel = buildOpenPixel(trackingId)
  const unsubText = unsubFooter || (en ? 'You no longer wish to receive emails from us?' : 'Sie möchten keine weiteren E-Mails von uns erhalten?')
  const unsubLink = en ? 'Unsubscribe here' : 'Hier abmelden'
  const signature = signatureHtml?.trim() ? `<div style="margin-top:24px;">${signatureToHtml(signatureHtml)}</div>` : ''

  // Links in Inhalt und Signatur für Klick-Tracking umschreiben
  const trackedBody = rewriteLinksForTracking(body + signature, trackingId)

  // Footer mit Abmeldung und Postanschrift (rechtlich erforderlich); Zeilenumbrüche der Anschrift bleiben erhalten
  const address = postalAddress?.trim() ? escapeHtml(postalAddress.trim()).replace(/\r?\n/g, '<br />') : ''
  const footer = `
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e0ddd6;font-size:12px;color:#8a8377;line-height:1.6;font-family:Arial,sans-serif;">
      ${address ? `<p style="margin:0 0 8px;">${address}</p>` : ''}
      <p style="margin:0;">
        ${unsubText}
        <a href="${unsubUrl}" style="color:#8a8377;text-decoration:underline;">${unsubLink}</a>.
      </p>
    </div>`

  // Textfassung ohne Tracking: Inhalt, Signatur, Anschrift, Abmeldelink
  const text = [
    htmlToText(body),
    signatureHtml?.trim() ? htmlToText(signatureHtml) : '',
    '--',
    postalAddress?.trim() ?? '',
    `${htmlToText(unsubText)} ${unsubLink}: ${unsubUrl}`,
  ]
    .filter(Boolean)
    .join('\n\n')

  return { html: `${trackedBody}${footer}${pixel}`, text }
}
