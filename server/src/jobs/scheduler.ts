// Hintergrund-Scheduler. Läuft minütlich und erledigt diese Aufgaben:
// 1. Fällige geplante Kampagnen versenden.
// 2. Postausgang: freigegebene Mails im Versandfenster senden.
// 3. Gespräche: Postfach abrufen.
// 4. Aufgaben von MixMarket Pro (Autopilot, Automatisierungen, Nachfass-Mails, KI in Gespräche),
//    nur wenn Pro geladen ist.
import cron from 'node-cron'
import { prisma } from '../db/prisma.js'
import { logger } from '../utils/logger.js'
import { executeCampaign } from '../services/campaign.service.js'
import { processOutbox } from '../services/outbox.service.js'
import { processInbox } from '../services/inbox.service.js'
import { isSendingStopped } from '../services/control.service.js'
import { runProJobs } from '../pro/host.js'

// Geplante Kampagnen pruefen
async function processScheduledCampaigns(): Promise<void> {
  // Bei Not-Aus bleiben fällige Kampagnen geplant und starten nach der Freigabe
  if (await isSendingStopped()) return
  const due = await prisma.campaign.findMany({
    where: { status: 'scheduled', scheduledAt: { lte: new Date() } },
  })
  for (const campaign of due) {
    logger.info(`Geplante Kampagne "${campaign.name}" wird jetzt versendet`)
    await executeCampaign(campaign.id)
  }
}

// Scheduler starten
export function startScheduler(): void {
  // Jede Minute pruefen
  cron.schedule('* * * * *', async () => {
    try {
      await processScheduledCampaigns()
    } catch (error) {
      logger.error('Fehler im Scheduler-Durchlauf', error)
    }
    // Eigener Block, damit ein Fehler bei Kampagnen den Postausgang nicht aufhält
    try {
      await processOutbox()
    } catch (error) {
      logger.error('Fehler im Postausgang', error)
    }
    try {
      await processInbox()
    } catch (error) {
      logger.error('Fehler bei den Gesprächen', error)
    }
    // Hintergrundaufgaben von MixMarket Pro (nur wenn geladen)
    await runProJobs()
  })
  logger.info('Scheduler gestartet (minuetliche Pruefung)')
}
