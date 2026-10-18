// Interessenten je Produkt: Arbeitsliste der Erstansprache aus der Recherche.
// Hier liegt die Logik für Ansprechpartner, passende E-Mail-Adresse und die
// Übernahme in die Kontakte samt Interessentenliste des Produkts.
import { prisma } from '../db/prisma.js'
import { findBranch } from './discovery/branches.js'

export const PROSPECT_STATUSES = ['new', 'contacted', 'talking', 'declined', 'customer'] as const
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number]

// Ansatzpunkt, den die KI bei unpassenden Firmen schreibt: zählt als "kein Ansatzpunkt"
export const NO_HOOK = 'Kein sinnvoller Ansatzpunkt.'

interface PersonLike {
  fullName: string
  firstName: string | null
  lastName: string | null
  salutation: string | null
  academicTitle: string | null
  isDecisionMaker: boolean
}

// Gewählter Ansprechpartner: ausdrücklich gewählt, sonst der erste Entscheider, sonst niemand
export function pickPerson<T extends PersonLike>(people: T[], personName: string | null): T | null {
  if (personName) {
    const chosen = people.find((p) => p.fullName === personName)
    if (chosen) return chosen
  }
  return people.find((p) => p.isDecisionMaker) ?? null
}

// Umlaute und Sonderzeichen vereinheitlichen, um Namen in E-Mail-Adressen zu erkennen
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[^a-z]/g, '')
}

// Beste E-Mail für die Ansprache: persönliche Adresse des Ansprechpartners, sonst die Firmenadresse.
// Eine persönliche Adresse einer anderen Person wird nie genommen, sonst stimmen Anrede und Empfänger nicht.
export function pickEmail(
  person: PersonLike | null,
  companyEmail: string | null,
  emailSignals: Array<{ valueText: string | null; valueNum: number | null }>,
): { email: string | null; personal: boolean } {
  const last = person?.lastName ? normalize(person.lastName) : ''
  if (last.length >= 3) {
    for (const s of emailSignals) {
      if (!s.valueText || s.valueNum !== 1) continue
      const local = normalize(s.valueText.split('@')[0] ?? '')
      if (local.includes(last)) return { email: s.valueText.toLowerCase(), personal: true }
    }
  }
  return { email: companyEmail ? companyEmail.toLowerCase() : null, personal: false }
}

// Branche für den Kontakt: deutsche Bezeichnung der Suche, über die die Firma gefunden wurde.
// Rohwerte der Quellen wie "apartment" aus OpenStreetMap werden nicht übernommen.
function sectorOf(company: {
  category: string | null
  finds: Array<{ search: { branchKey: string | null; term: string } }>
}): string | null {
  for (const f of company.finds) {
    const branch = findBranch(f.search.branchKey)
    if (branch) return branch.de
    if (f.search.term.trim()) return f.search.term.trim()
  }
  return company.category && !/^[a-z_]+$/.test(company.category) ? company.category : null
}

// Alle Vornamen ("Hans Peter" bei "Hans Peter von Muster"): voller Name ohne Titel und Nachnamen
function givenNames(person: PersonLike): string | null {
  let name = person.fullName.trim()
  if (person.academicTitle && name.startsWith(person.academicTitle)) name = name.slice(person.academicTitle.length).trim()
  if (person.lastName && name.endsWith(person.lastName)) name = name.slice(0, -person.lastName.length).trim()
  return name || person.firstName
}

// Interessentenliste des Produkts finden oder anlegen
async function productList(productId: string, productName: string) {
  const existing = await prisma.list.findFirst({ where: { productId }, orderBy: { createdAt: 'asc' } })
  if (existing) return existing
  return prisma.list.create({
    data: {
      name: `Interessenten ${productName}`,
      description: `Aus der Recherche übernommene Firmen für ${productName}`,
      productId,
    },
  })
}

export interface ToContactsResult {
  created: number
  linked: number
  noEmail: number
  suppressed: number
  // Interessenten mit Status "Kein Interesse" werden nicht übernommen
  declined: number
  listName: string
}

// Interessenten mit E-Mail in die Kontakte übernehmen (Herkunft Recherche, ohne Einwilligung)
export async function prospectsToContacts(productId: string, ids?: string[]): Promise<ToContactsResult> {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new Error('Produkt nicht gefunden')
  const where = { productId, ...(ids?.length ? { id: { in: ids } } : {}) }
  // Wer kein Interesse hat (auch nach einer Abmeldung), wird nicht erneut zum Kontakt
  const declined = await prisma.prospect.count({ where: { ...where, status: 'declined' } })
  const prospects = await prisma.prospect.findMany({
    where: { ...where, status: { not: 'declined' } },
    include: {
      company: {
        include: {
          people: true,
          signals: { where: { code: 'EMAIL' } },
          finds: { include: { search: { select: { branchKey: true, term: true } } }, orderBy: { createdAt: 'asc' } },
        },
      },
    },
  })
  const list = await productList(productId, product.name)
  const result: ToContactsResult = { created: 0, linked: 0, noEmail: 0, suppressed: 0, declined, listName: list.name }

  for (const p of prospects) {
    const person = pickPerson(p.company.people, p.personName)
    const { email } = pickEmail(person, p.company.email, p.company.signals)
    if (!email) {
      result.noEmail++
      continue
    }
    // Gesperrte Adressen nie übernehmen
    const blocked = await prisma.suppression.findUnique({ where: { email } })
    if (blocked) {
      result.suppressed++
      continue
    }
    // Vorhandenen Kontakt nur verknüpfen, nichts doppelt anlegen
    let contact = await prisma.contact.findUnique({ where: { email } })
    if (contact) {
      if (!contact.companyId) {
        contact = await prisma.contact.update({ where: { id: contact.id }, data: { companyId: p.companyId } })
      }
      result.linked++
    } else {
      contact = await prisma.contact.create({
        data: {
          email,
          firstName: person ? givenNames(person) : null,
          lastName: person?.lastName ?? null,
          salutation: person?.salutation ?? null,
          academicTitle: person?.academicTitle ?? null,
          company: p.company.name,
          website: p.company.website,
          sector: sectorOf(p.company),
          source: 'research',
          consent: false,
          companyId: p.companyId,
        },
      })
      result.created++
    }
    await prisma.contactList.upsert({
      where: { contactId_listId: { contactId: contact.id, listId: list.id } },
      update: {},
      create: { contactId: contact.id, listId: list.id },
    })
    await prisma.prospect.update({ where: { id: p.id }, data: { contactId: contact.id } })
  }
  return result
}
