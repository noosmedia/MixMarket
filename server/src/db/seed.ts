// Befüllt die Datenbank mit Standardlisten, einer Beispielvorlage und den Grundeinstellungen.
// Ein Konto legt das Skript bewusst nicht an: das geschieht bei der Ersteinrichtung in der App.
// Mehrfach ausführbar (idempotent).
import { prisma } from './prisma.js'
import { logger } from '../utils/logger.js'

async function seed(): Promise<void> {

  // Standardlisten
  const defaultLists = [
    { name: 'Aktive Kontakte', type: 'normal' },
    { name: 'Abgemeldet', type: 'unsubscribed' },
    { name: 'Unzustellbar', type: 'bounced' },
  ]
  for (const l of defaultLists) {
    const exists = await prisma.list.findFirst({ where: { name: l.name } })
    if (!exists) await prisma.list.create({ data: l })
  }

  // Beispielvorlage
  const tplName = 'Erstansprache (Beispiel)'
  const tplExists = await prisma.template.findFirst({ where: { name: tplName } })
  if (!tplExists) {
    await prisma.template.create({
      data: {
        name: tplName,
        subject: 'Kurze Frage zu {{company}}',
        htmlBody: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#2a2a2a;line-height:1.7;max-width:560px;">
  <p>Guten Tag {{firstName}},</p>
  <p>ich bin auf {{company}} aufmerksam geworden und habe einen konkreten Anknüpfungspunkt zu Ihrem Bereich.</p>
  <p>Hätten Sie Interesse an einem kurzen Austausch dazu?</p>
  <p>Beste Grüße</p>
</div>`,
        textBody: 'Guten Tag {{firstName}}, ich bin auf {{company}} aufmerksam geworden ...',
      },
    })
  }

  // Einstellungen-Singleton
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      unsubFooterDe: 'Sie möchten keine weiteren E-Mails von uns erhalten?',
      unsubFooterEn: 'You no longer wish to receive emails from us?',
    },
  })

  logger.info('Seed abgeschlossen')
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Seed fehlgeschlagen', error)
    process.exit(1)
  })
