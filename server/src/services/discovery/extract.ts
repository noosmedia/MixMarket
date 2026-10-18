// Auswertung von Firmenwebseiten (reine Funktionen ohne Netzwerkzugriff).
// Auf deutsche Webseiten zugeschnitten: Impressum mit Geschäftsführung, Rechtsform und
// Register, deutsche Stellenanzeigen mit (m/w/d), deutsche Baukästen und
// Buchungsdienste, Namen mit Umlauten.
import * as cheerio from 'cheerio'

// --- Text aus HTML gewinnen ---

// Seite in Textzeilen umwandeln: Skripte raus, Blöcke und Umbrüche als Zeilen
export function htmlToLines(html: string): string[] {
  const $ = cheerio.load(html)
  $('script, style, noscript, svg, template, iframe').remove()
  $('br').replaceWith('\n')
  $('p, div, li, h1, h2, h3, h4, h5, h6, tr, td, th, dd, dt, section, article, header, footer, address, span.line, label').each(
    (_, el) => {
      $(el).append('\n')
    },
  )
  const text = $('body').length ? $('body').text() : $.root().text()
  return text
    .split('\n')
    .map((line) => line.replace(/[ \s]+/g, ' ').trim())
    .filter(Boolean)
}

// Alle Links einer Seite mit Ziel und sichtbarem Text
export interface PageLink {
  href: string
  text: string
}

export function extractLinks(html: string, baseUrl: string): PageLink[] {
  const $ = cheerio.load(html)
  const links: PageLink[] = []
  $('a[href]').each((_, el) => {
    const raw = ($(el).attr('href') ?? '').trim()
    if (!raw || raw.startsWith('#') || /^(javascript|tel|data):/i.test(raw)) return
    try {
      const href = new URL(raw, baseUrl).toString()
      const text = $(el).text().replace(/\s+/g, ' ').trim() || ($(el).attr('title') ?? '') || ($(el).attr('aria-label') ?? '')
      links.push({ href, text })
    } catch {
      // Ungültige Adresse überspringen
    }
  })
  return links
}

// --- Unterseiten finden (Impressum, Kontakt, Karriere, Team) ---

export type PageKind = 'impressum' | 'kontakt' | 'karriere' | 'team'

const PAGE_PATTERNS: Record<PageKind, { text: RegExp; href: RegExp }> = {
  impressum: {
    text: /^(impressum|imprint|legal notice|anbieterkennzeichnung|rechtliche hinweise|impressum (&|und) datenschutz)$/i,
    href: /impressum|imprint|legal-notice|anbieterkennzeichnung/i,
  },
  kontakt: { text: /^(kontakt|kontaktieren sie uns|contact|anfahrt (&|und) kontakt|so erreichen sie uns)$/i, href: /\/(kontakt|contact)(\/|\.|$|-)/i },
  karriere: {
    text: /^(karriere|jobs|stellenangebote|stellen|offene stellen|ausbildung|wir suchen|wir stellen ein|jobs (&|und) karriere|bewerbung|career|careers)$/i,
    href: /\/(karriere|jobs?|stellenangebote|stellen|offene-stellen|ausbildung|career|careers|bewerbung)(\/|\.|$|-)/i,
  },
  team: {
    text: /^(team|unser team|das team|über uns|ueber uns|wir|wir über uns|unternehmen|about|about us)$/i,
    href: /\/(team|unser-team|ueber-uns|uber-uns|über-uns|wir|unternehmen|about|about-us)(\/|\.|$|-)/i,
  },
}

// Passende Unterseite unter den Links der Startseite suchen (nur eigene Domain)
export function findPageLink(links: PageLink[], kind: PageKind, siteHost: string): string | null {
  const pattern = PAGE_PATTERNS[kind]
  const own = links.filter((l) => {
    try {
      const host = new URL(l.href).hostname.replace(/^www\./, '')
      return host === siteHost || host.endsWith(`.${siteHost}`)
    } catch {
      return false
    }
  })
  const byText = own.find((l) => pattern.text.test(l.text))
  if (byText) return byText.href
  const byHref = own.find((l) => pattern.href.test(new URL(l.href).pathname))
  return byHref?.href ?? null
}

// --- Personen im Impressum ---

export interface FoundPerson {
  fullName: string
  academicTitle: string | null
  firstName: string
  lastName: string
  salutation: 'herr' | 'frau' | null
  role: string
  isDecisionMaker: boolean
}

// Schlüsselwörter, nach denen im Impressum Namen stehen
// (?<![\p{L}]) verhindert Treffer mitten im Wort, etwa bei "Karteninhaber"
const IMPRESSUM_ROLES: Array<{ re: RegExp; role: string; decision: boolean }> = [
  { re: /(?<![\p{L}])gesch(?:ä|ae)ftsf(?:ü|ue)hrende[rn]?\s+gesellschafter(?:in)?/iu, role: 'Geschäftsführende Gesellschaft', decision: true },
  { re: /(?<![\p{L}])gesch(?:ä|ae)ftsf(?:ü|ue)hr(?:erinnen|erin|er\*in|er:innen|er|ung)(?![\p{L}])/iu, role: 'Geschäftsführung', decision: true },
  { re: /(?<![\p{L}])(?:praxis)?inhaber(?:in|\*in)?(?![\p{L}])|(?<![\p{L}])inh\.(?=\s|:)/iu, role: 'Inhaber', decision: true },
  { re: /(?<![\p{L}])vertreten\s+durch(?![\p{L}])|(?<![\p{L}])vertretungsberechtigt(?:e[rn]?)?(?![\p{L}])/iu, role: 'Vertretungsberechtigt', decision: true },
  { re: /(?<![\p{L}])vorstand(?:svorsitzende[rn]?)?(?![\p{L}])/iu, role: 'Vorstand', decision: true },
  { re: /(?<![\p{L}])prokurist(?:in)?(?![\p{L}])|(?<![\p{L}])prokura(?![\p{L}])/iu, role: 'Prokura', decision: true },
  { re: /(?<![\p{L}])(?:inhaltlich\s+)?verantwortlich(?:e[rn]?)?(?![\p{L}])(?:[^:]{0,80}:)?/iu, role: 'Inhaltlich verantwortlich', decision: false },
]

// Rollenwort am Anfang des Namensteils, z. B. "Geschäftsführer: Max Muster" nach "Vertreten durch"
function leadingRole(text: string): { re: RegExp; role: string; decision: boolean } | null {
  for (const def of IMPRESSUM_ROLES) {
    const m = text.match(def.re)
    if (m && m.index === 0) return def
  }
  return null
}

// Wörter, die nie Teil eines Personennamens sind
const NON_NAME_WORDS = new Set(
  `gmbh mbh ug ag kg ohg gbr co ek e.k. e.kfm. ev e.v. eg partg partgmbb gesellschaft unternehmen firma
  straße strasse str. str weg platz allee ring gasse damm ufer chaussee
  telefon tel tel. fax mobil handy e-mail email mail internet web www
  amtsgericht registergericht handelsregister registernummer hrb hra sitz deutschland germany
  impressum kontakt angaben gemäß gemaess paragraph tmg ddg mstv rstv abs. abs
  geschäftsführer geschäftsführerin geschäftsführung inhaber inhaberin vertreten durch verantwortlich
  team service gebäude haus dach bau handwerk meisterbetrieb praxis kanzlei büro buero
  umsatzsteuer ust-idnr steuernummer finanzamt kammer handwerkskammer ihk aufsichtsbehörde
  der die das den dem des und oder mit für von bei im in am an zur zum siehe oben unten
  herr frau herrn
  unser unsere unseren unserem ihr ihre wir uns über startseite home aktuelles news karriere jobs
  öffnungszeiten anfahrt standort standorte verkauf leistungen angebote angebot datenschutz
  datenschutzerklärung agb kunden ansprechpartner mitarbeiter downloads galerie referenzen`
    .split(/\s+/)
    .filter(Boolean),
)

const TITLE_TOKEN = /^(dr\.?|prof\.?|dipl\.?-?[a-zäöü]*\.?|ing\.?|m\.?\s?sc\.?|b\.?\s?sc\.?|m\.?a\.?|b\.?a\.?|mba|ll\.?m\.?|med\.?|dent\.?|rer\.?|nat\.?|pol\.?|phil\.?|jur\.?|oec\.?|h\.?c\.?|rechtsanwalt|rechtsanwältin|ra|stb|steuerberater(?:in)?|zahnarzt|zahnärztin)$/i
const PARTICLE = /^(von|van|de|der|den|zu|vom|zum|di|da|le|la|ten|ter|del|dos)$/i
const NAME_TOKEN = /^\p{Lu}[\p{Ll}']+(?:-\p{Lu}[\p{Ll}']+)*$/u

// Betriebswörter, die vorn vor einem Namen stehen ("Autohaus Max Muster", "Ferienwohnungen
// Musterhof"). Vornamen enden nie so; deshalb wird nur das erste Wort geprüft.
const BUSINESS_WORDS = new Set(
  `autohaus autohändler ferienwohnung ferienwohnungen ferienhaus ferienhäuser ferienhof ferienpark pension
  hotel gasthof gasthaus restaurant café cafe bistro imbiss bäckerei konditorei metzgerei fleischerei
  dachdeckerei zimmerei tischlerei schreinerei malerbetrieb elektro sanitär heizung friseur salon studio
  apotheke agentur campingplatz camping reisebüro autowerkstatt werkstatt fahrschule`
    .split(/\s+/)
    .filter(Boolean),
)
// Auch Wörter wie "Familienunternehmen" oder "Handwerksbetrieb" vor einem Firmennamen sind kein Vorname
const BUSINESS_SUFFIX = /(stübchen|stube|stuben|hof|haus|hotel|markt|center|zentrum|werkstatt|service|technik|bau|unternehmen|betrieb|gruppe|konzern)$/i

function isBusinessWord(token: string): boolean {
  const lower = token.toLowerCase()
  return BUSINESS_WORDS.has(lower) || BUSINESS_SUFFIX.test(lower)
}

// Einen Textschnipsel als Personennamen prüfen und zerlegen
export function parsePersonName(raw: string): Omit<FoundPerson, 'role' | 'isDecisionMaker'> | null {
  let text = raw.replace(/\([^)]*\)/g, ' ').replace(/[„“"]/g, '').replace(/\s+/g, ' ').trim()
  let salutation: 'herr' | 'frau' | null = null
  const sal = text.match(/^(herrn?|frau)\s+/i)
  if (sal) {
    salutation = sal[1].toLowerCase().startsWith('frau') ? 'frau' : 'herr'
    text = text.slice(sal[0].length)
  }
  text = text.replace(/[.,;:]+$/, '')
  // Titel wie "Dipl.-Ing." bleiben zusammen, sonst an Leerzeichen trennen
  const tokens = text.split(' ').filter(Boolean)
  // Betriebswort vorn entfernen; bleibt danach kein vollständiger Name, ist es keine Person
  while (tokens.length && isBusinessWord(tokens[0])) tokens.shift()
  if (tokens.length < 2 || tokens.length > 7) return null
  const titles: string[] = []
  const nameParts: string[] = []
  for (const token of tokens) {
    const lower = token.toLowerCase()
    if (TITLE_TOKEN.test(token) && nameParts.length === 0) {
      titles.push(token)
      continue
    }
    if (/\d|@|\//.test(token)) return null
    // Namenszusätze wie "von" oder "van der" vor der Wortprüfung zulassen
    if (PARTICLE.test(token) && nameParts.length > 0) {
      nameParts.push(token)
      continue
    }
    if (NON_NAME_WORDS.has(lower) || NON_NAME_WORDS.has(lower.replace(/[.,]$/, ''))) return null
    // Abgekürzter Zweitname wie "M."
    if (/^\p{Lu}\.$/u.test(token) && nameParts.length === 1) {
      nameParts.push(token)
      continue
    }
    if (!NAME_TOKEN.test(token)) return null
    nameParts.push(token)
  }
  const realNames = nameParts.filter((p) => NAME_TOKEN.test(p))
  if (realNames.length < 2 || realNames.length > 4) return null
  // Partikel dürfen nicht am Ende stehen
  if (PARTICLE.test(nameParts[nameParts.length - 1])) return null
  const firstName = nameParts[0]
  // Nachname beginnt beim ersten Namensteil nach dem Vornamen (inkl. "von")
  let lastIndex = nameParts.length - 1
  while (lastIndex > 1 && PARTICLE.test(nameParts[lastIndex - 1])) lastIndex--
  const lastName = nameParts.slice(Math.max(1, lastIndex)).join(' ')
  const middle = nameParts.slice(1, Math.max(1, lastIndex))
  const academicTitle = titles.length ? titles.join(' ') : null
  return {
    fullName: [academicTitle, firstName, ...middle, lastName].filter(Boolean).join(' '),
    academicTitle,
    firstName,
    lastName,
    salutation,
  }
}

// Weibliche Rollenbezeichnung deutet auf die Anrede "Frau" hin
function salutationFromRole(text: string): 'frau' | null {
  return /(geschäftsführerin|geschaeftsfuehrerin|inhaberin|prokuristin|vorsitzende\b|gesellschafterin)/i.test(text) ? 'frau' : null
}

// Darf der Name in der nächsten Zeile stehen? Nur wenn die Rolle als Überschrift
// dasteht ("Geschäftsführer:" oder "Vertreten durch die Geschäftsführerin"), nicht
// mitten in einer Menüzeile wie "Service Verkauf Geschäftsführung"
const LABEL_PREFIX =
  /^(?:(?:die|der|den|unsere?|vertreten|durch|vertretungsberechtigte?[rn]?|persönlich|haftende?[rn]?|alleinige?[rn]?|geschäftsführende?[rn]?|gesellschafter(?:in)?)\s+){0,4}$/iu

// Personen aus den Zeilen eines Impressums lesen
export function extractImpressumPeople(lines: string[]): FoundPerson[] {
  const people: FoundPerson[] = []
  const seen = new Set<string>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const def of IMPRESSUM_ROLES) {
      const m = line.match(def.re)
      if (!m || m.index === undefined) continue
      // Rest der Zeile nach dem Schlüsselwort, sonst die nächste Zeile
      let rest = line.slice(m.index + m[0].length).replace(/^[\s:–\-]+/, '')
      let feminine = salutationFromRole(m[0])
      let role = def.role
      let decision = def.decision
      // Füllwörter wie "Person:" entfernen; steht danach nichts mehr, folgt der Name in der nächsten Zeile
      rest = rest.replace(/^(?:person(?:en)?|gesellschafter(?:in)?)\s*:?\s*/i, '')
      if (!rest) {
        const prefix = line.slice(0, m.index).trim()
        if (prefix && !LABEL_PREFIX.test(`${prefix} `)) break
        rest = lines[i + 1] ?? ''
      }
      // Füllwörter wie "den Geschäftsführer" oder "die Inhaberin" entfernen
      rest = rest.replace(/^(?:durch\s+)?(?:den|die|der)\s+/i, '')
      const inner = leadingRole(rest)
      if (inner) {
        const im = rest.match(inner.re) as RegExpMatchArray
        feminine = feminine ?? salutationFromRole(im[0])
        role = inner.role
        decision = inner.decision || decision
        rest = rest.slice(im[0].length).replace(/^[\s:–\-]+/, '')
      }
      // Nur bis zum Satzende oder zum nächsten Doppelpunkt lesen ("Dr." bleibt erhalten)
      rest = rest.split(/(?<!\b[\p{L}]{1,4})\.\s|:/u)[0]
      // Mehrere Namen sind meist mit Komma, "und" oder "&" getrennt
      for (const part of rest.split(/,|;|\s+und\s+|\s+&\s+|\s+sowie\s+|\s+\|\s+/)) {
        const parsed = parsePersonName(part)
        if (!parsed) continue
        const key = `${parsed.firstName} ${parsed.lastName}`.toLowerCase()
        const existing = people.find((p) => `${p.firstName} ${p.lastName}`.toLowerCase() === key)
        if (existing) {
          // Gleiche Person in mehreren Rollen: Entscheider-Rolle behalten
          if (decision && !existing.isDecisionMaker) {
            existing.isDecisionMaker = true
            existing.role = role
          }
          continue
        }
        if (seen.has(key)) continue
        seen.add(key)
        const salutation = parsed.salutation ?? feminine
        // Rollenbezeichnung an die erkennbare Anrede anpassen
        const shownRole = salutation === 'frau' && role === 'Inhaber' ? 'Inhaberin' : role
        people.push({ ...parsed, salutation, role: shownRole, isDecisionMaker: decision })
      }
      break
    }
    if (people.length >= 6) break
  }
  return people
}

// Bei Einzelunternehmen steht der Inhaber oft ohne Stichwort direkt unter dem
// Firmennamen ("Unternehmensbezeichnung / Dachdeckerei Muster / Max Muster").
// Gesucht wird nur in den ersten Zeilen nach dem Seitenanfang des Impressums.
export function extractLeadPerson(lines: string[], companyName: string): FoundPerson | null {
  const start = lines.findIndex((l) => /^(impressum|angaben gem|unternehmensbezeichnung|firmenname|anbieter)/i.test(l))
  if (start < 0) return null
  const company = companyName.toLowerCase()
  for (const line of lines.slice(start + 1, start + 7)) {
    if (/^(anschrift|kontakt|telefon|tel|e-mail|rechtsform|sitz)\b/i.test(line)) break
    if (company && line.toLowerCase() === company) continue
    const parsed = parsePersonName(line)
    if (parsed) return { ...parsed, role: parsed.salutation === 'frau' ? 'Inhaberin' : 'Inhaber', isDecisionMaker: true }
  }
  return null
}

// --- Personen auf einer Teamseite (vorsichtig, nur mit erkennbarer Rolle) ---

const TEAM_ROLE_HINT =
  /\b(gesch(?:ä|ae)ftsf(?:ü|ue)hr\w*|inhaber\w*|gr(?:ü|ue)nder\w*|gesellschafter\w*|prokurist\w*|leitung|leiter\w*|vorstand|partner\w*|meister\w*|projektleit\w*|bauleit\w*|vertrieb\w*|verkauf|kundenberat\w*|b(?:ü|ue)ro\w*|assistenz|marketing|personal\w*|buchhaltung|ausbild\w*|technik\w*|monteur\w*|mitarbeiter\w*|empfang|verwaltung|zahnarzt|zahnärztin|ärztin|arzt|rechtsanwält\w*|steuerberater\w*)\b/i
const TEAM_DECISION = /\b(gesch(?:ä|ae)ftsf(?:ü|ue)hr\w*|inhaber\w*|gr(?:ü|ue)nder\w*|gesellschafter\w*|prokurist\w*|gesch(?:ä|ae)ftsleitung|vorstand|niederlassungsleit\w*|praxisinhaber\w*)\b/i

// Rolle säubern: Webseiten kleben Rolle und Kontaktdaten oft ohne Leerzeichen zusammen
// ("GeschäftsführerTelefon: +49 511 ..."). Abschneiden vor Kontaktwörtern, Ziffern, @ und
// vor einem Wortwechsel mitten im Wort (Klein- direkt vor Großbuchstabe).
export function cleanRole(raw: string): string {
  let text = raw.split(/[|·•\n]/)[0] ?? ''
  const contact = /(telefon|telefax|tel\.|fax|e-?mail|mobil|handy|www\.|https?:)/i.exec(text)
  if (contact) text = text.slice(0, contact.index)
  const glued = /[a-zäöüß][A-ZÄÖÜ]/.exec(text)
  if (glued) text = text.slice(0, glued.index + 1)
  const data = /[+@\d]/.exec(text)
  if (data) text = text.slice(0, data.index)
  return text.replace(/[\s,;:.\-–(]+$/, '').trim().slice(0, 60)
}

export function extractTeamPeople(html: string): FoundPerson[] {
  const $ = cheerio.load(html)
  $('script, style, noscript, svg').remove()
  const people: FoundPerson[] = []
  const seen = new Set<string>()
  $('h1, h2, h3, h4, h5, strong, b, .name').each((_, el) => {
    if (people.length >= 12) return
    const name = $(el).text().replace(/\s+/g, ' ').trim()
    if (name.length > 50) return
    const parsed = parsePersonName(name)
    if (!parsed) return
    // Rolle steht meist direkt nach dem Namen: zuerst das Geschwister, sonst der Elternblock. Nur eine Quelle
    // nehmen, sonst steht die Rolle doppelt da. Lange Absätze (Firmengeschichte, Fließtext) zählen nicht,
    // dort steht ein Rollenwort oft in einem Satz über jemand anderen.
    const context =
      [$(el).next().text(), $(el).parent().text().replace(name, '')]
        .map((t) => t.replace(/\s+/g, ' ').trim())
        .find((t) => t.length > 0 && t.length <= 200 && TEAM_ROLE_HINT.test(t))
        ?.slice(0, 160) ?? ''
    const roleMatch = context.match(TEAM_ROLE_HINT)
    if (!roleMatch) return
    const key = `${parsed.firstName} ${parsed.lastName}`.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    const roleText = cleanRole(context.slice(roleMatch.index ?? 0))
    // Eine Rolle ist kurz ("Leitung Vertrieb"); ein halber Satz ist keine Rolle
    if (!roleText || roleText.split(' ').length > 5) return
    people.push({
      ...parsed,
      salutation: parsed.salutation ?? salutationFromRole(roleText),
      role: roleText,
      isDecisionMaker: TEAM_DECISION.test(roleText),
    })
  })
  return people
}

// --- Unternehmensangaben im Impressum ---

const LEGAL_FORMS: Array<[RegExp, string]> = [
  [/gmbh\s*&\s*co\.?\s*kg/i, 'GmbH & Co. KG'],
  [/\bggmbh\b/i, 'gGmbH'],
  [/\bgmbh\b/i, 'GmbH'],
  [/\bug\s*\(haftungsbeschr(?:ä|ae)nkt\)|\bug\b(?!\s*\w)/i, 'UG (haftungsbeschränkt)'],
  [/\bpartg\s*mbb\b|\bpartgmbb\b/i, 'PartG mbB'],
  [/\bpartg\b|partnerschaftsgesellschaft/i, 'PartG'],
  [/\bohg\b/i, 'OHG'],
  [/\bgbr\b/i, 'GbR'],
  [/\be\.\s?k(?:fm|fr)?\.?(?=[\s,)]|$)|eingetragene[rn]?\s+kauf(?:mann|frau)/i, 'e. K.'],
  [/\beg\b(?=[\s,]|$)|eingetragene genossenschaft/i, 'eG'],
  [/\bkg\b/i, 'KG'],
  [/\bag\b(?=[\s,]|$)|aktiengesellschaft/i, 'AG'],
]

// Rechtsform aus dem Firmennamen, sonst aus dem Impressum (ohne Gerichtszeilen)
export function extractLegalForm(companyName: string, lines: string[], excludeNames: string[] = []): string | null {
  for (const [re, label] of LEGAL_FORMS) if (re.test(companyName)) return label
  const exclude = excludeNames.map((n) => n.toLowerCase()).filter((n) => n.length > 2)
  const relevant = lines
    .filter((l) => !/amtsgericht|registergericht|\bag\s+[A-ZÄÖÜ]/i.test(l))
    .filter((l) => !exclude.some((n) => l.toLowerCase().includes(n)))
    .slice(0, 40)
    .join('\n')
  for (const [re, label] of LEGAL_FORMS) if (re.test(relevant)) return label
  if (/einzelunternehm/i.test(relevant)) return 'Einzelunternehmen'
  return null
}

// Handelsregister: Nummer und Gericht
export function extractRegister(text: string): string | null {
  const num = text.match(/\b(HRB|HRA|GnR|PR|VR)\s*(?:Nr\.?)?\s*:?\s*(\d{1,7}(?:\s?[A-Z]{1,2}\b)?)/)
  if (!num) return null
  const court = text.match(/(?:Amtsgericht|Registergericht)\s*:?\s*([A-ZÄÖÜ][A-Za-zäöüß.\- ]{2,30}?)(?=\s*(?:,|\n|HR[AB]|Registernummer|Register-Nr|unter|$))/)
  const courtName = court ? court[1].trim().replace(/^Amtsgericht\s+/i, '') : null
  return [`${num[1]} ${num[2].trim()}`, courtName ? `Amtsgericht ${courtName}` : null].filter(Boolean).join(', ')
}

// Umsatzsteuer-Identifikationsnummer (deutsch)
export function extractVatId(text: string): string | null {
  const m = text.match(/\bDE\s?(\d{3})\s?(\d{3})\s?(\d{3})\b/)
  return m ? `DE${m[1]}${m[2]}${m[3]}` : null
}

// Telefonnummer nach "Tel." oder "Telefon"
export function extractPhone(text: string): string | null {
  const m = text.match(/(?:Tel(?:efon)?|Fon|Phone)\.?\s*:?\s*(\+?\(?\d[\d\s/().\-]{5,24}\d)/i)
  return m ? m[1].replace(/\s+/g, ' ').trim() : null
}

// --- E-Mail-Adressen ---

const GENERIC_LOCAL_PARTS =
  /^(info|kontakt|contact|office|mail|post|service|hallo|hello|team|buero|büro|anfrage|anfragen|verwaltung|empfang|praxis|termine?|bewerbung|jobs|karriere|datenschutz|presse|rechnung|buchhaltung|support|vertrieb|sales|shop|bestellung|webmaster|admin|noreply|no-reply|zentrale|firma|verkauf|auftrag|angebot|marketing|einkauf|personal|filiale|standort|kundenservice|kundendienst)$/i
// Abteilungen und Sachgebiete als Teil einer Adresse ("produktmanagement@", "sicherheit-medizinprodukte@")
const DEPARTMENT_PART = /(management|sicherheit|produkt|abteilung|beratung|kundenservice|kundendienst|niederlassung|filiale|vertrieb|marketing|einkauf|buchhaltung|verwaltung|zentrale)/i

// Allgemeine Adresse statt einer Person: allgemeines Wort als ganzer Teil ("de-info@", "info.leipzig@"),
// Abteilungswort im Namen oder eine Kennziffer ("deu0091@")
export function isGenericLocalPart(local: string): boolean {
  if (GENERIC_LOCAL_PARTS.test(local)) return true
  const parts = local.split(/[._+-]+/).filter(Boolean)
  if (parts.some((p) => GENERIC_LOCAL_PARTS.test(p.replace(/\d+$/, '')))) return true
  if (DEPARTMENT_PART.test(local)) return true
  return /\d{3,}/.test(local)
}
const EMAIL_BLOCKLIST = /(example\.|beispiel|muster|domain\.(de|com)|sentry|wixpress|@2x|\.(png|jpe?g|gif|svg|webp)$|email\.com$|ihre-?domain|yourdomain)/i

export interface FoundEmail {
  email: string
  generic: boolean
}

// E-Mails aus mailto-Links und Text, auch verschleierte wie "info (at) firma.de"
// Kleine Betriebe nutzen oft Freemail-Adressen; andere fremde Domains (Kammer,
// Agentur, Datenschutzbehörde) gehören nicht zur Firma
const FREEMAIL = /@(t-online|gmx|web|freenet|arcor|online|mail|posteo|gmail|googlemail|outlook|hotmail|live|yahoo|icloud|me|aol|1und1|vodafone|ewe|kabelmail)\.(de|com|net)$/i

export function extractEmails(html: string, lines: string[], ownHost?: string): FoundEmail[] {
  const found = new Set<string>()
  const $ = cheerio.load(html)
  $('a[href^="mailto:" i]').each((_, el) => {
    const addr = decodeURIComponent(($(el).attr('href') ?? '').replace(/^mailto:/i, '').split('?')[0]).trim()
    if (addr) found.add(addr.toLowerCase())
  })
  const deobfuscated = lines
    .join('\n')
    .replace(/\s*(?:\[at\]|\(at\)|\{at\}|\[ät\]|\(ät\)|\[@\]|\s+at\s+)\s*/gi, '@')
    .replace(/\s*(?:\[dot\]|\(dot\)|\[punkt\]|\(punkt\)|\{punkt\})\s*/gi, '.')
  for (const m of deobfuscated.matchAll(/[a-z0-9._%+\-äöü]+@[a-z0-9.\-äöü]+\.[a-z]{2,}/gi)) found.add(m[0].toLowerCase())
  return [...found]
    .filter((e) => !EMAIL_BLOCKLIST.test(e) && e.length <= 80)
    .filter((e) => !ownHost || e.endsWith(`@${ownHost}`) || FREEMAIL.test(e))
    .slice(0, 8)
    .map((email) => ({ email, generic: isGenericLocalPart(email.split('@')[0]) }))
}

// --- Technik, Werbung, Buchung ---

// Webseiten-System (erstes Treffer-System gilt als Hauptsystem)
const CMS_FINGERPRINTS: Array<[string, RegExp]> = [
  ['WordPress', /wp-content\/|wp-includes\/|content="WordPress/i],
  ['TYPO3', /typo3conf\/|typo3temp\/|content="TYPO3/i],
  ['Joomla', /content="Joomla|\/media\/jui\/|option=com_content/i],
  ['Contao', /content="Contao|\/assets\/contao\/|system\/modules\//i],
  ['Drupal', /content="Drupal|\/sites\/default\/files\//i],
  ['Shopware', /\/bundles\/storefront\/|shopware/i],
  ['Shopify', /cdn\.shopify\.com|myshopify\.com/i],
  ['JTL-Shop', /jtl-shop|jtlshop|\/templates\/NOVA\//i],
  ['Gambio', /gambio/i],
  ['Jimdo', /jimdo|jimcdn\.com|jimstatic\.com/i],
  ['Wix', /static\.parastorage\.com|wixstatic\.com/i],
  ['Squarespace', /static1\.squarespace\.com|<!-- This is Squarespace/i],
  ['Webflow', /assets\.website-files\.com|data-wf-domain/i],
  ['Webnode', /webnode\./i],
  ['Weebly', /weebly\.com|editmysite\.com/i],
  ['Duda', /irp\.cdn-website\.com/i],
  ['Framer', /framerusercontent\.com/i],
  ['Next.js', /\/_next\/static\//i],
]

const TECH_FINGERPRINTS: Array<[string, RegExp]> = [
  ['WooCommerce', /woocommerce|wc-ajax/i],
  ['Elementor', /elementor/i],
  ['Google Analytics', /googletagmanager\.com\/gtag\/js\?id=G-|google-analytics\.com\/(analytics|ga)\.js|['"]G-[A-Z0-9]{6,}['"]/i],
  ['Google Tag Manager', /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]{4,}/],
  ['Matomo', /matomo\.js|piwik\.js|_paq\.push/i],
  ['etracker', /etracker\.(com|de)/i],
  ['Hotjar', /static\.hotjar\.com/i],
  ['Usercentrics', /usercentrics/i],
  ['Cookiebot', /cookiebot/i],
  ['Borlabs Cookie', /borlabs/i],
  ['CCM19', /ccm19/i],
  ['Complianz', /complianz/i],
  ['Userlike', /userlike/i],
  ['Tidio', /code\.tidio\.co/i],
  ['Zendesk', /static\.zdassets\.com/i],
  ['Intercom', /widget\.intercom\.io/i],
  ['WhatsApp-Kontakt', /wa\.me\/|api\.whatsapp\.com/i],
  ['Mailchimp', /chimpstatic\.com|list-manage\.com/i],
  ['CleverReach', /cleverreach/i],
  ['Brevo', /sibforms\.com|sendinblue|brevo\.com/i],
  ['HubSpot', /js\.hs-scripts\.com|js\.hsforms\.net/i],
  ['Cloudflare', /\/cdn-cgi\//i],
]

const GOOGLE_ADS = /googleadservices\.com|gtag\/js\?id=AW-|['"]AW-\d{6,}['"]|google_conversion/i
const META_PIXEL = /connect\.facebook\.net\/[^"']*fbevents\.js|fbq\s*\(\s*['"]init/i

const BOOKING_TOOLS: Array<[string, RegExp]> = [
  ['Doctolib', /doctolib/i],
  ['Calendly', /calendly\.com/i],
  ['eTermin', /etermin\.net/i],
  ['Shore', /shore\.com|connect\.shore/i],
  ['Treatwell', /treatwell/i],
  ['Planity', /planity/i],
  ['Timify', /timify/i],
  ['Salonized', /salonized/i],
  ['SimplyBook', /simplybook/i],
  ['Acuity', /acuityscheduling/i],
  ['bookingkit', /bookingkit/i],
  ['Samedi', /samedi\.de/i],
  ['Quandoo', /quandoo/i],
  ['OpenTable', /opentable/i],
  ['resmio', /resmio/i],
  ['Microsoft Bookings', /outlook\.office365\.com\/owa\/calendar|bookings\.microsoft/i],
]
const BOOKING_TEXT = /(online[- ]termin|termin(e)? online|online (buchen|reservieren)|jetzt online buchen|tisch (online )?reservieren|termin buchen)/i

export interface TechResult {
  cms: string | null
  tech: string[]
  googleAds: boolean
  metaPixel: boolean
  booking: string | null
}

export function detectTech(html: string, lines: string[]): TechResult {
  const sample = html.slice(0, 600_000)
  let cms = CMS_FINGERPRINTS.find(([, re]) => re.test(sample))?.[0] ?? null
  // Ersatz: Angabe im Generator-Tag, falls kein bekanntes System erkannt wurde
  if (!cms) {
    const gen = sample.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']{2,60})["']/i)
    if (gen) cms = gen[1].trim()
  }
  const tech = TECH_FINGERPRINTS.filter(([, re]) => re.test(sample)).map(([name]) => name)
  const tool = BOOKING_TOOLS.find(([, re]) => re.test(sample))?.[0] ?? null
  const textHit = lines.some((l) => l.length < 120 && BOOKING_TEXT.test(l))
  return {
    cms,
    tech,
    googleAds: GOOGLE_ADS.test(sample),
    metaPixel: META_PIXEL.test(sample),
    booking: tool ?? (textHit ? 'Online-Buchung' : null),
  }
}

// --- Agentur, die die Webseite gebaut hat ---

// Plattformen sind keine Agentur ("Powered by WordPress")
const PLATFORM_NAMES =
  /^(wordpress|jimdo|wix|ionos|1&1|strato|typo3|joomla|contao|shopify|shopware|elementor|squarespace|webflow|weebly|webnode|godaddy|google|facebook|instagram|themeisle|astra|divi|oxygen|hostinger|all-inkl|hosteurope|mittwald|netcup|cookiebot|usercentrics|borlabs)/i
// Kammern, Behörden, Verbände und Pflichtlinks im Impressum sind nie die Agentur
const INSTITUTION_HOSTS =
  /(hwk|handwerkskammer|ihk|europa\.eu|verbraucher|schlichtung|bundesanzeiger|handelsregister|unternehmensregister|gesetze-im-internet|zvdh|dachdecker\.org|bafa|kfw|tuev|tüv|dekra|bund\.de|google\.|maps\.|openstreetmap)/i
// Gestaltungswörter mit "von/by/durch/:" direkt vor dem Link
const CREDIT_CONTEXT =
  /(webdesign|web-design|gestaltung|design|realisierung|realisiert|umsetzung|umgesetzt|programmierung|entwicklung|konzept(?:ion)?|erstellt|made|powered|seo|betreuung|bereitstellung|bereitgestellt)\s*(?:(?:&|und)\s*\w+\s*)?(?:by|von|durch|mit|:)\s*$|(?:website|webseite|homepage|internetseite)\s+(?:by|von|durch|erstellt von|gemacht von)\s*$/i
const CREDIT_LINE =
  /^(?:webdesign|web-design|design|gestaltung|realisierung|umsetzung|technische umsetzung|technische bereitstellung|bereitstellung|programmierung|betreuung|konzept(?:ion)?|(?:website|webseite|homepage|internetseite)\s+(?:erstellt\s+)?(?:by|von))(?:\s*(?:und|&|\+)\s*[\p{L}\- ]{2,30}?)?\s*(?:(?:by|von|durch)\s*:?|:)\s*(.{0,80})$/iu

export interface AgencyResult {
  name: string
  confidence: number
  url: string | null
}

export function detectAgency(html: string, lines: string[], ownHost: string, companyName: string): AgencyResult | null {
  // 1. Verlinkter Hinweis im Fußbereich, z. B. "Webdesign by <a>Agentur</a>"
  const $ = cheerio.load(html)
  $('script, style, noscript').remove()
  const footer = $('footer').length ? $('footer') : $('body')
  let best: AgencyResult | null = null
  footer.find('a[href^="http"]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    let host = ''
    try {
      host = new URL(href).hostname.replace(/^www\./, '')
    } catch {
      return
    }
    if (!host || host === ownHost || host.endsWith(`.${ownHost}`) || ownHost.endsWith(`.${host}`)) return
    const anchor = $(el).text().replace(/\s+/g, ' ').split(/\s*[|·•–]\s*/)[0].trim()
    if (!anchor || anchor.length > 60 || PLATFORM_NAMES.test(anchor) || PLATFORM_NAMES.test(host)) return
    if (INSTITUTION_HOSTS.test(host) || anchor.toLowerCase().includes(ownHost)) return
    // Text direkt vor dem Link im selben Block
    const parentText = $(el).parent().text().replace(/\s+/g, ' ')
    const before = parentText.slice(0, Math.max(0, parentText.indexOf(anchor))).slice(-60)
    if (CREDIT_CONTEXT.test(before) && (!best || best.confidence < 0.9)) {
      best = { name: anchor, confidence: 0.9, url: href }
    }
  })
  if (best) return best

  // 2. Zeile im Impressum, z. B. "Webdesign: Agentur Beispiel, Musterstadt"
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(CREDIT_LINE)
    if (!m) continue
    // Steht nach dem Stichwort nichts, folgt der Name in der nächsten Zeile
    const raw = m[1].trim() || lines[i + 1] || ''
    const name = raw.split(/,|\s+[|–-]\s+/)[0].trim()
    if (name.length < 2 || name.length > 60 || /:$/.test(name) || PLATFORM_NAMES.test(name) || /^(siehe|wir|uns|selbst)\b/i.test(name)) continue
    if (companyName && name.toLowerCase().includes(companyName.toLowerCase().slice(0, 12))) continue
    return { name, confidence: 0.85, url: null }
  }
  return null
}

// --- Stellenanzeigen ---

const JOB_TITLE =
  /([A-ZÄÖÜ][^\n()]{2,70}?)\s*\(\s*(?:m|w|d|f|x|div|gn\*?)\s*[/|,]\s*(?:m|w|d|f|x|div)\s*(?:[/|,]\s*(?:m|w|d|f|x|div)\s*)?\)/g

export function extractJobs(lines: string[]): string[] {
  const jobs: string[] = []
  for (const line of lines) {
    if (line.length > 200) continue
    for (const m of line.matchAll(JOB_TITLE)) {
      const title = `${m[1].replace(/^(wir suchen|gesucht|stellenangebot|job)\s*:?\s*/i, '').trim()} (m/w/d)`
      if (title.length > 6 && !jobs.some((j) => j.toLowerCase() === title.toLowerCase())) jobs.push(title)
    }
    const azubi = line.match(/^Ausbildung\s+(?:zum|zur|als)\s+.{3,60}$/i)
    if (azubi && !jobs.includes(azubi[0])) jobs.push(azubi[0])
    if (jobs.length >= 6) break
  }
  return jobs
}

// --- Weitere Webseiten-Merkmale ---

// Jüngste Jahreszahl im Copyright-Hinweis
export function extractCopyrightYear(lines: string[]): number | null {
  const current = new Date().getFullYear()
  let best: number | null = null
  for (const line of lines) {
    for (const m of line.matchAll(/(?:©|\(c\)|copyright)\s*(?:by\s*)?(?:\d{4}\s*[-–]\s*)?((?:19|20)\d{2})/gi)) {
      const year = Number(m[1])
      if (year <= current && (best === null || year > best)) best = year
    }
  }
  return best
}

// Kurzer Textauszug der Startseite für die KI-Bewertung: Titel, Beschreibung,
// Überschriften und die ersten Absätze, höchstens 1.500 Zeichen
export function extractProfileText(html: string): string {
  const $ = cheerio.load(html)
  $('script, style, noscript, svg, template, iframe, nav, footer, form').remove()
  const clean = (t: string) => t.replace(/\s+/g, ' ').trim()
  const parts: string[] = []
  const title = clean($('title').first().text())
  if (title) parts.push(`Titel: ${title}`)
  const desc = clean($('meta[name="description"]').attr('content') ?? $('meta[property="og:description"]').attr('content') ?? '')
  if (desc) parts.push(`Beschreibung: ${desc}`)
  const headings = $('h1, h2, h3')
    .toArray()
    .map((el) => clean($(el).text()))
    .filter((t) => t.length > 2 && t.length < 120)
  const uniqueHeadings = [...new Set(headings)].slice(0, 10)
  if (uniqueHeadings.length) parts.push(`Überschriften: ${uniqueHeadings.join(' | ')}`)
  const paragraphs = $('p')
    .toArray()
    .map((el) => clean($(el).text()))
    .filter((t) => t.length > 40)
    .slice(0, 4)
  if (paragraphs.length) parts.push(`Text: ${paragraphs.join(' ')}`)
  const text = parts.join('\n')
  return text.length > 1500 ? `${text.slice(0, 1500)}…` : text
}

// Verlinkte soziale Netzwerke
export function extractSocial(links: PageLink[]): string[] {
  const nets: Array<[string, RegExp]> = [
    ['Facebook', /facebook\.com/i],
    ['Instagram', /instagram\.com/i],
    ['LinkedIn', /linkedin\.com/i],
    ['XING', /xing\.com/i],
    ['YouTube', /youtube\.com|youtu\.be/i],
    ['TikTok', /tiktok\.com/i],
  ]
  return nets.filter(([, re]) => links.some((l) => re.test(l.href))).map(([name]) => name)
}

// Kontaktformular auf der Seite
export function hasContactForm(html: string): boolean {
  const $ = cheerio.load(html)
  return $('form').toArray().some((f) => $(f).find('textarea, input[type="email"]').length > 0)
}

// Strukturierte Daten (schema.org) und Handy-Darstellung
export function hasSchemaMarkup(html: string): boolean {
  return /application\/ld\+json/i.test(html) && /"@type"/.test(html)
}
export function hasViewport(html: string): boolean {
  return /<meta[^>]+name=["']viewport["']/i.test(html)
}

// Sitemap auswerten: Anzahl Seiten und jüngstes Änderungsdatum
export function parseSitemap(xml: string): { locs: string[]; childSitemaps: string[]; newest: string | null } {
  const isIndex = /<sitemapindex/i.test(xml)
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1])
  const dates = [...xml.matchAll(/<lastmod>\s*(\d{4}-\d{2}-\d{2})/gi)].map((m) => m[1]).sort()
  return {
    locs: isIndex ? [] : locs,
    childSitemaps: isIndex ? locs : [],
    newest: dates.length ? dates[dates.length - 1] : null,
  }
}
