// Teile des Kerns, die das Pro-Paket benutzen darf.
// Das Pro-Paket enthält keinen Kern-Code. Es schreibt Importe wie "@core/services/outbox.service";
// der Pro-Build ersetzt sie durch einen Zugriff auf diese Liste. So arbeiten Kern und Pro mit
// denselben Instanzen (Datenbank, Warteschlangen, Einstellungen).
import * as prisma from '../db/prisma.js'
import * as logger from '../utils/logger.js'
import * as env from '../utils/env.js'
import * as secrets from '../utils/secrets.js'
import * as safeFetch from '../utils/safe-fetch.js'
import * as auth from '../middleware/auth.js'
import * as activity from '../services/activity.service.js'
import * as control from '../services/control.service.js'
import * as mailer from '../services/mailer.service.js'
import * as tracking from '../services/tracking.service.js'
import * as template from '../services/template.service.js'
import * as campaign from '../services/campaign.service.js'
import * as outbox from '../services/outbox.service.js'
import * as inbox from '../services/inbox.service.js'
import * as prospects from '../services/prospects.service.js'
import * as aiProviders from '../services/ai/providers.js'
import * as scoring from '../services/ai/scoring.js'
import * as cohorts from '../services/discovery/cohorts.js'
import * as discoveryProviders from '../services/discovery/providers.js'
import * as discovery from '../services/discovery/discovery.service.js'
import * as profiler from '../services/discovery/profiler.js'
import * as branches from '../services/discovery/branches.js'
import * as host from './host.js'

// Schlüssel = Pfad unterhalb von server/src ohne Endung, so wie das Pro-Paket ihn importiert
export const proCore: Record<string, unknown> = {
  'db/prisma': prisma,
  'utils/logger': logger,
  'utils/env': env,
  'utils/secrets': secrets,
  'utils/safe-fetch': safeFetch,
  'middleware/auth': auth,
  'services/activity.service': activity,
  'services/control.service': control,
  'services/mailer.service': mailer,
  'services/tracking.service': tracking,
  'services/template.service': template,
  'services/campaign.service': campaign,
  'services/outbox.service': outbox,
  'services/inbox.service': inbox,
  'services/prospects.service': prospects,
  'services/ai/providers': aiProviders,
  'services/ai/scoring': scoring,
  'services/discovery/cohorts': cohorts,
  'services/discovery/providers': discoveryProviders,
  'services/discovery/discovery.service': discovery,
  'services/discovery/profiler': profiler,
  'services/discovery/branches': branches,
  'pro/host': host,
}

// Unter diesem Namen findet das geladene Pro-Paket die Kernteile (host.ts setzt ihn vor dem Laden)
export const PRO_CORE_GLOBAL = '__MIXMARKET_CORE__'
