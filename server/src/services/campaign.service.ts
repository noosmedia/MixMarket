// Logik rund um Kampagnen: Empfänger ermitteln, Versand ausführen,
// Kennzahlen pflegen. Beruecksichtigt Sperrliste und Drosselung.
import { prisma } from '../db/prisma.js'
import { env } from '../utils/env.js'
import { logger } from '../utils/logger.js'
import { STOPPED_MESSAGE, isSendingStopped } from './control.service.js'
import { sendMail } from './mailer.service.js'
import { assembleEmail } from './tracking.service.js'
import { renderTemplate, usesPlaceholder } from './template.service.js'
import { NO_HOOK } from './prospects.service.js'
import { SYSTEM, logActivity } from './activity.service.js'

// Kurze Pause zwischen Mails (Drosselung)
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Ermittelt alle versandfaehigen Kontakte einer Kampagne.
// Schließt gesperrte, abgemeldete und gebouncte Adressen aus.
export async function resolveRecipients(campaignId: string): Promise<string[]> {
  // Listen der Kampagne laden
  const campaignLists = await prisma.campaignList.findMany({
    where: { campaignId },
    select: { listId: true },
  })
  const listIds = campaignLists.map((l) => l.listId)
  if (listIds.length === 0) return []

  // Kontakte aus diesen Listen (eindeutig)
  const memberships = await prisma.contactList.findMany({
    where: { listId: { in: listIds } },
    select: { contactId: true },
  })
  const contactIds = [...new Set(memberships.map((m) => m.contactId))]

  // Nur aktive Kontakte
  const contacts = await prisma.contact.findMany({
    where: { id: { in: contactIds }, status: 'active' },
    select: { id: true, email: true },
  })

  // Sperrliste abziehen
  const suppressed = await prisma.suppression.findMany({
    where: { email: { in: contacts.map((c) => c.email) } },
    select: { email: true },
  })
  const blocked = new Set(suppressed.map((s) => s.email.toLowerCase()))

  return contacts.filter((c) => !blocked.has(c.email.toLowerCase())).map((c) => c.id)
}

// Ansatzpunkt der KI je Kontakt: über die Interessentenliste eines Produkts, in der der
// Kontakt steht (nur Listen aus listIds, ohne Angabe alle seine Listen), und die verknüpfte Firma.
export async function hooksForContacts(contactIds: string[], listIds?: string[]): Promise<Map<string, string | null>> {
  const hooks = new Map<string, string | null>()
  if (contactIds.length === 0) return hooks
  const memberships = await prisma.contactList.findMany({
    where: {
      contactId: { in: contactIds },
      ...(listIds ? { listId: { in: listIds } } : {}),
      list: { productId: { not: null } },
    },
    select: { contactId: true, list: { select: { productId: true } } },
  })
  const contacts = await prisma.contact.findMany({
    where: { id: { in: contactIds } },
    select: { id: true, companyId: true },
  })
  const companyOf = new Map(contacts.map((c) => [c.id, c.companyId]))
  // Paare aus Firma und Produkt sammeln und Bewertungen in einem Rutsch laden
  const pairs = memberships
    .map((m) => ({ contactId: m.contactId, companyId: companyOf.get(m.contactId) ?? null, productId: m.list.productId }))
    .filter((p): p is { contactId: string; companyId: string; productId: string } => !!p.companyId && !!p.productId)
  for (const id of contactIds) hooks.set(id, null)
  if (pairs.length === 0) return hooks
  const scores = await prisma.companyScore.findMany({
    where: { OR: pairs.map((p) => ({ companyId: p.companyId, productId: p.productId })) },
    select: { companyId: true, productId: true, hook: true },
  })
  const hookOf = new Map(scores.map((s) => [`${s.companyId}:${s.productId}`, s.hook]))
  for (const p of pairs) {
    if (hooks.get(p.contactId)) continue
    const hook = hookOf.get(`${p.companyId}:${p.productId}`)
    if (hook && hook !== NO_HOOK) hooks.set(p.contactId, hook)
  }
  return hooks
}

// Prüfung vor dem Versand: Empfänger, davon ohne dokumentierte Einwilligung (und davon aus der Recherche),
// wie vielen der Ansatzpunkt fehlt, falls die Vorlage {{ansatz}} nutzt, ob Vorlage und Postanschrift fehlen
export async function recipientCheck(campaignId: string) {
  const ids = await resolveRecipients(campaignId)
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { template: { select: { htmlBody: true } }, lists: { select: { listId: true } } },
  })
  const [withoutConsent, researchWithoutConsent, settings] = await Promise.all([
    prisma.contact.count({ where: { id: { in: ids }, consent: false } }),
    prisma.contact.count({ where: { id: { in: ids }, source: 'research', consent: false } }),
    prisma.settings.findUnique({ where: { id: 'singleton' }, select: { postalAddress: true } }),
  ])
  const needsHook = usesPlaceholder(campaign?.template?.htmlBody, 'ansatz') || usesPlaceholder(campaign?.subject, 'ansatz')
  let missingHook = 0
  if (needsHook) {
    const hooks = await hooksForContacts(ids, campaign?.lists.map((l) => l.listId))
    missingHook = [...hooks.values()].filter((h) => !h).length
  }
  return {
    count: ids.length,
    withoutConsent,
    researchWithoutConsent,
    usesHook: needsHook,
    missingHook,
    missingTemplate: !campaign?.templateId,
    missingPostalAddress: !settings?.postalAddress?.trim(),
  }
}

// Führt den Versand einer Kampagne aus (sofort oder durch den Scheduler).
// Bricht der Versand mit einem Fehler ab, wird die Kampagne pausiert und der Fehler protokolliert.
// Beim Fortsetzen werden bereits versendete Mails übersprungen.
export async function executeCampaign(campaignId: string): Promise<void> {
  try {
    await runCampaign(campaignId)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`Versand der Kampagne ${campaignId} abgebrochen`, message)
    await pauseCampaign(campaignId, message)
  }
}

// Kampagne nach einem Abbruch pausieren; Zähler aus den tatsächlichen Versanddatensätzen
export async function pauseCampaign(campaignId: string, error: string): Promise<void> {
  try {
    const [sentCount, failedCount] = await Promise.all([
      prisma.send.count({ where: { campaignId, status: 'sent' } }),
      prisma.send.count({ where: { campaignId, status: 'failed' } }),
    ])
    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'paused', sentCount, failedCount },
      select: { name: true },
    })
    void logActivity(SYSTEM, {
      area: 'campaigns',
      action: 'campaign.sendFailed',
      level: 'error',
      entityType: 'campaign',
      entityId: campaignId,
      label: campaign.name,
      params: { sent: sentCount },
      details: { error },
    })
  } catch (inner) {
    logger.error(`Kampagne ${campaignId} konnte nach dem Abbruch nicht pausiert werden`, inner)
  }
}

// Eigentlicher Versandlauf einer Kampagne
async function runCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { template: true },
  })
  if (!campaign) {
    logger.warn(`Kampagne ${campaignId} nicht gefunden`)
    return
  }
  if (campaign.status === 'sending' || campaign.status === 'sent') {
    logger.info(`Kampagne ${campaign.name} laeuft bereits oder ist abgeschlossen`)
    return
  }
  // Ohne Vorlage würde nur der Footer verschickt: abbrechen, die Kampagne wird pausiert
  if (!campaign.template) throw new Error('Keine Vorlage gewählt')

  // Einstellungen für Footer laden
  const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })

  const contactIds = await resolveRecipients(campaignId)
  logger.info(`Kampagne "${campaign.name}" startet Versand an ${contactIds.length} Empfänger`)

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'sending', totalCount: contactIds.length },
  })
  // Nur Start und Ende werden protokolliert, nicht die einzelnen Mails
  void logActivity(SYSTEM, {
    area: 'campaigns',
    action: 'campaign.sendStarted',
    entityType: 'campaign',
    entityId: campaignId,
    label: campaign.name,
    params: { count: contactIds.length },
  })

  let sent = 0
  let failed = 0
  let firstError: string | null = null
  // Ansatzpunkte für {{ansatz}} aus den Interessentenlisten der Kampagne
  const campaignListIds = (await prisma.campaignList.findMany({ where: { campaignId }, select: { listId: true } })).map(
    (l) => l.listId,
  )
  const hooks = await hooksForContacts(contactIds, campaignListIds)

  for (const contactId of contactIds) {
    // Not-Aus: Versand sofort beenden, die Kampagne wird pausiert und lässt sich später fortsetzen
    if (await isSendingStopped()) throw new Error(STOPPED_MESSAGE)
    const contact = await prisma.contact.findUnique({ where: { id: contactId } })
    if (!contact) continue

    // Send-Datensatz anlegen (oder vorhandenen überspringen)
    const existing = await prisma.send.findUnique({
      where: { campaignId_contactId: { campaignId, contactId } },
    })
    if (existing && existing.status === 'sent') continue

    const send =
      existing ??
      (await prisma.send.create({ data: { campaignId, contactId, status: 'queued' } }))

    // Inhalt rendern (Platzhalter ersetzen) und Tracking einbauen
    // Sprache der Vorlage bestimmt Anrede, Abmelde-Hinweis und Footer
    const language = campaign.template?.language === 'en' ? 'en' : 'de'
    const htmlBody = campaign.template
      ? renderTemplate(campaign.template.htmlBody, contact, { ansatz: hooks.get(contact.id), language, html: true })
      : ''
    const mail = assembleEmail({
      body: htmlBody,
      trackingId: send.trackingId,
      language,
      signatureHtml: settings?.signatureHtml,
      unsubFooter: language === 'en' ? settings?.unsubFooterEn : settings?.unsubFooterDe,
      postalAddress: settings?.postalAddress,
    })
    const subject = renderTemplate(campaign.subject, contact, { ansatz: hooks.get(contact.id), language })

    const result = await sendMail({
      to: contact.email,
      subject,
      html: mail.html,
      text: mail.text,
      fromName: campaign.fromName,
      fromEmail: campaign.fromEmail,
      headers: {
        'List-Unsubscribe': `<${env.publicApiUrl}/t/u/${send.trackingId}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    // Not-Aus kam dazwischen: Kampagne pausieren, dieser Empfänger bleibt offen
    if (result.stopped) throw new Error(STOPPED_MESSAGE)
    if (result.success) {
      sent++
      await prisma.send.update({
        where: { id: send.id },
        data: { status: 'sent', sentAt: new Date(), messageId: result.messageId },
      })
    } else {
      failed++
      firstError ??= result.error ?? null
      await prisma.send.update({
        where: { id: send.id },
        data: { status: 'failed', errorMessage: result.error },
      })
    }

    // Drosselung zum Schutz der Zustellbarkeit
    if (env.send.delayMs > 0) await delay(env.send.delayMs)
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'sent', sentAt: new Date(), sentCount: sent, failedCount: failed },
  })
  logger.info(`Kampagne "${campaign.name}" abgeschlossen: ${sent} versendet, ${failed} fehlgeschlagen`)
  void logActivity(SYSTEM, {
    area: 'campaigns',
    action: 'campaign.sendFinished',
    level: failed > 0 ? 'warning' : 'info',
    entityType: 'campaign',
    entityId: campaignId,
    label: campaign.name,
    params: { sent, failed },
    ...(firstError ? { details: { error: firstError } } : {}),
  })
}
