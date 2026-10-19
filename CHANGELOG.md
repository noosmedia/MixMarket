# Changelog

Alle Änderungen an MixMarket, nach Semantic Versioning.

## 0.18.0 (19.10.2026)

### Neu
- MixMarket als installierbares Programm für Windows, macOS und Linux (Installer, .dmg, AppImage, .deb, .rpm). Es steht mit Symbol im Startmenü, öffnet in einem eigenen Fenster und braucht kein Node.js und kein Terminal
- Startbildschirm beim Öffnen; scheitert der Start, zeigt er die vollständige Meldung mit Protokoll, Datenordner und „Erneut versuchen“
- Fenster mit Mindestgröße 1024 × 700, damit Kopfleiste, Tabellen und Fenster immer vollständig Platz haben; Größe und Lage merkt sich das Programm
- Updates im Programm: „Jetzt aktualisieren“ lädt die neue Version mit Fortschrittsanzeige, sichert vorher die Datenbank und startet neu. Unter macOS führt der Knopf zur Download-Seite
- Daten des Programms liegen im Benutzerordner und bleiben bei Updates und beim Deinstallieren erhalten
- Geführte Touren lassen sich auch über die Übersicht und das Benutzermenü starten

### Geändert
- Browser-Modus beim Webseiten-Auslesen nutzt ein vorhandenes Google Chrome oder Microsoft Edge, wenn der Playwright-Chromium fehlt
- README beschreibt beide Wege: Installation als Programm und aus dem Quellcode

### Behoben
- Windows: Codex (über npm installiert) wurde nicht gefunden, der Suchpfad kam bei Claude Code und Codex nicht an, und bei jeder KI-Anfrage hätte sich ein Konsolenfenster geöffnet
- Anmeldung im Produktionsbetrieb ohne https war nicht möglich
- Beim Beenden wartete der Server auf offene Verbindungen und beendete sich dadurch verzögert

## 0.17.0 (19.10.2026)

### Neu
- MixMarket Pro: Abo für 10 € im Monat oder 100 € im Jahr, inklusive Steuer. Abschließen, mit dem Schlüssel freischalten und das Abo verwalten geht in den Einstellungen unter „MixMarket Pro“. Pro braucht eine Internetverbindung. Ist Pro aktiv, steht klein „Pro“ hinter MixMarket in der Kopfleiste
- Pro: 22 geführte Touren in vier Gruppen (Einrichten, Kunden finden und persönlich anschreiben, Rundmails an viele, Im Alltag). Die Seite wird abgedunkelt, eine Sprechblase erklärt jeden Schritt, die Tour schaltet selbst weiter und arbeitet mit echten Daten. Vor jedem echten Versand weist sie ausdrücklich darauf hin
- Pro: Vorlagenpakete für sieben Branchen mit je drei Vorlagen (Deutsch und Englisch), KI-Hinweisen für die persönliche Ansprache und passenden Branchen für die Firmensuche
- Firmensuche lässt sich mit vorgewählter Branche öffnen
- Handbuch: Abschnitte „MixMarket Pro“, „Geführte Touren“ und „Vorlagenpakete“
- Lizenz: Der Quellcode von MixMarket steht unter der AGPL-3.0

### Geändert
- Diese Funktionen gehören jetzt zu MixMarket Pro: Autopilot für Recherche, Schreiben und Antworten, Nachfass-Mails im Postausgang, Nachfass-Automatisierungen, „Alle freigeben“, KI-Einordnung und Antwortentwürfe in Gesprächen sowie die Suchquellen DataForSEO und Serper. Ohne Pro zeigen diese Stellen das Zeichen „Pro“ und erklären die Funktion. Alles andere bleibt kostenlos
- README trennt kostenlose Funktionen und Pro, mit neuen Bildern und neuem Rundgang

### Behoben
- Durchleuchten: Wörter wie „Familienunternehmen“ gelten nicht mehr als Vorname, Rollen auf Teamseiten stehen nicht mehr doppelt, Satzbruchstücke aus Fließtext werden nicht mehr als Rolle übernommen
- Allgemeine Adressen werden besser erkannt, auch „de-info@“, Abteilungen und Kennziffern
- Anrede: Bei eindeutigen Vornamen schreibt die KI zuverlässiger „Sehr geehrter Herr“ oder „Sehr geehrte Frau“ statt der neutralen Anrede

## 0.16.0 (18.10.2026)

### Neu
- Update-Hinweis: MixMarket sieht einmal am Tag auf GitHub nach, ob es eine neuere Version gibt. Ist eine da, erscheint ein kleiner pulsierender Punkt an den Initialen oben rechts und im Benutzermenü der Punkt „Update verfügbar“
- Fenster mit den Neuerungen seit der eigenen Version und den Befehlen zum Aktualisieren, mit Kopierknopf; ohne Update heißt der Menüpunkt „Nach Updates suchen“
- Handbuch (Einstellungen, Updates) und README (Aktualisieren) beschreiben den Ablauf

## 0.15.3 (18.10.2026)

### Behoben
- Postausgang: Seit 0.15.0 verlangte der Auftrag an die KI eine Angabe zur Anrede, die das Antwortschema für das ChatGPT-Abo nicht erlaubte. Mit GPT-5.6-Luna hing das Schreiben dadurch meist bis zur Zeitüberschreitung, andere Modelle schrieben die Angabe oder fremde Zeichen in den Mailtext. Das Schema enthält die Anrede jetzt; damit wird die Anrede auch beim ChatGPT-Abo aus dem Vornamen abgeleitet

## 0.15.2 (18.10.2026)

### Behoben
- Die KI schrieb mit manchen Modellen Emojis in Mails. Jetzt verbietet die Anweisung an die KI Emojis, und MixMarket entfernt sie zusätzlich aus allen KI-Texten (Postausgang, Antworten, Bewertung). ©, ® und ™ bleiben erhalten

## 0.15.1 (18.10.2026)

### Geändert
- KI-Bewertung: Die Voreinstellung heißt „Standard des Abos“ ohne „empfohlen“. Der Hinweis erklärt, dass das Abo das Modell bestimmt und für E-Mails meist ein kleineres Modell reicht

## 0.15.0 (18.10.2026)

### Neu
- Übersicht: Liste „Erste Schritte“ (Firma und Anschrift, KI, Postfach, erstes Produkt, erste Suche) mit Haken, Fortschritt und Sprung zur passenden Stelle; verschwindet, wenn alles erledigt ist
- Recherche: Knopf „Erneut suchen“ für fehlgeschlagene Suchen, Hinweis während einer laufenden Suche
- Postausgang: Die Vorschau zeigt Signatur, Postanschrift und Abmeldehinweis so, wie sie beim Versand angehängt werden
- Postausgang: Die KI leitet die Anrede (Herr/Frau) aus dem Vornamen ab, wenn sie unbekannt ist, und speichert sie am Kontakt
- KI-Bewertung: Modell als Auswahlliste (Claude: Opus, Sonnet, Haiku; ChatGPT: Modelle des angemeldeten Abos) statt Freitext
- Postfach: Tipp zur eigenen Absender-Domain mit SPF, DKIM und DMARC
- Ladeanzeige beim ersten Öffnen statt leerer Seite

### Geändert
- „Signatur (HTML)“ heißt „Signatur“: normaler Text mit Zeilenumbrüchen genügt, HTML geht weiterhin
- Recherche: Feld „Höchstens“ heißt „Höchstzahl“ mit Angaben wie „100 Firmen“
- Zielgruppen: Die gewählten Merkmale stehen beim Speichern über dem Namensfeld, die Knöpfe verrutschen nicht mehr
- Mengenangaben in Meldungen mit Einzahl und Mehrzahl („1 Firma“, „3 Firmen“)
- Handbuch an alle Änderungen angepasst
- Hinweis von Prisma auf neue Versionen beim Installieren ausgeblendet

### Behoben
- Doppelter Gruß, wenn die Signatur schon eine Grußformel enthält (Postausgang und Antworten)
- OpenStreetMap-Suchen brachen unter Last zu früh ab; jetzt längere Wartezeit, neuer Versuch und eine verständliche Meldung
- Funktion von Ansprechpartnern enthielt angehängte Telefon- und E-Mail-Angaben („GeschäftsführerTelefon: …“)
- Sprünge aus „Erste Schritte“ zu Unternehmen und Postfach landeten unter der festen Kopfleiste

## 0.14.2 (18.10.2026)

### Neu
- README auf Deutsch und Englisch mit Beschreibung, Voraussetzungen, Installation und Start

### Geändert
- Prisma 7.10.1 statt 6: Verbindung über den Treiber better-sqlite3, Datenbankadresse in server/prisma.config.ts, der Client wird bei npm install und npm run build nach server/src/generated/prisma erzeugt
- Zeitangaben werden weiter als Millisekunden-Zahl gespeichert, bestehende Datenbanken bleiben unverändert nutzbar; relative SQLite-Pfade gelten wie bisher ab server/prisma/
- .env.example: Hinweis, dass die Datei nach server/.env gehört

### Behoben
- npm audit meldet keine Lücken mehr (deepmerge-ts im Prisma-Kommandozeilenwerkzeug)

## 0.14.1 (18.10.2026)

### Behoben
- Durchleuchten und Webseiten-Auslesen konnten Adressen im eigenen Netz erreichen (IPv4 in IPv6-Schreibweise, Umbiegen der DNS-Antwort, Weiterleitungen); jetzt prüft ein gesicherter Abrufer die tatsächlich verbundene Adresse
- Webseiten-Auslesen nahm jedes Schema an (auch file://) und hatte keine Grenzen; jetzt nur http und https, höchstens 50 Adressen, Seiten bis 1,5 MB, Browser-Modus nur auf Wunsch und mit geprüften Anfragen
- Platzhalter in Kampagnen und Automatisierungen setzten fremdes HTML ungeprüft in Mails ein; jetzt als Text, im Betreff ohne Zeilenumbrüche
- Klick-Links ließen sich als offene Weiterleitung missbrauchen; jetzt signiert, unsignierte Ziele nur über eine Zwischenseite
- Ändernde Anfragen sind nur noch von der eigenen Oberfläche aus möglich (Herkunftsprüfung, Anmelde-Cookie sameSite strict)
- Fehlversuchssperre: Netzwerkadresse nur noch vom eingetragenen Reverse-Proxy übernommen (TRUST_PROXY), keine harte Kontosperre mehr (Aussperren durch Dritte), Liste wird aufgeräumt, gleiche Antwortzeit bei unbekannter E-Mail
- Ersteinrichtung von einem anderen Rechner nur mit Einrichtungscode aus dem Serverprotokoll, Anlegen des Kontos gegen doppelte Anfragen geschützt
- Abmelden macht die Anmeldung ungültig (alle Geräte)
- Drosselung der öffentlichen Tracking-Routen und der Anmeldung, wiederholte Öffnungen und Klicks werden nicht mehrfach gespeichert
- Sicherheits-Header (CSP, nosniff, X-Frame-Options, Referrer-Policy), interne Fehlertexte gehen nicht mehr an die Oberfläche, Health-Check ohne Angaben zur Einrichtung
- Vorlagenvorschau in einem abgeschotteten Rahmen ohne Skripte, Formulare und externe Inhalte
- Postausgang ohne Freigabe: KI-Entwürfe mit Links auf fremde Domains gehen trotzdem zur Freigabe
- KI-Programme erhalten nur die nötigen Umgebungsvariablen, keine Geheimnisse von MixMarket; Modellnamen dürfen nicht mit einem Bindestrich beginnen
- Beispielwert für JWT_SECRET aus der Vorlage .env.example entfernt; zu kurze oder offensichtliche Beispielwerte werden abgewiesen
- Ist der Server kurz nicht erreichbar, erscheint nicht mehr die Anmeldeseite, sondern ein Hinweis mit automatischer Wiederholung

### Geändert
- Server lauscht standardmäßig nur auf diesem Rechner (HOST=127.0.0.1, einstellbar)
- Abhängigkeiten aktualisiert (u. a. Fastify 5.12.7, React Router 7.18.4, undici 7.30.1, node-cron 4.6.0); unbenutzte Pakete entfernt (@fastify/static, @fastify/multipart, nanoid)

### Bekannt
- npm audit meldet noch eine Lücke in deepmerge-ts, die nur im Prisma-Kommandozeilenwerkzeug beim Entwickeln steckt; behoben erst mit Prisma 7

## 0.14.0 (17.10.2026)

### Neu
- Übersicht als Schaltzentrale: oben "Wartet auf Sie" mit Freigaben, neuen Antworten, Entwürfen, Fehlern, Rückläufern, pausierten Kampagnen und Hinweisen (Abmeldungen per Link oder Antwort, gesperrte Adressen, Not-Aus, KI-Pause) zum Abhaken
- Autopilot je Bereich: Recherche durchleuchtet fertige Suchen und bewertet gespeicherte Zielgruppen selbst, Schreiben übernimmt Firmen ab einer Mindestpassung selbst in den Postausgang (höchstens das Tageslimit je Tag), Versand und Antworten lassen sich anhalten
- Not-Aus: stoppt sofort Postausgang, Kampagnen, Nachfass-Automatisierungen und Antworten; roter Balken auf jeder Seite mit Freigabe
- Automatischer Not-Aus bei zu vielen Rückläufern in 24 Stunden (Grenze einstellbar, Standard 5 % ab 20 Mails, immer ab 10 Rückläufern)
- Auslastung: Claude-Abo und ChatGPT-Abo mit 5-Stunden- und Wochenkontingent, KI-Aufrufe je Bereich, Versand heute, Rückläufer in 24 Stunden
- KI-Pause ab einstellbarer Auslastung (Standard 80 %): KI-Aufträge warten und laufen danach weiter; gelber Balken auf jeder Seite
- Jeder KI-Aufruf wird gezählt; Bereich Steuerung im Aktivitätsprotokoll, Handelnder "Autopilot"

### Geändert
- Die Übersicht zeigt Kennzahlen, Verlauf und Schnellzugriff jetzt unterhalb von Wartet auf Sie, Steuerung und Auslastung

## 0.13.0 (17.10.2026)

### Neu
- Gespräche: MixMarket ruft das Postfach (IMAP) alle 2 Minuten nur lesend ab und übernimmt Antworten auf eigene Mails, Mails bekannter Kontakte und Rückläufer; alle anderen Mails bleiben unberührt und werden nicht gespeichert
- Eine echte Antwort beendet den Ablauf im Postausgang sofort und setzt den Interessenten auf Im Gespräch
- KI-Einordnung jeder Antwort (Interesse, Frage, Kein Interesse, Abmeldung, Sonstiges) mit Zusammenfassung; Kein Interesse und Abmeldung ändern den Status, ein Abmeldewunsch per Antwort setzt die Adresse auf die Sperrliste; Einordnung von Hand änderbar
- Antwortentwürfe der KI bei Interesse und Fragen, auf Knopfdruck auch sonst, oder selbst schreiben; Senden nur per Klick, als Antwort im selben Verlauf mit Signatur, Postanschrift und zitierter Mail, ohne Zählpixel und Abmeldelink
- Automatische Erkennung von Rückläufern: dauerhaft unzustellbare Adressen kommen auf die Sperrliste, der Kontakt wird unzustellbar, Abläufe enden; Abwesenheitsnotizen werden erkannt und beenden keinen Ablauf
- Seite Gespräche mit Ansichten Offen, Alle, Unzustellbar, ganzem Verlauf je Kontakt, Status des Interessenten, Erledigt; Zähler offener Antworten in der Kopfleiste; Jetzt abrufen
- Gespräche in Suche, Aktivitätsprotokoll (Handelnder "KI-Gespräche") und Handbuch

### Geändert
- Kopfleiste zeigt die Bereiche nur noch als Text ohne Symbole, damit alle zehn Bereiche nebeneinander passen; die Symbole bleiben in Seitenleiste und Suche

### Abhängigkeiten
- postal-mime 4.0.5 zum Lesen eingegangener Mails (MIT-0, ohne weitere Abhängigkeiten)

## 0.12.0 (17.10.2026)

### Neu
- Postausgang: persönliche Mails an einzelne Interessenten. Die KI schreibt je Firma eine Erstmail aus Produkt, Ansatzpunkt, Ansprechpartner und Firmenangaben; Anrede und Grußformel setzt MixMarket selbst
- Freigabe vor dem Versand (Standard): Freigeben, Bearbeiten, Neu schreiben mit optionalem Wunsch an die KI, Ablehnen, Ablauf beenden, Alle freigeben
- Ansichten Zur Freigabe, Geplant, Gesendet, Beendet mit Produktfilter; Mail mit Ablaufleiste (Erstmail und Nachfass-Mails), Öffnungen und Klicks; auf schmalen Bildschirmen öffnet die Mail in einem Fenster
- Nachfass-Mails je Produkt (0 bis 3, Abstand in Tagen): werden etwa einen Tag vor dem Termin geschrieben, erscheinen zur Freigabe und gehen als Antwort im selben Verlauf hinaus
- Versandregeln: Versandtage, Uhrzeitfenster, Tageslimit und Mindestabstand zwischen zwei Mails
- Der Ablauf endet von selbst bei Statuswechsel auf Im Gespräch, Kein Interesse oder Kunde, bei Abmeldung, Sperrliste oder fehlendem Kontakt; der Grund steht im Reiter Beendet
- Recherche, Interessenten: Anschreiben je Zeile und Neue anschreiben für alle neuen Interessenten; fehlende Kontakte werden angelegt; die Zeile zeigt den Stand im Postausgang
- Testmodus ohne Postfach mit deutlichem Hinweis "Testversand, nicht verschickt"; Hinweis, wenn kein KI-Anbieter gewählt ist
- Postausgang in Suche, Aktivitätsprotokoll (Handelnder "KI-Postausgang") und Handbuch

### Geändert
- Kopfleiste: Postausgang statt Sperrliste; die Sperrliste liegt jetzt im Benutzermenü und in der Seitenleiste
- Recherche, Interessenten: "In Kontakte übernehmen" ist jetzt ein Nebenknopf neben "Neue anschreiben"

## 0.11.0 (17.10.2026)

### Neu
- Ersteinrichtung beim ersten Start: Ohne Konto zeigt MixMarket "MixMarket einrichten" (Name, E-Mail, Passwort); es gibt genau ein Konto
- Wiederherstellungsschlüssel: wird bei der Einrichtung einmalig gezeigt (kopieren, als Datei speichern, Bestätigung); "Passwort vergessen?" auf der Anmeldeseite setzt damit ein neues Passwort und gibt einen neuen Schlüssel
- Notlösung ohne Schlüssel: `npm run reset-password` auf dem Rechner, auf dem MixMarket läuft; der Hinweis dazu ist auf der Seite "Passwort vergessen" versteckt und öffnet sich nur per Klick auf das erste "s" in "vergessen" (Englisch: in "password"), beschrieben im Handbuch
- Einstellungen, Bereich Konto: Name und E-Mail ändern, Passwort ändern, neuen Wiederherstellungsschlüssel erzeugen
- Sperre nach 5 Fehlversuchen für 5 Minuten (Anmeldung und Wiederherstellung), gezählt je Netzwerkadresse und je Konto
- Wird die Seite neu geladen, bevor ein neuer Wiederherstellungsschlüssel bestätigt ist, zeigt MixMarket ihn erneut an
- Meldungen der Anmeldeseite erscheinen in der gewählten Sprache
- Sprache je Vorlage (Deutsch oder Englisch): bestimmt {{anrede}} (z. B. "Dear Ms Miller"), den Abmelde-Hinweis aus den Einstellungen und den Text des Abmeldelinks, auch in Nachfass-Mails

### Geändert
- Passwortänderung meldet alle anderen Anmeldungen ab
- Geheimschlüssel für Anmeldung und gespeicherte Zugänge wird beim ersten Start zufällig erzeugt, wenn keiner in der .env steht
- Anmeldeseite zweisprachig, mit Sprachwahl und Auge im Passwortfeld
- Vorlagen: Name und Betreff als Pflichtfelder markiert
- Startdaten-Skript legt kein Konto und keinen Firmennamen mehr an

### Entfernt
- Offene Registrierung über die Schnittstelle, Rollen

### Behoben
- Die Anmeldeseite zeigte die Zugangsdaten des Entwicklungskontos für jeden sichtbar an
- Fehlte der Geheimschlüssel in der .env, galt ein fest eingebauter, bekannter Ersatzwert
- Das Startdaten-Skript legte ein Konto mit festem, im Code stehendem Passwort an

## 0.10.0 (17.10.2026)

### Neu
- Eingebautes Handbuch auf Deutsch und Englisch: 14 Kapitel von Erste Schritte bis Begriffe, mit Schritt-für-Schritt-Anleitungen, Hinweisen und hervorgehobenen Beschriftungen der Oberfläche
- Erreichbar über das Fragezeichen in der Kopfleiste, die Seitenleiste und die Suche; jede Seite hat neben dem Titel den Knopf "Hilfe", der direkt zum passenden Kapitel führt
- Inhaltsverzeichnis mit Kapitelnummern, Sprungmarken zu den Abschnitten, Blättern zum vorigen und nächsten Kapitel; auf Handy und Tablet Kapitelwahl oben
- Die Suche durchsucht auch das Handbuch und öffnet es genau am gefundenen Abschnitt
- Kontakte: Blättern mit 50 Kontakten je Seite und Gesamtzahl, Filter nach Liste, Status Beschwerde im Filter, Status im Bearbeiten-Fenster änderbar (sperrt bzw. entsperrt die Adresse)
- Import in eine wählbare Liste
- Listen: Klick auf die Kontaktanzahl zeigt die Mitglieder
- Jede Mail enthält die Signatur aus den Einstellungen und eine automatisch erzeugte Textfassung
- Vor Versand und Planung: Warnhinweis für alle Empfänger ohne dokumentierte Einwilligung und bei fehlender Postanschrift
- Neue Kampagnen übernehmen den Absender aus dem Postfach, leerer Betreff wird aus der Vorlage gefüllt
- Übersicht: Diagramm zeigt auch Klicks

### Geändert
- Geplante Kampagnen: "Planung aufheben" macht sie wieder zum Entwurf (statt "Abgebrochen"); ein Zeitpunkt im Bearbeiten-Fenster plant die Kampagne
- Versand und Planung verlangen eine Vorlage und mindestens einen zulässigen Empfänger; Zeitpunkte in der Vergangenheit werden abgelehnt; versendete Kampagnen sind nicht mehr bearbeitbar
- Automatisierungen: "Hat nicht geöffnet" prüft erst nach Ablauf der Verzögerung; nur Versände nach dem Anlegen lösen Nachfass-Mails aus; pausierte Automatisierungen senden nichts; wird die Quellkampagne gelöscht, wird die Automatisierung pausiert
- "In Kontakte übernehmen" lässt Interessenten mit "Kein Interesse" aus
- Zielgruppen: Passung und Größe zeigen ihren Standardwert (ab 7, ab 20 Mitarbeitern) statt "beliebig"
- Webseiten auslesen, Art Kontaktdaten, sucht immer nach E-Mail-Adressen
- Kopfleiste: Menüknopf schon unter 1360 px, Suche unter 1600 px nur als Symbol, Tastenkürzel Strg K außerhalb von Apple-Geräten
- Das Feld "Sachgebiet" heißt überall "Branche"; Postfach-Text sagt ehrlich, dass Antworten noch nicht ausgewertet werden

### Behoben
- Pflichtfelder in Kampagnen und Automatisierungen waren nicht markiert; fehlende Angaben führten zu stillem Nichtstun oder englischen Fehlermeldungen
- "Abbrechen" einer geplanten Kampagne fragte nach "löschen"
- Postanschrift verlor im Footer ihre Zeilenumbrüche
- Produkt löschen verschwieg, dass seine Interessenten mitgelöscht werden
- Rund 70 Oberflächentexte fehlten in den Übersetzungen und erschienen im Englischen deutsch; Diagrammbeschriftung, Speichern-Meldung und Beschriftung des Ein-Aus-Knopfs der Automatisierungen korrigiert
- Navigation der Kopfleiste wurde zwischen 1280 und 1600 px angeschnitten

## 0.9.1 (17.10.2026)

### Neu
- Wer sich abmeldet, dessen offene Interessenten (Neu, Kontaktiert, Im Gespräch) springen automatisch auf "Kein Interesse"; Kunden bleiben Kunden
- Pausierte Kampagnen lassen sich fortsetzen; bereits versendete Mails werden übersprungen

### Geändert
- Bestätigungsseite der Abmeldung auf Deutsch oder Englisch je nach Browser, im Stil von MixMarket, hell und dunkel
- Import: Bei vorhandenen Adressen werden leere Felder ergänzt und die gewählten Listen zugeordnet; E-Mail, Status und Einwilligung bleiben unverändert. Doppelte Adressen in einer Datei zählen einmal

### Behoben
- Abmeldelink, Öffnungen und Klicks in Nachfass-Mails der Automatisierungen wirkten nicht; Nachfass-Mails haben jetzt auch den Abmeldeknopf für Mailprogramme
- Klick-Links ließen sich als offene Weiterleitung auf beliebige fremde Seiten missbrauchen
- Wiederholte Klicks auf den Abmeldelink erhöhten die Abmeldezahl jedes Mal
- Bricht ein Versand ab oder wird der Server währenddessen beendet, bleibt die Kampagne nicht mehr auf "Wird versendet" stehen, sondern wird pausiert und im Protokoll als Fehler vermerkt
- Sperre aufheben setzt den Kontakt wieder aktiv; Kontakt auf aktiv setzen hebt die Sperre auf
- Kontakt ändern: unbekannter Kontakt hinterließ verwaiste Listeneinträge, eine schon vergebene E-Mail führte zu einem Serverfehler
- Kontakte zur Liste hinzufügen meldete die Zahl der Eingaben statt der tatsächlich hinzugefügten und scheiterte an Doppelten
- Pausierte Kampagnen hießen "Abgebrochen"; Importmeldung war im Englischen deutsch

## 0.9.0 (17.10.2026)

### Neu
- Volltextsuche in der Kopfleiste (Cmd K) über alle Bereiche: Kontakte, Firmen samt Ansatzpunkten und Webseitentext, Interessenten, Produkte, Listen, Vorlagen, Kampagnen, Automatisierungen, Zielgruppen, Firmensuchen, Webseiten-Aufträge und Sperrliste
- Groß- und Kleinschreibung, Umlaute und Leerzeichen spielen keine Rolle ("Muster Firma" findet "MusterFirma"); mehrere Wörter dürfen in verschiedenen Feldern stehen
- Oben zeigt die Suche, in welchen Bereichen der Begriff vorkommt, mit Trefferzahl; je Treffer Feld und Textauszug mit hervorgehobener Fundstelle
- Ein Klick auf einen Treffer öffnet den Eintrag direkt (zum Bearbeiten, im Detailfenster oder hervorgehoben in der Liste), wechselt dafür bei Bedarf Reiter und Produkt
- Postfach in den Einstellungen: Versand über SMTP und Empfang über IMAP mit Server, Verschlüsselung, Port, Anmeldung und Ordner; Passwörter verschlüsselt, "Verbindung testen" speichert vorher und zeigt die vollständige Meldung des Mailservers
- Aktivitätsprotokoll (Benutzermenü, Seitenleiste und Suche): wer wann was getan hat, Nutzer, MixMarket selbst und KI-Agenten; Filter nach Bereich, Handelndem und Zeitraum, Suche, aufklappbare Einzelheiten mit Vorher und Nachher
- Protokolliert werden Anmeldungen, alle Änderungen an Kontakten, Listen, Vorlagen, Kampagnen, Automatisierungen, Sperrliste, Produkten, Zielgruppen, Interessenten und Einstellungen sowie Versand, Abmeldungen, Firmensuchen, Durchleuchten und KI-Bewertung

### Geändert
- Heller Modus abgedunkelt; Hover-Flächen heben sich überall deutlich ab, gewählte Umschalter haben eine eigene helle Fläche
- Versandzugang aus den Einstellungen hat Vorrang vor der Server-Datei .env, die als Rückfall bleibt
- nodemailer von 6.10 auf 10.1.2 angehoben (bekannte Sicherheitslücken in 6.x); neu: imapflow 2.5.2 für den Empfang

### Behoben
- Die Einstellungsseite bekam die verschlüsselten Zugänge der Suchquellen mitgeschickt
- Escape in der Suche schloss auch ein dahinter offenes Fenster

## 0.8.0 (17.10.2026)

### Neu
- Recherche, Reiter "Interessenten": Arbeitsliste je Produkt mit Passung, Ansatzpunkt der KI, Ansprechpartner, Telefon, E-Mail und Webseite, auch für Firmen ohne E-Mail
- Status je Interessent (Neu, Kontaktiert, Im Gespräch, Kein Interesse, Kunde) mit Filter und Zählung, Notiz und wählbarem Ansprechpartner
- Übernahme als Interessenten aus der Zielgruppe (alle oder ab einer Passung) und einzeln aus der Detailansicht einer Firma; Doppelte werden übersprungen
- "In Kontakte übernehmen": Interessenten mit E-Mail werden Kontakte (Herkunft Recherche, ohne Einwilligung) in der Liste "Interessenten <Produkt>"; persönliche Adresse des Ansprechpartners hat Vorrang, vorhandene Kontakte werden nur verknüpft, gesperrte Adressen übersprungen
- Platzhalter {{anrede}} (Sehr geehrter Herr ..., Sehr geehrte Frau ..., Guten Tag ... oder Sehr geehrte Damen und Herren) und {{ansatz}} (Ansatzpunkt der KI über die Interessentenliste des Produkts), auch in Nachfass-Mails
- Kontakte haben Anrede und Titel
- Vor Versand und Planen einer Kampagne: Hinweis auf Empfänger aus der Recherche ohne Einwilligung und auf fehlende Ansatzpunkte; der Versand bleibt möglich

### Geändert
- Recherche hat vier Bereiche; auf dem Handy als Auswahlfeld
- Bestätigungsdialoge können Warnungen und Hinweise anzeigen
- Branche der Kontakte aus der deutschen Bezeichnung der Suche statt Rohwerten der Quelle

### Behoben
- Impressum: Betriebsnamen wie "Ferienwohnungen Musterhof" oder "Ratsstübchen Musterstadt" wurden als Ansprechpartner erkannt; "Autohaus Max Muster" wird zu "Max Muster"
- Rohwerte wie "apartment" aus OpenStreetMap erschienen als Branche
- Detailansicht: Produktname und Begründung bei "Bewertungen für andere Produkte" liefen ineinander

## 0.7.0 (17.10.2026)

### Neu
- Menüknopf mit Seitenleiste für alle Bereiche, sobald die volle Navigation nicht in die Kopfleiste passt (unter 1280 px); auf dem Handy liegen dort auch Design und Sprache
- Fenster, Auswahlfelder und Kalender kommen auf dem Handy als Blatt von unten über die volle Breite
- Tabellen (Kontakte, Kampagnen, Sperrliste) werden auf Handy und Tablet zu Blöcken untereinander statt seitlich zu scrollen
- App-eigene Kontrollkästchen statt der Browser-Kästchen, Zahlenfelder ohne Browser-Pfeile, eigener Fokusrahmen, schmale Scrollbalken

### Geändert
- Einheitliche Grenze für Handy (unter 768 px) statt sieben verschiedener Werte
- Seitenkopf bleibt auf dem Handy nicht mehr am oberen Rand stehen
- Zeilen in Listen, Vorlagen, Automatisierungen und Recherche ordnen sich auf dem Handy untereinander; Bearbeiten-Knöpfe dort nur als Symbol
- Knöpfe, Reiter und Umschalter brechen nie in eine zweite Zeile um
- Sperrliste: Filter auf dem Handy als Auswahlfeld; Hinweissatz nur noch einmal
- Übersicht: Kennzahlen auf dem Handy in zwei Spalten
- Suche deckend statt durchscheinend, mit Rand auf dem Handy
- Vorlagen-Editor zeigt am Desktop HTML und Vorschau nebeneinander, auf schmalen Bildschirmen mit Umschalter
- Kalender wird am Desktop mittig zum Feld ausgerichtet und nie abgeschnitten

### Behoben
- Auf Handy und Tablet fehlte die Navigation; bei 800 bis 1480 px lagen die Menüpunkte übereinander
- Seiten Listen und Recherche waren auf dem Handy breiter als der Bildschirm; Löschknöpfe lagen außerhalb, Fenster wurden abgeschnitten
- Kennzeichnungen lagen über Listennamen, Filter der Sperrliste liefen ineinander, Betreff der Vorlagen brach Wort für Wort um
- Kalender ragte rechts über das Feld hinaus
- Gescrollte Auswahllisten sprangen zum markierten Eintrag zurück
- Falsche Beschriftungen: Typ und Farbe bei Listen, Name bei Kampagnen, E-Mail und Notiz bei der Sperre, Spalte E-Mail der Sperrliste, Überschriften der Bearbeiten-Fenster, "Keine Vorlage" statt "Noch nichts vorhanden"
- Erfolgsmeldungen zeigten "Kampagnen", "Speichern" oder "Löschen" statt "Kampagne gespeichert", "Gespeichert" oder "Gelöscht"
- Automatisierungen: "nach X Tagen" stand fest auf Deutsch im Code, Trennzeichen waren uneinheitlich
- Einstellungen: Hinweistexte klebten an der nächsten Beschriftung, Überschriften und Testmodus-Hinweis standen doppelt
- Grundstile der Sperrliste wirkten auf alle Seiten der App
- Trennpunkte in Infozeilen standen nach einem Umbruch am Zeilenanfang

## 0.6.0 (16.10.2026)

### Neu
- Mindestgröße je Produkt: optionales Feld "Mindestgröße der Kundenfirma" in Mitarbeitern. Firmen, die erkennbar kleiner sind, bewertet die KI mit höchstens 3
- Größenhinweise beim Durchleuchten: ausdrücklich genannte Mitarbeiterzahl ("60 Mitarbeiter", "Team aus 25"), Abteilungen aus E-Mail-Adressen und Überschriften, Zahl der Standorte und eine grobe Untergrenze aus Team, Abteilungen, offenen Stellen und Standorten
- Die KI schätzt bei jeder Bewertung die Größenklasse (1-5, 6-20, 21-50, 51-250, über 250) mit Begründung
- Zielgruppen-Merkmal "Geschätzte Größe" mit Auswahl ab 5 bis ab 250 Mitarbeitern; genannte Zahl geht vor KI-Schätzung, unbekannte Größe zählt nie als passend
- Firmentabelle zeigt die Größe als Merkmal, die Detailansicht Mitarbeiterzahl mit Beleg, KI-Schätzung, Abteilungen, Standorte und Hinweise
- Eigenes Auswahlfeld statt der Browser-Dropdowns in der ganzen App, mit Suchfeld bei langen Listen und voller Tastaturbedienung
- Eigene Datums- und Zeitauswahl mit Kalender statt des Browser-Kalenders bei Kampagnen; vergangene Zeitpunkte werden mit Hinweis abgelehnt

### Geändert
- Bewertungen gelten auch als veraltet, wenn sich die Mindestgröße des Produkts ändert
- Zusammenfassung der Zielgruppe schreibt Zahlenwerte aus ("ab 20 Mitarbeitern", "mindestens 6")
- Kampagne planen ohne Zeitpunkt und Automatisierung ohne Vorlage melden jetzt einen Hinweis statt still abzubrechen

### Behoben
- Benutzermenü oben rechts war durchsichtig; es hat jetzt einen deckenden Hintergrund
- Impressum: Menüzeilen wie "Service Verkauf Geschäftsführung" führten dazu, dass die nächste Zeile ("Unsere Öffnungszeiten") als Ansprechpartner erkannt wurde
- "Produkte verwalten" zeigte nach einer KI-Bewertung eine veraltete Zahl bewerteter Firmen; Firmenlisten der Suchen zeigen die neue Passung jetzt ohne Neuladen

## 0.5.0 (16.10.2026)

### Neu
- Produkte: beliebig viele Produkte anlegen, jeweils mit Name, Webseite, "Was Sie verkaufen" und "Ihr idealer Kunde". Auswahl oben in der Recherche, Verwaltung über "Produkte verwalten"
- Zielgruppen gehören zu einem Produkt; ältere Zielgruppen ohne Produkt bleiben sichtbar und lassen sich zuordnen
- KI-Bewertung je Produkt: Passung 1 bis 10, Begründung und Ansatzpunkt für die Erstansprache, getrennt pro Produkt
- KI über das eigene Abo ohne API-Schlüssel: Claude-Abo über Claude Code oder ChatGPT-Abo über Codex, wählbar in den Einstellungen mit Verbindungsprüfung
- Die KI bekommt keine Werkzeuge: Claude Code ohne Werkzeuge, MCP-Server und Nutzereinstellungen; Codex ohne Befehle, Code-Modus, Unteragenten, Plugins, Browser und Websuche, nur lesend, mit Sofortabbruch bei jedem Werkzeugversuch
- Bewertung in Fünfergruppen mit Fortschritt und Abbruch; bereits aktuell bewertete Firmen werden übersprungen, Bewertungen nach Änderung des Produkts als veraltet markiert
- Spalte "Passung" in den Tabellen, Sortierung nach Passung, Merkmal "KI-Passung mindestens" in den Zielgruppen
- Detailansicht: Bewertung für das gewählte Produkt mit Kopierknopf, dazu Bewertungen für andere Produkte
- Durchleuchten speichert einen kurzen Textauszug der Startseite für die KI
- Neue Branchen: Ferienwohnungen und Ferienhäuser, Campingplätze

### Geändert
- Escape und Sprungmarken in den Einstellungen funktionieren auch für den neuen Abschnitt "KI-Bewertung"
- Reiter der Recherche auf dem Handy zuverlässig in voller Breite

## 0.4.0 (16.10.2026)

### Neu
- Recherche: neuer Bereich "Zielgruppen". Aus den gefundenen Firmen über 24 Merkmale eine Auswahl zusammenstellen, je Merkmal "egal", "muss" oder "nicht"
- Merkmale aus Kontakt (Entscheider, persönliche E-Mail, Telefon, Kontaktformular), Webseite (Werbung, Online-Buchung, Handy, HTTPS, Agentur, Alter, System), Unternehmen (Stellen, Rechtsform) sowie Suche und Google-Profil (Platz 11 bis 30, Bewertung, unbestätigtes Profil)
- Live-Zählung "x von y Firmen" mit Verteilung je Merkmal (ja, nein, unbekannt)
- Umfang wählbar: alle Firmen oder bestimmte Suchen
- Zielgruppen speichern, laden, ändern und löschen; die Anzahl wird bei jedem Öffnen neu gezählt
- Unbekannte Merkmale zählen nie als passend, weder bei "muss" noch bei "nicht"

### Geändert
- Firmentabelle als gemeinsame Komponente für Recherche und Zielgruppen
- Rechtsform wird auch ohne Impressum aus dem Firmennamen gelesen
- Reiter der Recherche nutzen auf dem Handy die volle Breite

## 0.3.0 (16.10.2026)

### Neu
- Firmen durchleuchten: Für alle Firmen einer Suche oder für eine einzelne Firma werden Startseite, Impressum, Kontakt-, Karriere- und Teamseite sowie Sitemap ausgelesen. Kostenlos, ohne KI.
- Ansprechpartner aus dem Impressum (Geschäftsführung, Inhaber, Vertretungsberechtigte, Prokura) und von Teamseiten, mit akademischem Titel und Anrede, sofern erkennbar
- Unternehmensangaben: Rechtsform, Handelsregister, USt-IdNr., Telefon, persönliche und allgemeine E-Mail-Adressen (nur eigene Domain oder Freemail)
- Merkmale der Webseite: System (WordPress, TYPO3, Jimdo und weitere), Google- und Meta-Werbung, Online-Buchung, Kontaktformular, Handy-Tauglichkeit, HTTPS, strukturierte Daten, Copyright-Jahr, Seitenzahl, letzte Änderung, soziale Netzwerke, Agentur, offene Stellen mit (m/w/d)
- Jeder Fund mit Fundstelle zum Nachprüfen
- Firmenliste mit Spalten Ansprechpartner, Kontakt und Merkmale; Detailansicht je Firma
- Fortschrittsanzeige beim Durchleuchten

### Geändert
- Rücksicht und Sicherheit beim Auslesen: robots.txt wird beachtet, höchstens 14 Abrufe je Firma, keine Abrufe von Adressen im eigenen Netz
- Escape schließt bei übereinanderliegenden Fenstern nur das oberste

## 0.2.0 (16.10.2026)

### Neu
- Recherche: neuer Bereich "Firmen finden". Betriebe einer Branche in einem Ort über vier Quellen suchen:
  - OpenStreetMap (kostenlos, ohne Konto)
  - DataForSEO Branchenverzeichnis (Google-Unternehmensprofile im Umkreis)
  - DataForSEO Google-Suche (mit Platzierung)
  - Serper Google-Suche (mit Platzierung)
- Branchenkatalog mit 45 deutschen Branchen, zusätzlich eigener Suchbegriff
- Geschätzte Kosten vor jeder Suche, Bestätigung bei kostenpflichtigen Suchen, Kostenobergrenze je Suche
- Verzeichnisse, Portale und soziale Netzwerke werden automatisch aussortiert, doppelte Firmen erkannt
- Ergebnisliste je Suche mit Adresse, Webseite, Telefon, E-Mail, Bewertung und Platzierung
- Einstellungen: Abschnitt "Recherche-Zugänge" für DataForSEO und Serper mit Zugangsprüfung; Passwort und Schlüssel werden verschlüsselt gespeichert
- Passwortfelder mit Auge zum Anzeigen
- Neue Umgebungsvariable `SECRETS_KEY` (optional, sonst wird `JWT_SECRET` verwendet)

### Geändert
- Recherche-Seite mit Umschalter zwischen "Firmen finden" und "Webseiten auslesen"; die bisherige Funktion bleibt unverändert im zweiten Bereich
- Aufträge unter "Webseiten auslesen" werden nur noch abgefragt, wenn dieser Bereich offen ist

## 0.1.0 (12.06.2026)

### Neu
- Erste Fassung: Kontakte, Listen, Vorlagen, Kampagnen, Automatisierungen, Recherche (Webseiten auslesen), Sperrliste, Einstellungen, Statistiken
