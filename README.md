# MixMarket

<p align="center"><img src="docs/media/rundgang.gif" alt="Rundgang durch MixMarket: Firmen finden, Zielgruppe bilden, Mails freigeben, Antworten bearbeiten" width="100%"></p>
<p align="center"><sub>Rundgang mit erfundenen Beispieldaten · Walkthrough with invented sample data</sub></p>

[Deutsch](#deutsch) · [English](#english)

---

## Deutsch

MixMarket ist ein lokales Programm für gezielte B2B-Erstansprache. Es findet passende Firmen, liest deren Webseiten aus, bewertet sie mit KI für ein bestimmtes Produkt und schreibt persönliche Mails, die Sie vor dem Versand freigeben. Antworten landen im selben Programm. Mit MixMarket Pro werden sie zusätzlich eingeordnet und bekommen einen Antwortentwurf.

MixMarket läuft auf Ihrem eigenen Rechner. Die KI arbeitet über Ihr vorhandenes Claude- oder ChatGPT-Abo, ein API-Schlüssel ist nicht nötig.

### Funktionen

Alles in dieser Liste ist kostenlos:

- **Recherche:** Firmen nach Branche und Ort über OpenStreetMap finden, Webseiten durchleuchten (Ansprechpartner, Impressum, Merkmale), Zielgruppen über Merkmale zusammenstellen, KI-Bewertung je Produkt, Interessenten verwalten
- **Postausgang:** Die KI schreibt jede Mail einzeln und persönlich. Sie prüfen jede Mail und geben sie vor dem Versand frei. Auf Wunsch lässt sich die Freigabe je Produkt abschalten, Entwürfe mit Links auf fremde Seiten kommen dann trotzdem zur Prüfung. Dazu Versandfenster und Tageslimit
- **Gespräche:** Abruf des Postfachs, Zuordnung zu Interessenten, Erkennung von Rückläufern, Abwesenheitsnotizen und Abmeldungen, Antworten direkt aus MixMarket
- **Steuerung:** Übersicht „Wartet auf Sie“, Versand-Schalter, Not-Aus, automatischer Stopp bei zu vielen Rückläufern, KI-Pause bei knappem Abo-Kontingent, Auslastung
- **Klassisch:** Kontakte und Listen, Vorlagen mit Platzhaltern, Kampagnen, Sperrliste, Statistiken
- **Handbuch** in der App, Oberfläche auf Deutsch und Englisch, heller und dunkler Modus, auch auf dem Handy bedienbar

### MixMarket Pro

Pro nimmt Ihnen zusätzlich Arbeit ab. Das Abo kostet 10 € im Monat oder 100 € im Jahr, inklusive Steuer. Sie schließen es in MixMarket unter Einstellungen, „MixMarket Pro“ ab und schalten es dort mit Ihrem Schlüssel frei. Pro braucht eine Internetverbindung. Ohne Pro bleibt alles oben Genannte nutzbar.

- **Geführte Touren:** 22 Anleitungen, die Schritt für Schritt durch die App führen
- **Autopilot** für Recherche, Schreiben und Antworten
- **Nachfassen:** Nachfass-Mails im Postausgang und Nachfass-Automatisierungen für Kampagnen
- **„Alle freigeben“** im Postausgang
- **KI in Gesprächen:** Einordnung der Antworten und fertige Antwortentwürfe
- **Weitere Suchquellen:** DataForSEO und Serper
- **Vorlagenpakete** für sieben Branchen

| | |
| --- | --- |
| ![Geführte Tour](docs/media/pro-tour.png)<br>**Geführte Touren:** eine Sprechblase führt Schritt für Schritt durch die App | ![Vorlagenpakete](docs/media/pro-packs.png)<br>**Vorlagenpakete:** fertige Vorlagen für Ihr Angebot |
| ![Autopilot](docs/media/pro-autopilot.png)<br>**Autopilot:** Recherche, Schreiben und Antworten laufen selbst | ![Pro abschließen](docs/media/pro-buy.png)<br>**Pro abschließen:** direkt in den Einstellungen, monatlich oder jährlich |

### So sieht MixMarket aus

Alle Bilder zeigen erfundene Beispieldaten.

| | |
| --- | --- |
| ![Übersicht](docs/media/overview.png)<br>**Übersicht:** was auf Sie wartet, Autopilot und Not-Aus | ![Gefundene Firmen](docs/media/companies.png)<br>**Firmen finden:** Treffer mit Ansprechpartner, Kontakt, Merkmalen und KI-Passung |
| ![Zielgruppe](docs/media/cohorts.png)<br>**Zielgruppe:** Merkmale wählen, die Anzahl zählt sofort mit | ![Interessenten](docs/media/prospects.png)<br>**Interessenten:** Status, Ansprechpartner und Stand der Ansprache je Firma |
| ![Postausgang](docs/media/outbox.png)<br>**Postausgang:** persönliche Mails der KI prüfen und freigeben | ![Gespräche](docs/media/conversations.png)<br>**Gespräche:** Antworten lesen und beantworten, mit Pro eingeordnet und mit Entwurf |
| ![Steuerung](docs/media/control.png)<br>**Steuerung:** Versand, Not-Aus, Grenzen und Auslastung, mit Pro Autopilot je Bereich | ![Handbuch](docs/media/handbook.png)<br>**Handbuch:** jede Funktion erklärt, direkt in der App |

<p align="center"><img src="docs/media/mobile-overview.png" alt="Übersicht auf dem Handy" width="260">&nbsp;&nbsp;<img src="docs/media/mobile-outbox.png" alt="Postausgang auf dem Handy" width="260"></p>

### Voraussetzungen

- Node.js 22.12 oder neuer (mit npm)
- Für die KI-Funktionen: [Claude Code](https://claude.com/claude-code) (`claude`) oder die Codex CLI (`codex`), installiert und angemeldet
- Für echten Versand und Empfang: ein Postfach mit SMTP und IMAP. Ohne Postfach läuft MixMarket im Testmodus und verschickt nichts.
- Optional mit MixMarket Pro: Zugänge zu DataForSEO und Serper als weitere Suchquellen (werden in der App eingetragen)
- Optional für den Browser-Modus beim Webseiten-Auslesen: `npx playwright install chromium`

### Installation

```bash
git clone https://github.com/noosmedia/MixMarket.git
cd MixMarket
npm install
cp .env.example server/.env
npm run db:push
npm run db:seed
```

`npm install` erzeugt dabei auch den Datenbank-Client. `db:push` legt die SQLite-Datenbank unter `server/prisma/dev.db` an, `db:seed` füllt sie mit den Standardlisten, einer Beispielvorlage und den Grundeinstellungen.

Die Werte in `server/.env` können zunächst so bleiben. Den Geheimschlüssel für die Anmeldung erzeugt MixMarket beim ersten Start selbst.

### Starten

```bash
npm run dev
```

Danach ist MixMarket unter http://localhost:5261 erreichbar. Beim ersten Aufruf legen Sie Ihr Konto an. Wird die Ersteinrichtung von einem anderen Rechner aus aufgerufen, fragt MixMarket nach einem Einrichtungscode, der im Protokoll des Servers steht.

### Aktualisieren

Gibt es eine neue Version, zeigt MixMarket oben rechts einen kleinen Punkt an Ihren Initialen und im Menü **Update verfügbar**. Zum Aktualisieren beenden Sie MixMarket mit Strg+C und führen im MixMarket-Ordner aus:

```bash
git pull
npm install
npm run db:push
```

Danach starten Sie wie gewohnt mit `npm run dev`. Ihre Daten bleiben erhalten.

### Weitere Befehle

| Befehl | Wirkung |
| --- | --- |
| `npm run build` | Server und Oberfläche für den Betrieb bauen |
| `npm run db:studio` | Datenbank in Prisma Studio ansehen |
| `npm run reset-password` | Passwort neu setzen, wenn Passwort und Wiederherstellungsschlüssel verloren sind |

### Aufbau

| Ordner | Inhalt | Port |
| --- | --- | --- |
| `server/` | Backend: Node.js, TypeScript, Fastify, Prisma 7 mit SQLite | 5260 |
| `web/` | Oberfläche: React 19, Vite, TypeScript, i18next | 5261 |

### Lizenz

Der Quellcode von MixMarket steht unter der GNU Affero General Public License 3.0 (AGPL-3.0), siehe [LICENSE](LICENSE). MixMarket Pro gehört nicht zu diesem Repository.

---

## English

MixMarket is a local application for targeted B2B outreach. It finds suitable companies, reads their websites, rates them with AI for a specific product and writes personal emails that you approve before they are sent. Replies arrive in the same application. With MixMarket Pro they are also classified and get a draft answer.

MixMarket runs on your own computer. The AI works through your existing Claude or ChatGPT subscription, no API key is required.

### Features

Everything in this list is free:

- **Research:** find companies by industry and location via OpenStreetMap, analyse websites (contacts, legal notice, characteristics), build target groups from characteristics, AI rating per product, manage prospects
- **Outbox:** AI writes every email individually and personally. You review every email and approve it before it is sent. Approval can be switched off per product; drafts with links to other websites still come to you for review. Plus sending windows and a daily limit
- **Conversations:** mailbox polling, matching to prospects, detection of bounces, out-of-office replies and unsubscribes, replying directly from MixMarket
- **Control:** "Waiting for you" overview, sending switch, emergency stop, automatic stop on too many bounces, AI pause when the subscription quota runs low, usage
- **Classic:** contacts and lists, templates with placeholders, campaigns, suppression list, statistics
- **Built-in handbook**, interface in German and English, light and dark mode, also usable on a phone

### MixMarket Pro

Pro takes even more work off your hands. The subscription costs €10 per month or €100 per year, tax included. You subscribe in MixMarket under Settings, "MixMarket Pro" and unlock it there with your key. Pro needs an internet connection. Without Pro, everything listed above stays available.

- **Guided tours:** 22 step-by-step walkthroughs inside the app
- **Autopilot** for research, writing and replies
- **Follow-ups:** follow-up emails in the Outbox and follow-up automations for campaigns
- **"Approve all"** in the Outbox
- **AI in Conversations:** classification of replies and ready draft answers
- **More search sources:** DataForSEO and Serper
- **Template packs** for seven industries

| | |
| --- | --- |
| ![Guided tour](docs/media/pro-tour.png)<br>**Guided tours:** a speech bubble takes you through the app step by step | ![Template packs](docs/media/pro-packs.png)<br>**Template packs:** ready-made templates for what you offer |
| ![Autopilot](docs/media/pro-autopilot.png)<br>**Autopilot:** research, writing and replies run by themselves | ![Subscribe to Pro](docs/media/pro-buy.png)<br>**Subscribe to Pro:** right in the settings, monthly or yearly |

### Screenshots

All images show invented sample data and the German interface; English can be selected in the app.

| | |
| --- | --- |
| ![Overview](docs/media/overview.png)<br>**Overview:** what is waiting for you, autopilot and emergency stop | ![Companies found](docs/media/companies.png)<br>**Find companies:** results with contact person, contact details, characteristics and AI fit |
| ![Target group](docs/media/cohorts.png)<br>**Target group:** pick characteristics, the count updates instantly | ![Prospects](docs/media/prospects.png)<br>**Prospects:** status, contact person and outreach progress per company |
| ![Outbox](docs/media/outbox.png)<br>**Outbox:** review and approve personal AI emails | ![Conversations](docs/media/conversations.png)<br>**Conversations:** read and answer replies, with Pro classified and with a draft |
| ![Control](docs/media/control.png)<br>**Control:** sending, emergency stop, limits and usage, with Pro autopilot per area | ![Handbook](docs/media/handbook.png)<br>**Handbook:** every feature explained, right inside the app |

<p align="center"><img src="docs/media/mobile-overview.png" alt="Overview on a phone" width="260">&nbsp;&nbsp;<img src="docs/media/mobile-outbox.png" alt="Outbox on a phone" width="260"></p>

### Requirements

- Node.js 22.12 or newer (with npm)
- For the AI features: [Claude Code](https://claude.com/claude-code) (`claude`) or the Codex CLI (`codex`), installed and signed in
- For real sending and receiving: a mailbox with SMTP and IMAP. Without a mailbox MixMarket runs in test mode and sends nothing.
- Optional with MixMarket Pro: DataForSEO and Serper accounts as additional search sources (entered in the app)
- Optional for browser mode when reading websites: `npx playwright install chromium`

### Installation

```bash
git clone https://github.com/noosmedia/MixMarket.git
cd MixMarket
npm install
cp .env.example server/.env
npm run db:push
npm run db:seed
```

`npm install` also generates the database client. `db:push` creates the SQLite database at `server/prisma/dev.db`, `db:seed` fills it with the default lists, a sample template and the basic settings.

The values in `server/.env` can stay as they are for now. MixMarket creates the secret key for sign-in by itself on the first start.

### Running

```bash
npm run dev
```

MixMarket is then available at http://localhost:5261. On the first visit you create your account. If the initial setup is opened from another computer, MixMarket asks for a setup code that is printed in the server log.

### Updating

When a new version is out, MixMarket shows a small dot on your initials at the top right and **Update available** in the menu. To update, stop MixMarket with Ctrl+C and run in the MixMarket folder:

```bash
git pull
npm install
npm run db:push
```

Then start as usual with `npm run dev`. Your data is kept.

### More commands

| Command | Effect |
| --- | --- |
| `npm run build` | Build server and interface for operation |
| `npm run db:studio` | Inspect the database in Prisma Studio |
| `npm run reset-password` | Set a new password if both password and recovery key are lost |

### Structure

| Folder | Content | Port |
| --- | --- | --- |
| `server/` | Backend: Node.js, TypeScript, Fastify, Prisma 7 with SQLite | 5260 |
| `web/` | Interface: React 19, Vite, TypeScript, i18next | 5261 |

### License

The source code of MixMarket is licensed under the GNU Affero General Public License 3.0 (AGPL-3.0), see [LICENSE](LICENSE). MixMarket Pro is not part of this repository.
