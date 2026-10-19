// Eingebautes Handbuch von MixMarket auf Deutsch; Kapitel und Abschnitts-Kennungen sind identisch mit en.ts
import type { HandbookChapter } from '../../types/handbook'

export const handbookDe: HandbookChapter[] = [
  {
    id: 'start',
    title: 'Erste Schritte',
    summary: 'Wie Sie MixMarket beim ersten Start einrichten, was Sie vor dem ersten Versand eintragen und wie der Weg von der Firmensuche bis zur versendeten Kampagne oder zur persönlichen Mail im Postausgang aussieht.',
    sections: [
      {
        id: 'what-is-mixmarket',
        title: 'Wofür MixMarket da ist',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket hilft Ihnen, passende Firmen für Ihre Produkte zu finden, sie zu prüfen und gezielt per E-Mail anzuschreiben. Recherche und Versand sind getrennt: Erst sammeln und bewerten Sie Firmen, dann entscheiden Sie, wen Sie wirklich anschreiben.',
          },
          {
            type: 'p',
            text: 'Die Arbeit verteilt sich auf wenige Bereiche: In der **Recherche** finden und bewerten Sie Firmen, unter **Kontakte** und **Listen** verwalten Sie Ihre Empfänger, unter **Vorlagen** schreiben Sie Ihre Mails, und unter **Kampagnen** und **Automatisierungen** verschicken Sie sie.',
          },
          {
            type: 'p',
            text: 'Es gibt auch einen zweiten Weg: Im **Postausgang** schreibt die KI jede Firma einzeln mit einer persönlichen Mail an. Sie prüfen jede Mail und geben sie frei, MixMarket verschickt sie und fasst auf Wunsch nach. Dafür brauchen Sie weder eine Vorlage noch eine Kampagne.',
          },
          {
            type: 'p',
            text: 'Antworten auf Ihre Mails sammelt MixMarket unter **Gespräche**. Es liest dazu Ihr Postfach mit, erkennt Rückläufer und Abwesenheitsnotizen und beendet den Ablauf im Postausgang, sobald jemand antwortet. Die KI ordnet jede Antwort ein und schreibt bei Interesse oder einer Frage einen Antwortentwurf, solange der Autopilot Antworten eingeschaltet ist. Hinaus geht eine Antwort erst, wenn Sie auf **Senden** klicken.',
          },
          {
            type: 'p',
            text: 'Vieles davon kann MixMarket auch selbst erledigen. Mit dem **Autopilot** auf der **Übersicht** durchleuchtet und bewertet es Firmen, gibt passende Firmen in den Postausgang, verschickt freigegebene Mails und ordnet Antworten ein, je nachdem, welche Bereiche Sie einschalten. Der **Not-Aus** stoppt jederzeit jeden Versand (Übersicht).',
          },
        ],
      },
      {
        id: 'navigation',
        title: 'Aufbau der Oberfläche',
        blocks: [
          {
            type: 'p',
            text: 'Oben in der Kopfleiste finden Sie alle Bereiche und rechts daneben einige Werkzeuge.',
          },
          {
            type: 'list',
            items: [
              'Die Bereiche **Übersicht**, **Kontakte**, **Listen**, **Vorlagen**, **Kampagnen**, **Automatisierungen**, **Recherche**, **Postausgang** und **Gespräche** öffnen Sie direkt über die Kopfleiste. Dort stehen sie nur als Text, ohne Symbole. Hinter **Gespräche** zeigt eine Zahl, wie viele Antworten noch offen sind. Ein Klick auf den Schriftzug MixMarket führt zur **Übersicht**. Sie ist die Schaltzentrale mit **Wartet auf Sie**, Autopilot, Not-Aus und Auslastung (Übersicht).',
              'Ist der Not-Aus aktiv, steht oben auf jeder Seite ein roter Balken mit dem Knopf **Versand freigeben**. Pausiert die KI, steht dort ein gelber Balken.',
              '**Suchen** öffnet die Suche über alle Bereiche. Dasselbe erreichen Sie mit Cmd K auf dem Mac oder Strg K unter Windows und Linux. Der Knopf zeigt die passende Tastenkombination für Ihr Gerät an.',
              'Das Symbol mit Sonne oder Mond wechselt zwischen hellem und dunklem Design, der Knopf mit DE oder EN wechselt die Sprache.',
              'Das Fragezeichen öffnet dieses Handbuch. Zusätzlich steht auf jeder Seite neben dem Titel der Knopf **Hilfe**, der direkt zum passenden Kapitel führt.',
              'Ein Klick auf Ihre Initialen öffnet das Benutzermenü. Oben stehen Name und E-Mail Ihres Kontos, darunter **Sperrliste**, **Aktivitäten**, **Einstellungen**, **Nach Updates suchen** und **Abmelden**. Gibt es eine neue Version von MixMarket, zeigt ein kleiner pulsierender Punkt an Ihren Initialen das an, und der Menüpunkt heißt **Update verfügbar** (Einstellungen, Updates). **Abmelden** beendet alle Anmeldungen auf allen Geräten, also auch in einem zweiten Browser oder auf dem Handy.',
              'Ist das Fenster schmal, etwa auf dem Handy, zeigt die Kopfleiste stattdessen einen Menüknopf. Er öffnet eine Seitenleiste mit allen Bereichen und ihren Symbolen, auch **Sperrliste**, **Aktivitäten**, **Handbuch** und **Einstellungen**, dazu Design, Sprache und **Abmelden**. Auch dort steht hinter **Gespräche** die Zahl offener Antworten.',
            ],
          },
        ],
      },
      {
        id: 'first-start',
        title: 'Ersteinrichtung und Wiederherstellungsschlüssel',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket hat genau ein Konto. Es gibt keine Rollen und keine Registrierung weiterer Nutzer. Beim allerersten Start, solange noch kein Konto besteht, erscheint statt der Anmeldung die Seite **MixMarket einrichten**.',
          },
          {
            type: 'p',
            text: 'Am Rechner, auf dem MixMarket läuft, richten Sie MixMarket ohne weitere Angaben ein. Von einem anderen Rechner aus verlangt die Seite zuoberst zusätzlich das Feld **Einrichtungscode**. Als anderer Rechner gilt auch jede Anfrage, die über einen vorgeschalteten Vermittler wie einen Reverse-Proxy ankommt. Den Code schreibt MixMarket beim Start des Servers in das Protokoll des Servers, solange noch kein Konto besteht, etwa in der Form ABCD-EFGH. Nach jedem Neustart gilt ein neuer Code. Groß- und Kleinschreibung spielen keine Rolle. Ist das Feld leer, meldet MixMarket „Bitte alle Felder ausfüllen.“, ist der Code falsch, „Der Einrichtungscode fehlt oder ist falsch.“ In beiden Fällen legt MixMarket kein Konto an.',
          },
          {
            type: 'steps',
            items: [
              'Tragen Sie **Ihr Name**, **E-Mail** und **Passwort** ein und geben Sie das Passwort unter **Passwort wiederholen** ein zweites Mal ein. Das Passwort braucht mindestens 10 Zeichen. Mit dem Augensymbol zeigen Sie die Eingabe an.',
              'Klicken Sie **Konto anlegen**.',
              'MixMarket zeigt jetzt einmalig Ihren **Wiederherstellungsschlüssel**: 6 Gruppen zu je 4 Zeichen, durch Striche getrennt. Mit ihm setzen Sie ein neues Passwort, falls Sie es vergessen.',
              'Sichern Sie den Schlüssel mit **Kopieren** oder **Als Datei speichern**. Die Textdatei enthält die E-Mail des Kontos, den Schlüssel und eine kurze Anleitung. Sie können ihn auch ausdrucken oder abschreiben.',
              'Setzen Sie den Haken **Ich habe den Schlüssel sicher aufbewahrt.** und klicken Sie **Weiter zu MixMarket**. Ohne den Haken geht es nicht weiter.',
            ],
          },
          {
            type: 'warning',
            text: 'Der Schlüssel wird nur dieses eine Mal angezeigt. Bewahren Sie ihn an einem sicheren Ort auf, nicht nur auf diesem Rechner. Wer den Schlüssel und Ihre E-Mail kennt, kann ein neues Passwort setzen.',
          },
          {
            type: 'p',
            text: 'Danach melden Sie sich auf der Anmeldeseite mit **E-Mail** und **Passwort** an. Das Augensymbol im Passwortfeld zeigt die Eingabe an, der Knopf oben rechts wechselt die Sprache. Haben Sie das Passwort vergessen, klicken Sie **Passwort vergessen?** (Einstellungen, Passwort vergessen).',
          },
          {
            type: 'p',
            text: 'Ist der Server beim Öffnen oder Neuladen von MixMarket nicht erreichbar, erscheint statt der Anmeldeseite der Hinweis „Verbindung zum Server wird aufgebaut“. MixMarket versucht es alle 3 Sekunden erneut und öffnet die Seite, sobald der Server antwortet. Ihre Anmeldung bleibt dabei bestehen.',
          },
          {
            type: 'tip',
            text: 'Name, E-Mail und Passwort ändern Sie später in den **Einstellungen** im Abschnitt **Konto**. Dort erzeugen Sie bei Bedarf auch einen neuen Schlüssel.',
          },
        ],
      },
      {
        id: 'setup',
        title: 'Zuerst einrichten',
        blocks: [
          {
            type: 'p',
            text: 'Bevor Sie die erste echte Mail verschicken, richten Sie MixMarket einmal ein. Voraussetzung ist Ihr Konto aus der Ersteinrichtung (Abschnitt Ersteinrichtung und Wiederherstellungsschlüssel). Die Schritte 1 bis 4 sind für den vollen Ablauf nötig, Schritt 5 nur für kostenpflichtige Suchquellen.',
          },
          {
            type: 'steps',
            items: [
              'Unternehmen: Öffnen Sie **Einstellungen** über das Benutzermenü. Füllen Sie unter **Unternehmen** die Felder **Unternehmensname** und **Postanschrift (Pflicht im Footer)** aus und klicken Sie **Speichern**. Die Postanschrift erscheint unten in jeder versendeten Mail.',
              'Postfach: Tragen Sie im Abschnitt **Postfach** die Daten Ihres E-Mail-Kontos ein, mindestens den Postausgangsserver unter **Versand (SMTP)**. Prüfen Sie den Zugang mit **Verbindung testen** und speichern Sie mit **Postfach speichern**. Solange kein Postfach eingetragen ist, läuft MixMarket im Testmodus und verschickt keine echten Mails. Damit MixMarket Antworten unter **Gespräche** lesen kann, tragen Sie zusätzlich den Posteingangsserver unter **Empfang (IMAP)** ein.',
              'Produkt anlegen: Wechseln Sie zu **Recherche** und klicken Sie oben auf **Erstes Produkt anlegen** oder **Produkte verwalten**. Beschreiben Sie, was Sie verkaufen und wer Ihr idealer Kunde ist. Danach richtet sich die Bewertung durch die KI.',
              'KI verbinden: Wählen Sie in den **Einstellungen** im Abschnitt **KI-Bewertung** Ihr **Abo**, klicken Sie **Verbindung prüfen** und dann **KI-Einstellungen speichern**. Die KI bewertet damit Firmen und schreibt die Mails im **Postausgang**.',
              'Optional Suchquellen: Wenn Sie neben OpenStreetMap auch DataForSEO oder Serper nutzen möchten, tragen Sie die Zugänge in den **Einstellungen** unter **Recherche-Zugänge** ein.',
            ],
          },
          {
            type: 'p',
            text: 'Solange die Einrichtung nicht fertig ist, zeigt die **Übersicht** ganz oben unter **Wartet auf Sie** die Liste **Erste Schritte**: **Firmenname und Postanschrift eintragen**, **KI wählen und Verbindung prüfen**, **Postfach einrichten**, **Erstes Produkt anlegen** und **Erste Firmensuche starten**. Ein Klick auf einen Schritt führt zur passenden Stelle in den Einstellungen oder in der Recherche. Steht daneben **mit Anleitung**, startet der Klick eine geführte Tour (Erste Schritte, Geführte Touren). Erledigte Schritte bekommen einen Haken, daneben steht der Stand, etwa „2 von 5 erledigt“. Sind alle Schritte erledigt, verschwindet die Liste (Übersicht, Wartet auf Sie).',
          },
          {
            type: 'tip',
            text: 'Einzelheiten zu jedem Feld finden Sie im Kapitel Einstellungen, zu Produkten im Kapitel Recherche.',
          },
        ],
      },
      {
        id: 'tours',
        title: 'Geführte Touren',
        blocks: [
          {
            type: 'tip',
            text: 'Geführte Touren gehören zu MixMarket Pro. Ohne Pro zeigt der Knopf **Geführte Touren** im Handbuch, was die Touren können.',
          },
          {
            type: 'p',
            text: 'Eine geführte Tour begleitet Sie Schritt für Schritt durch eine Aufgabe. Die Seite wird abgedunkelt, nur das nächste Feld oder der nächste Knopf ist hervorgehoben, und eine Sprechblase sagt, was zu tun ist. Haben Sie es erledigt, geht die Tour von selbst weiter. Sie arbeiten dabei mit Ihren echten Daten: Was Sie eintragen, wird gespeichert.',
          },
          {
            type: 'list',
            items: [
              'Starten: Unter **Erste Schritte** auf der Übersicht starten Schritte mit dem Hinweis **mit Anleitung** die passende Tour. Alle Touren finden Sie im Handbuch über den Knopf **Geführte Touren** oben rechts.',
              'Bedienen: **Weiter** führt zum nächsten Schritt, **Zurück** zum vorigen. Ist ein Feld noch leer, sagt die Sprechblase das und das Feld wird rot markiert. Soll etwas angeklickt werden, steht das in der Sprechblase.',
              'Unterbrechen: Das Kreuz oben in der Sprechblase beendet die Tour. Laden Sie die Seite neu, läuft die Tour an derselben Stelle weiter. Ist ein Fenster versehentlich zu, öffnet **Wieder öffnen** es erneut.',
            ],
          },
          {
            type: 'tip',
            text: 'Abgeschlossene Touren bekommen in der Liste einen Haken. Sie können jede Tour beliebig oft wiederholen.',
          },
          {
            type: 'p',
            text: 'Die Liste **Geführte Touren** ordnet die 22 Touren in vier Gruppen:',
          },
          {
            type: 'list',
            items: [
              '**Einrichten**: Unternehmen eintragen, Postfach einrichten, KI einrichten, Bezahlte Suchquellen, Konto und Passwort.',
              '**Kunden finden und persönlich anschreiben**: Produkt anlegen, Firmen suchen, Firmen durchleuchten, Zielgruppe bilden und bewerten, Interessenten übernehmen, Interessenten anschreiben, Mails prüfen und freigeben, Webseiten auslesen.',
              '**Rundmails an viele**: Kontakte anlegen und importieren, Liste anlegen, Vorlage erstellen, Kampagne erstellen und versenden, Automatisches Nachfassen.',
              '**Im Alltag**: Antworten bearbeiten, Sperrliste, Autopilot, Grenzen und Not-Aus, Rundgang durch die App.',
            ],
          },
          {
            type: 'tip',
            text: 'Eine Tour verschickt nie selbst etwas. Mails gehen erst hinaus, wenn Sie selbst auf **Jetzt versenden**, **Senden**, **Freigeben** oder **Speichern** einer Automatisierung klicken. Vorher sagt die Sprechblase, dass danach echte Mails verschickt werden.',
          },
        ],
      },
      {
        id: 'workflow',
        title: 'Der typische Ablauf',
        blocks: [
          {
            type: 'p',
            text: 'So kommen Sie von der ersten Firmensuche bis zur versendeten Kampagne. In Klammern steht das Kapitel, in dem der Schritt ausführlich beschrieben ist.',
          },
          {
            type: 'steps',
            items: [
              'Firmen finden: In **Recherche**, Reiter **Firmen finden**, starten Sie mit **Neue Suche** eine Suche nach Branche und Ort (Recherche).',
              'Durchleuchten: Klicken Sie bei der fertigen Suche auf **Firmen durchleuchten**. MixMarket liest die Webseiten der Firmen und sammelt Ansprechpartner, E-Mail-Adressen und Merkmale (Recherche).',
              'Zielgruppe bilden: Im Reiter **Zielgruppen** wählen Sie Merkmale, die passen müssen oder nicht vorkommen dürfen. Die Zahl passender Firmen zählt sofort mit (Recherche).',
              'Mit KI bewerten: Klicken Sie **Mit KI bewerten**. Die KI vergibt je Firma eine Passung von 1 bis 10 und schlägt einen Ansatzpunkt für die Erstansprache vor (Recherche).',
              'Interessenten übernehmen: Übernehmen Sie die passenden Firmen mit **Übernehmen** in den Reiter **Interessenten** (Recherche).',
              'In Kontakte übernehmen: Im Reiter **Interessenten** klicken Sie **In Kontakte übernehmen**. Firmen mit E-Mail-Adresse werden Kontakte und landen in der Interessentenliste des Produkts, außer Interessenten mit dem Status Kein Interesse (Recherche, Listen).',
              'Vorlage schreiben: Unter **Vorlagen** schreiben Sie die Mail und setzen Platzhalter wie {{anrede}} und {{ansatz}} ein (Vorlagen).',
              'Kampagne anlegen: Unter **Kampagnen** legen Sie mit **Neue Kampagne** eine Kampagne an, wählen die Vorlage und die Interessentenliste (Kampagnen).',
              'Prüfen und versenden: Klicken Sie **Jetzt versenden** oder **Planen**. Vorher zeigt MixMarket die Zahl der Empfänger und mögliche Warnhinweise. Ohne Vorlage oder ohne zulässige Empfänger verweigert MixMarket Versand und Planung (Kampagnen, Recht und Zustellbarkeit).',
              'Auswerten und nachfassen: Öffnungen und Klicks sehen Sie in der Kampagnenliste und in der **Übersicht**. Mit **Automatisierungen** schicken Sie auf Wunsch automatisch eine Nachfass-Mail (Übersicht, Automatisierungen).',
            ],
          },
          {
            type: 'p',
            text: 'Ab Schritt 6 gibt es eine Alternative: Statt über Kontakte, Vorlage und Kampagne schreiben Sie die Interessenten einzeln über den Postausgang an.',
          },
          {
            type: 'steps',
            items: [
              'Anschreiben: Im Reiter **Interessenten** klicken Sie in einer Zeile auf **Anschreiben** oder oben rechts auf **Neue anschreiben**. Die KI schreibt dann für jede Firma eine persönliche Erstmail (Postausgang).',
              'Prüfen und freigeben: Unter **Postausgang**, Reiter **Zur Freigabe**, lesen Sie die Mails, ändern sie bei Bedarf und klicken **Freigeben** (Postausgang).',
              'Versenden und nachfassen: MixMarket verschickt die freigegebenen Mails nach Ihren **Versandregeln**. Die Nachfass-Mails aus dem **Ablauf** des Produkts schreibt die KI später im selben Verlauf (Postausgang).',
            ],
          },
          {
            type: 'p',
            text: 'Für beide Wege gilt: Antwortet ein Empfänger, finden Sie die Antwort unter **Gespräche**. Ein laufender Ablauf im Postausgang endet dann von selbst. Bei eingeschaltetem Autopilot Antworten ordnet die KI die Antwort ein und schreibt bei Interesse oder einer Frage einen Antwortentwurf, den Sie prüfen und mit **Senden** verschicken (Gespräche).',
          },
          {
            type: 'p',
            text: 'Was als Nächstes zu tun ist, also Freigaben, neue Antworten, Entwürfe, Fehler und Hinweise, sehen Sie gesammelt unter **Wartet auf Sie** auf der **Übersicht**. Dort schalten Sie auch den Autopiloten ein: Recherche übernimmt Durchleuchten und Bewerten gespeicherter Zielgruppen, Schreiben gibt passende Firmen ab der Mindestpassung in den Postausgang (Übersicht, Autopilot).',
          },
          {
            type: 'warning',
            text: 'Kontakte aus der Recherche haben keine dokumentierte Einwilligung. Werbung per E-Mail ohne Einwilligung kann unzulässig sein. Lesen Sie vor dem ersten Versand das Kapitel Recht und Zustellbarkeit.',
          },
        ],
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Übersicht',
    summary: 'Die Startseite ist die Schaltzentrale von MixMarket: Wartet auf Sie, Autopilot, Not-Aus, Grenzen und Auslastung, darunter Kennzahlen, Versandverlauf und Schnellzugriff.',
    sections: [
      {
        id: 'control-center',
        title: 'Die Übersicht als Schaltzentrale',
        blocks: [
          {
            type: 'p',
            text: 'Die **Übersicht** öffnet sich nach der Anmeldung. Hier sehen Sie, was zu tun ist, und steuern, was MixMarket selbst erledigt. Von oben nach unten steht dort:',
          },
          {
            type: 'list',
            items: [
              '**Wartet auf Sie**: solange die Einrichtung nicht fertig ist, zuerst die Liste **Erste Schritte**, dann Ihre offenen Aufgaben und Hinweise, etwa auf Abmeldungen oder einen Not-Aus.',
              '**Steuerung**: der **Autopilot** je Bereich, der **Not-Aus** und die **Grenzen**.',
              '**Auslastung**: wie stark Ihre KI-Abos ausgelastet sind, wie oft die KI gearbeitet hat und was heute versendet wurde.',
              'Darunter folgen Kennzahlen, Versandverlauf und Schnellzugriff.',
            ],
          },
          {
            type: 'p',
            text: 'Wartet auf Sie und die Steuerung aktualisieren sich alle 30 Sekunden von selbst, die Auslastung alle 2 Minuten.',
          },
          {
            type: 'p',
            text: 'Ist der Not-Aus aktiv oder pausiert die KI, steht zusätzlich oben auf jeder Seite ein Balken (Abschnitte Not-Aus und KI-Pause). Alles, was die Steuerung betrifft, steht unter **Aktivitäten** im Bereich **Steuerung**.',
          },
        ],
      },
      {
        id: 'waiting',
        title: 'Wartet auf Sie',
        blocks: [
          {
            type: 'p',
            text: 'Solange die Einrichtung nicht fertig ist, steht unter **Wartet auf Sie** ganz oben die Liste **Erste Schritte** mit dem Stand, etwa „2 von 5 erledigt“. Jeder Schritt hat einen kurzen Hinweis darunter. Ein Klick auf einen Schritt führt zur passenden Stelle oder startet, mit dem Hinweis **mit Anleitung**, eine geführte Tour. Erledigte Schritte bekommen einen Haken. Sind alle fünf erledigt, verschwindet die Liste.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Firmenname und Postanschrift eintragen', text: 'Erledigt, sobald **Unternehmensname** und **Postanschrift (Pflicht im Footer)** gespeichert sind. Führt zu den **Einstellungen**, Abschnitt **Unternehmen**.' },
              { term: 'KI wählen und Verbindung prüfen', text: 'Erledigt, sobald ein **Abo** gespeichert ist. Führt zu den **Einstellungen**, Abschnitt **KI-Bewertung**.' },
              { term: 'Postfach einrichten', text: 'Erledigt, sobald ein Postfach mit Postausgangsserver gespeichert ist und MixMarket nicht mehr im Testmodus läuft. Führt zu den **Einstellungen**, Abschnitt **Postfach**.' },
              { term: 'Erstes Produkt anlegen', text: 'Erledigt, sobald es mindestens ein Produkt gibt. Führt zur **Recherche**.' },
              { term: 'Erste Firmensuche starten', text: 'Erledigt, sobald mindestens eine Suche fertig ist. Führt zur **Recherche**.' },
            ],
          },
          {
            type: 'p',
            text: 'Darunter listet **Wartet auf Sie** Ihre offenen Aufgaben, jede mit ihrer Anzahl. Ein Klick auf eine Zeile führt zur Seite, auf der Sie die Aufgabe erledigen. Aufgaben ohne offene Fälle erscheinen nicht.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Mails zur Freigabe', text: 'Fertige Mails im Postausgang, die auf Ihre Freigabe warten. Führt zum **Postausgang**.' },
              { term: 'Neue Antworten', text: 'Offene Antworten unter **Gespräche**.' },
              { term: 'Antwortentwürfe', text: 'Fertige Entwürfe unter **Gespräche**, die auf Ihre Prüfung und Ihr Senden warten.' },
              { term: 'Fehler im Postausgang', text: 'Mails im Postausgang mit Fehler, etwa weil die KI nicht schreiben konnte oder der Versand fehlschlug. Führt zum **Postausgang**.' },
              { term: 'Neue Rückläufer', text: 'Dauerhafte Rückläufer, die Sie unter **Gespräche** noch nicht mit **Erledigt** geschlossen haben.' },
              { term: 'Pausierte Kampagnen', text: 'Kampagnen mit dem Status Pausiert, zum Beispiel nach einem Not-Aus. Führt zu **Kampagnen**.' },
              { term: 'Abruffehler des Postfachs', text: 'Das Postfach lässt sich nicht abrufen. Die Zeile nennt die Meldung des Mailservers und führt zu **Gespräche**.' },
            ],
          },
          {
            type: 'p',
            text: 'Darunter stehen Hinweise mit Datum und Uhrzeit, die neuesten oben, höchstens 50:',
          },
          {
            type: 'list',
            items: [
              'Ein Empfänger hat sich über den Link in einer Mail abgemeldet.',
              'Ein Empfänger möchte per Antwort keine Mails mehr. Der Hinweis erscheint, wenn die Adresse dadurch neu gesperrt wurde.',
              'Eine Mail war dauerhaft unzustellbar, die Adresse ist gesperrt.',
              'Der Not-Aus wurde automatisch ausgelöst, mit der Zahl der Rückläufer und Mails in 24 Stunden. Einen Not-Aus, den Sie selbst auslösen, meldet diese Liste nicht.',
              'Die KI pausiert, mit der Auslastung des Abos und, wenn bekannt, dem Ende der Pause.',
            ],
          },
          {
            type: 'p',
            text: 'Mit **Erledigt** nehmen Sie einen Hinweis aus der Liste. Stehen dort mehrere, räumt **Alle Hinweise erledigt** alle auf einmal ab. Am Vorgang selbst ändert das nichts, eine gesperrte Adresse bleibt gesperrt. Ist nichts offen und die Einrichtung fertig, steht dort „Alles erledigt. Nichts wartet auf Sie.“',
          },
          {
            type: 'tip',
            text: 'Abmeldungen und gesperrte Adressen meldet MixMarket nur hier, nicht per Mail an Sie. Schauen Sie deshalb regelmäßig in die Übersicht.',
          },
        ],
      },
      {
        id: 'autopilot',
        title: 'Autopilot',
        blocks: [
          {
            type: 'tip',
            text: 'Der Autopilot für **Recherche**, **Schreiben** und **Antworten** gehört zu MixMarket Pro. Ohne Pro steht dort statt des Schalters ein Pro-Hinweis. Der Schalter **Versand** gehört zur kostenlosen Version.',
          },
          {
            type: 'p',
            text: 'Unter **Steuerung** schalten Sie den **Autopilot** für vier Bereiche mit je einem Schalter auf **An** oder **Aus**. Jede Änderung gilt sofort, MixMarket bestätigt sie mit „Steuerung gespeichert“.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Recherche', text: 'MixMarket durchleuchtet fertige Suchen, die noch nie durchleuchtet wurden, selbst, eine nach der anderen, die älteste zuerst. Außerdem bewertet es gespeicherte Zielgruppen mit Produkt selbst, und zwar die Firmen ohne aktuelle Bewertung. Es läuft immer nur ein Bewertungslauf gleichzeitig. Bewertet wird nur mit gewähltem KI-Anbieter und nicht während einer KI-Pause.' },
              { term: 'Schreiben', text: 'Firmen aus gespeicherten Zielgruppen mit Produkt, die für dieses Produkt aktuell bewertet sind und mindestens die **Mindestpassung** erreichen, übernimmt MixMarket als Interessenten und gibt sie in den Postausgang. Dorthin kommen nur Interessenten mit dem Status Neu und bekannter E-Mail-Adresse, die noch nicht im Postausgang sind, die mit der höchsten Passung zuerst. Je Tag legt MixMarket höchstens so viele Erstmails an, wie das **Tageslimit** des Postausgangs erlaubt. Erstmails, die Sie am selben Tag selbst anstoßen, zählen mit. Schreiben braucht einen gewählten KI-Anbieter.' },
              { term: 'Versand', text: 'Der Postausgang verschickt freigegebene Mails nach Ihren Versandregeln. Aus: Der Postausgang verschickt nichts. Die KI schreibt weiter, freigegebene Mails warten. Kampagnen, Automatisierungen und Antworten unter **Gespräche** betrifft dieser Schalter nicht.' },
              { term: 'Antworten', text: 'Die KI ordnet eingegangene Antworten ein und schreibt bei Interesse oder einer Frage einen Entwurf. Aus: Neue Antworten werden nicht eingeordnet und bekommen keinen automatischen Entwurf. Sie stehen bei **KI ordnet ein** und warten, bis Sie den Schalter wieder einschalten. Entwürfe, die Sie selbst anfordern, schreibt die KI trotzdem.' },
            ],
          },
          {
            type: 'p',
            text: 'Die **Mindestpassung** wählen Sie beim Bereich Schreiben, von ab 5 bis ab 10. Voreingestellt sind Recherche und Schreiben aus, Versand und Antworten an und die Mindestpassung ab 7.',
          },
          {
            type: 'p',
            text: 'Recherche und Schreiben laufen alle 10 Minuten. Schalten Sie einen der beiden ein, beginnt der erste Durchlauf sofort. Unter **Aktivitäten** stehen ihre Schritte mit dem Handelnden „Autopilot“: begonnene Durchleuchtungen und Bewertungen, neue Interessenten und Mails im Postausgang.',
          },
          {
            type: 'tip',
            text: 'Die Freigabe gilt weiter: Ist im **Ablauf** eines Produkts **Jede Mail vor dem Versand freigeben** gesetzt, warten auch die Mails des Autopiloten im Reiter **Zur Freigabe**.',
          },
          {
            type: 'warning',
            text: 'Firmen aus der Recherche haben keine dokumentierte Einwilligung. Der Autopilot Schreiben legt Mails an solche Firmen an, ohne dass Sie jede Firma einzeln auswählen. Werbung per E-Mail ohne Einwilligung kann nach UWG § 7 unzulässig sein. Lassen Sie die Freigabe im Ablauf gesetzt und prüfen Sie jeden Fall (Recht und Zustellbarkeit).',
          },
        ],
      },
      {
        id: 'emergency-stop',
        title: 'Not-Aus',
        blocks: [
          {
            type: 'p',
            text: 'Neben dem Autopiloten steht der **Not-Aus**. Solange alles läuft, zeigt er **Versand läuft**. Klicken Sie **Not-Aus** und bestätigen Sie die Rückfrage, stoppt MixMarket sofort jeden Versand:',
          },
          {
            type: 'list',
            items: [
              'Der Postausgang verschickt keine Mail mehr. Die KI schreibt weiter, freigegebene Mails warten. Auch eine Mail, deren Versand gerade begann, bleibt freigegeben.',
              'Eine laufende Kampagne bricht ab und steht danach auf Pausiert. Empfänger, die noch keine Mail bekommen haben, bleiben offen. Sie setzen die Kampagne nach der Freigabe selbst unter **Kampagnen** mit **Fortsetzen** fort.',
              'Geplante Kampagnen starten nicht. Sie bleiben geplant und starten nach der Freigabe, sobald ihr Zeitpunkt erreicht ist.',
              'Automatisierungen verschicken keine Nachfass-Mails. MixMarket prüft den Not-Aus vor jeder einzelnen Nachfass-Mail, die restlichen bleiben geplant und gehen nach der Freigabe hinaus.',
              'Unter **Gespräche** lässt sich keine Antwort senden. Der Entwurf bleibt zur Freigabe stehen.',
              '**Jetzt versenden** und **Fortsetzen** einer Kampagne verweigert MixMarket mit der Meldung „Der Versand ist per Not-Aus gestoppt.“',
            ],
          },
          {
            type: 'p',
            text: 'Danach zeigt der Not-Aus **Versand gestoppt**, den Grund und seit wann. Oben auf jeder Seite steht ein roter Balken „Not-Aus aktiv: Es wird nichts versendet.“ mit dem Knopf **Versand freigeben**.',
          },
          {
            type: 'p',
            text: 'Mit **Versand freigeben**, auf der Übersicht oder im roten Balken, heben Sie den Not-Aus nach einer Rückfrage auf. Postausgang, geplante Kampagnen, Nachfass-Automatisierungen und Antworten laufen dann wieder. Pausierte Kampagnen laufen nicht von selbst weiter.',
          },
          {
            type: 'p',
            text: 'Automatischer Not-Aus: Geht ein dauerhafter Rückläufer ein, zählt MixMarket die dauerhaften Rückläufer der letzten 24 Stunden. Der Not-Aus greift, wenn ihr Anteil an den versendeten Mails mindestens die Grenze unter **Not-Aus bei Rückläufern ab** erreicht und mindestens 20 Mails versendet wurden, oder wenn es 10 Rückläufer oder mehr sind. Ein automatischer Not-Aus erscheint als Hinweis unter **Wartet auf Sie**.',
          },
          {
            type: 'list',
            items: [
              'Als versendet zählen Mails aus Postausgang und Kampagnen, Nachfass-Mails aus Automatisierungen sowie Antworten unter **Gespräche**. Testversände aus Postausgang und Gespräche zählen nicht.',
              'Rückläufer erkennt MixMarket nur, wenn der Empfang (IMAP) eingerichtet ist (Gespräche, Rückläufer).',
            ],
          },
          {
            type: 'warning',
            text: 'Prüfen Sie nach einem automatischen Not-Aus die Rückläufer unter **Gespräche** in der Ansicht **Unzustellbar**, bevor Sie den Versand freigeben.',
          },
        ],
      },
      {
        id: 'limits',
        title: 'Grenzen',
        blocks: [
          {
            type: 'p',
            text: 'Unter **Grenzen** legen Sie fest, wann MixMarket selbst eingreift. Jede Änderung gilt sofort.',
          },
          {
            type: 'list',
            items: [
              '**Not-Aus bei Rückläufern ab**: Anteil dauerhaft unzustellbarer Mails in 24 Stunden, ab dem der automatische Not-Aus greift. Zur Wahl stehen 2, 3, 5, 8, 10 und 15 %, voreingestellt sind 5 %. Bei 10 Rückläufern in 24 Stunden greift er immer.',
              '**KI-Pause ab Auslastung**: Auslastung des gewählten KI-Abos, ab der die KI pausiert. Zur Wahl stehen 50 bis 95 % und **nie**, voreingestellt sind 80 %. Mit **nie** schalten Sie die KI-Pause ab.',
            ],
          },
        ],
      },
      {
        id: 'usage',
        title: 'Auslastung',
        blocks: [
          {
            type: 'p',
            text: 'Für das **Claude-Abo** und das **ChatGPT-Abo (Codex)** zeigt je ein Balken die Auslastung in **5 Stunden** und in der **Woche**, darunter den Zeitpunkt, an dem der Zeitraum zurückgesetzt wird. Das Abo, das in den Einstellungen gewählt ist, trägt die Marke **gewählt**. Nur bei ihm markiert ein Strich im Balken die Grenze der KI-Pause.',
          },
          {
            type: 'list',
            items: [
              'Claude: MixMarket fragt die Auslastung über eine nicht offiziell dokumentierte Schnittstelle von Anthropic ab, mit dem lokalen Anmeldeschlüssel von Claude Code auf diesem Rechner. Ist Claude Code nicht angemeldet oder die Abfrage nicht möglich, steht dort „Nicht abrufbar“ mit dem Grund.',
              'ChatGPT: MixMarket liest die zuletzt gemeldeten Werte aus den Dateien von Codex auf diesem Rechner, nur lesend. „Stand vom“ nennt, wann Codex sie gemeldet hat. Ist ein Zeitraum seitdem abgelaufen, zeigt MixMarket 0 %. Hat Codex noch nichts gemeldet, ist der Wert nicht abrufbar.',
              'Beide Wege können sich ohne Ankündigung ändern. MixMarket fragt die Werte höchstens alle 5 Minuten neu ab, nach einem Fehler nach einer Minute.',
            ],
          },
          {
            type: 'p',
            text: '**KI-Aufrufe** zählt in den Spalten **24 Stunden** und **7 Tage**, wie oft die KI gearbeitet hat, getrennt nach **Bewertung**, **Postausgang** und **Gespräche**. Fehlgeschlagene Aufrufe der letzten 24 Stunden stehen eigens daneben.',
          },
          {
            type: 'p',
            text: '**Versand heute** zeigt:',
          },
          {
            type: 'list',
            items: [
              '**Postausgang**: heute gesendete Mails von Ihrem Tageslimit, etwa „3 von 20“. Testversände sind eingerechnet und werden eigens genannt.',
              '**Kampagnen**: heute versendete Kampagnen-Mails.',
              '**Nachfass-Automatisierungen**: heute versendete Nachfass-Mails aus Automatisierungen.',
              '**Antworten**: heute unter **Gespräche** gesendete Antworten, ohne Testversand.',
              '**Rückläufer in 24 Stunden**: Zahl der dauerhaften Rückläufer, ihr Anteil an den versendeten Mails und die eingestellte Grenze. Ist die Grenze erreicht, ist der Wert rot.',
            ],
          },
          {
            type: 'p',
            text: '**Aktualisieren** lädt alle Werte sofort neu und fragt beide Abos neu ab.',
          },
        ],
      },
      {
        id: 'ai-pause',
        title: 'KI-Pause',
        blocks: [
          {
            type: 'p',
            text: 'Erreicht das gewählte KI-Abo in 5 Stunden oder in der Woche die Grenze unter **KI-Pause ab Auslastung**, pausiert die KI. Die Pause endet, sobald die Auslastung wieder unter der Grenze liegt, in der Regel wenn der Zeitraum zurückgesetzt wird. Während der Pause gilt:',
          },
          {
            type: 'list',
            items: [
              'Eine KI-Bewertung wartet vor dem nächsten Stapel und prüft jede Minute, ob die Pause vorbei ist. Beginnt die Pause während einer Anfrage, wiederholt sie diesen Stapel nach der Pause. Mit **Abbrechen** beenden Sie den Lauf auch in dieser Zeit.',
              'Der Postausgang wartet: Mails bleiben bei **KI schreibt** und werden nach der Pause geschrieben.',
              'Gespräche warten: Neue Antworten bleiben bei **KI ordnet ein**, angeforderte Entwürfe werden nach der Pause geschrieben.',
              'Der Autopilot Recherche startet keine Bewertung. Das Durchleuchten läuft weiter, es nutzt keine KI.',
              'Versand, Kampagnen und alles andere ohne KI laufen normal weiter.',
            ],
          },
          {
            type: 'p',
            text: 'Oben auf jeder Seite steht ein gelber Balken „KI-Pause“, wenn bekannt mit dem Ende der Pause. Trifft ein Aufruf an die KI auf die Pause, legt MixMarket einmal je Pause einen Hinweis unter **Wartet auf Sie** an und vermerkt den Beginn unter **Aktivitäten** im Bereich **Steuerung**. Das Ende vermerkt es beim ersten KI-Aufruf nach der Pause.',
          },
          {
            type: 'tip',
            text: 'Die KI-Pause gilt nur für das in den Einstellungen gewählte Abo und nur, wenn MixMarket dessen Auslastung abrufen kann. Ist sie nicht abrufbar, pausiert die KI nicht.',
          },
        ],
      },
      {
        id: 'key-figures',
        title: 'Kennzahlen',
        blocks: [
          {
            type: 'p',
            text: 'Unter der Auslastung stehen die Kennzahlen in einer Reihe:',
          },
          {
            type: 'list',
            items: [
              '**Aktive Kontakte**: Kontakte mit dem Status Aktiv, also alle, die Sie anschreiben können.',
              '**Listen** und **Kampagnen**: Anzahl Ihrer Listen und Kampagnen.',
              '**Versendet**: Summe der erfolgreich versendeten Mails aller Kampagnen.',
              '**Öffnungsrate**: Anteil der versendeten Kampagnen-Mails, die mindestens einmal geöffnet wurden.',
              '**Klickrate**: Anteil der versendeten Kampagnen-Mails, in denen mindestens ein Link angeklickt wurde.',
            ],
          },
          {
            type: 'tip',
            text: 'Die Kennzahlen beruhen auf Ihren Kampagnen. Nachfass-Mails aus Automatisierungen und Mails aus dem Postausgang zählen hier nicht mit, und gelöschte Kampagnen fallen aus den Zahlen heraus.',
          },
          {
            type: 'warning',
            text: 'Öffnungen werden über ein unsichtbares Bild in der Mail gezählt. Viele Mailprogramme laden Bilder nicht oder laden sie automatisch vor. Die Öffnungsrate ist deshalb nur ein grober Anhaltspunkt.',
          },
        ],
      },
      {
        id: 'send-timeline',
        title: 'Versandverlauf',
        blocks: [
          {
            type: 'p',
            text: 'Das Diagramm **Versandverlauf (30 Tage)** zeigt je Tag drei Werte: **Versendet** als durchgezogene Linie, **Öffnungen** als gestrichelte und **Klicks** als gepunktete Linie. Fahren Sie mit der Maus über das Diagramm, um die Werte eines Tages zu sehen.',
          },
          {
            type: 'tip',
            text: '**Versendet** zählt die Kampagnen-Mails. Bei **Öffnungen** und **Klicks** zählt jedes einzelne Ereignis, auch wiederholte Öffnungen und Ereignisse aus Nachfass-Mails und aus dem Postausgang. Wiederholte Öffnungen derselben Mail innerhalb einer Stunde zählen dabei einmal, wiederholte Klicks auf denselben Link innerhalb einer Minute ebenso.',
          },
        ],
      },
      {
        id: 'quick-actions',
        title: 'Schnellzugriff',
        blocks: [
          {
            type: 'p',
            text: 'Unter **Schnellzugriff** springen Sie mit **Neue Kampagne**, **Kontakt anlegen** und **Vorlage erstellen** direkt zur passenden Seite. Dort klicken Sie den gleichnamigen Knopf oben rechts.',
          },
        ],
      },
    ],
  },
  {
    id: 'contacts',
    title: 'Kontakte',
    summary: 'Kontakte sind die Empfänger Ihrer Mails; hier legen Sie sie an, bearbeiten, importieren und sehen ihren Status.',
    sections: [
      {
        id: 'overview',
        title: 'Die Kontaktliste',
        blocks: [
          {
            type: 'p',
            text: 'Ein Kontakt ist eine Person oder Firma mit E-Mail-Adresse. Die Tabelle zeigt je Kontakt E-Mail und Name, Firma, Branche und Status. Rechts in jeder Zeile stehen die Symbole zum Bearbeiten und Löschen.',
          },
          {
            type: 'p',
            text: 'Die Tabelle zeigt 50 Kontakte je Seite, die zuletzt angelegten zuerst. Unten steht die Zahl aller Kontakte, die zu Suche und Filtern passen. Gibt es mehr als eine Seite, blättern Sie dort mit den Pfeilknöpfen, daneben steht zum Beispiel „Seite 2 von 5“. Ältere Kontakte erreichen Sie durch Blättern.',
          },
        ],
      },
      {
        id: 'search-filter',
        title: 'Suchen und filtern',
        blocks: [
          {
            type: 'p',
            text: 'In der Werkzeugleiste über der Tabelle grenzen Sie die Kontakte ein. Alle Angaben wirken zusammen, und nach jeder Änderung beginnt die Tabelle wieder auf der ersten Seite.',
          },
          {
            type: 'list',
            items: [
              'Das Suchfeld durchsucht E-Mail-Adresse, Vorname, Nachname und Firma.',
              'Mit den Knöpfen **Alle**, **Aktiv**, **Abgemeldet**, **Unzustellbar** und **Beschwerde** zeigen Sie nur Kontakte mit diesem Status. Auf dem Handy wählen Sie den Status in einem Auswahlfeld.',
              'Das Auswahlfeld **Alle Listen** zeigt nur die Kontakte einer Liste. Hinter jedem Listennamen steht die Zahl ihrer Kontakte.',
            ],
          },
          {
            type: 'tip',
            text: 'Unter **Listen** führt ein Klick auf die Kontaktanzahl einer Liste direkt hierher, mit dieser Liste als Filter.',
          },
        ],
      },
      {
        id: 'create',
        title: 'Kontakt anlegen',
        blocks: [
          {
            type: 'steps',
            items: [
              'Klicken Sie oben rechts auf **Kontakt anlegen**.',
              'Tragen Sie die **E-Mail** ein. Sie ist das einzige Pflichtfeld und darf nur einmal vorkommen.',
              'Füllen Sie nach Bedarf **Anrede**, **Titel (optional)**, **Vorname**, **Nachname**, **Firma**, **Position**, **Land**, **Branche**, **Webseite** und **Notizen** aus.',
              'Setzen Sie den Haken bei **Einwilligung dokumentiert** nur, wenn Ihnen die Einwilligung des Empfängers tatsächlich vorliegt.',
              'Wählen Sie unter **Zu Listen hinzufügen** die Listen, in die der Kontakt gehört.',
              'Klicken Sie **Speichern**.',
            ],
          },
          {
            type: 'tip',
            text: 'Die Felder Vorname, Nachname, Firma, Position, Land und Branche können Sie in Vorlagen als Platzhalter verwenden. Je vollständiger der Kontakt, desto persönlicher die Mail.',
          },
          {
            type: 'p',
            text: 'Ein neuer Kontakt hat zunächst immer den Status Aktiv. Das Feld **Status** erscheint erst beim Bearbeiten.',
          },
        ],
      },
      {
        id: 'salutation-title',
        title: 'Anrede und Titel',
        blocks: [
          {
            type: 'p',
            text: 'Aus **Anrede**, **Titel (optional)** und Namen bildet MixMarket die Briefanrede für den Platzhalter {{anrede}}. Die Sprache bestimmt die Vorlage: In englischen Vorlagen lautet sie etwa „Dear Mr Smith“ (Vorlagen, Der Platzhalter {{anrede}}). In deutschen Vorlagen gilt:',
          },
          {
            type: 'list',
            items: [
              'Anrede **Herr** und Nachname: „Sehr geehrter Herr Dr. Muster“ (der Titel nur, wenn eingetragen).',
              'Anrede **Frau** und Nachname: „Sehr geehrte Frau Dr. Muster“.',
              'Anrede **Keine Angabe**, aber Nachname vorhanden: „Guten Tag Dr. Erika Muster“ mit Vor und Nachname.',
              'Kein Nachname: „Sehr geehrte Damen und Herren“.',
            ],
          },
          {
            type: 'p',
            text: 'Schreibt die KI im Postausgang an einen Kontakt ohne Anrede, leitet sie die Anrede aus dem Vornamen ab und MixMarket trägt sie im Feld **Anrede** ein. Bei uneindeutigen Vornamen bleibt **Keine Angabe** stehen. Eine falsche Anrede ändern Sie beim Bearbeiten des Kontakts (Postausgang, Wie die KI schreibt).',
          },
          {
            type: 'tip',
            text: 'Tragen Sie im Feld **Titel (optional)** nur akademische Titel wie Dr. oder Prof. ein, keine Berufsbezeichnungen.',
          },
        ],
      },
      {
        id: 'edit-delete',
        title: 'Bearbeiten und löschen',
        blocks: [
          {
            type: 'p',
            text: 'Das Stiftsymbol in einer Zeile öffnet den Kontakt zum Bearbeiten. Hier ändern Sie alle Felder, den **Status** und die Listenzuordnung. Das Papierkorbsymbol löscht den Kontakt nach einer Rückfrage.',
          },
          {
            type: 'warning',
            text: 'Löschen entfernt den Kontakt endgültig. Steht seine Adresse auf der Sperrliste, bleibt der Eintrag dort erhalten. Läuft für den Kontakt ein Ablauf im Postausgang, endet er spätestens vor dem nächsten Versand.',
          },
        ],
      },
      {
        id: 'import',
        title: 'Kontakte importieren',
        blocks: [
          {
            type: 'p',
            text: 'Mit **Importieren** übernehmen Sie viele Kontakte auf einmal, eine Zeile je Kontakt. Die Reihenfolge der Angaben ist E-Mail, Vorname, Nachname, Firma, jeweils durch Komma getrennt. Nur die E-Mail ist Pflicht.',
          },
          {
            type: 'steps',
            items: [
              'Klicken Sie oben rechts auf **Importieren**.',
              'Fügen Sie Ihre Zeilen in das Textfeld ein, zum Beispiel: max@firma.de, Max, Mustermann, Firma GmbH',
              'Wählen Sie bei Bedarf unter **In Liste aufnehmen (optional)** eine Liste. Neue und schon vorhandene Kontakte kommen dann in diese Liste. Mit **Keine Liste** ordnet der Import keine Liste zu.',
              'Klicken Sie unten auf **Importieren**.',
            ],
          },
          {
            type: 'list',
            items: [
              'Neue Adressen werden als Kontakte angelegt.',
              'Gibt es die Adresse schon, ergänzt der Import nur leere Felder und ordnet die gewählte Liste zu. E-Mail, Status und Einwilligung eines vorhandenen Kontakts ändert er nie.',
              'Kommt eine Adresse in der Eingabe mehrfach vor, zählt sie nur einmal. Zeilen ohne @ werden übersprungen.',
            ],
          },
          {
            type: 'p',
            text: 'Danach meldet MixMarket zum Beispiel „12 neu angelegt, 3 ergänzt, 5 unverändert“. Ergänzt sind vorhandene Kontakte, bei denen der Import Felder gefüllt oder die Liste zugeordnet hat. Unverändert sind vorhandene Kontakte ohne neue Angaben und doppelte Zeilen.',
          },
          {
            type: 'tip',
            text: 'Neu importierte Kontakte haben keine dokumentierte Einwilligung. Ohne gewählte Liste stehen sie in keiner Liste. Ordnen Sie sie dann über das Bearbeiten-Fenster zu. Setzen Sie die Einwilligung nur, wenn sie Ihnen vorliegt.',
          },
        ],
      },
      {
        id: 'status',
        title: 'Status eines Kontakts',
        blocks: [
          {
            type: 'p',
            text: 'Der Status zeigt, ob ein Kontakt angeschrieben werden kann. Kampagnen, Nachfass-Mails und Mails aus dem Postausgang gehen nur an Kontakte mit dem Status Aktiv. Ist ein Kontakt nicht mehr aktiv, endet sein Ablauf im Postausgang spätestens vor dem nächsten Versand.',
          },
          {
            type: 'list',
            items: [
              '**Aktiv**: kann angeschrieben werden.',
              '**Abgemeldet**: Der Empfänger hat sich über den Link in einer Mail abgemeldet oder in einer Antwort um keine weiteren Mails gebeten (Gespräche, Einordnung Abmeldung), Sie haben diesen Status gesetzt, oder Sie haben die Adresse unter **Sperrliste** mit einem anderen Grund als Unzustellbar gesperrt.',
              '**Unzustellbar**: MixMarket hat einen dauerhaften Rückläufer an diese Adresse erkannt (Gespräche), Sie haben diesen Status gesetzt, oder Sie haben die Adresse mit dem Grund Unzustellbar gesperrt. Bei einem Rückläufer erhält nur ein aktiver Kontakt diesen Status, ein anderer Status bleibt.',
              '**Beschwerde**: Sie haben diesen Status gesetzt, etwa weil sich der Empfänger beschwert hat.',
            ],
          },
          {
            type: 'p',
            text: 'Den Status ändern Sie im Bearbeiten-Fenster des Kontakts im Feld **Status**. Abgemeldet, Unzustellbar und Beschwerde setzen die Adresse auf die Sperrliste, mit dem passenden Grund. Aktiv hebt die Sperre wieder auf.',
          },
          {
            type: 'p',
            text: 'Umgekehrt folgt der Status der Sperrliste: Sperren Sie eine Adresse unter **Sperrliste**, wird der Kontakt abgemeldet oder unzustellbar. Geben Sie sie dort frei, wird er wieder aktiv.',
          },
          {
            type: 'warning',
            text: 'Setzen Sie einen abgemeldeten Kontakt nur dann wieder auf Aktiv, wenn der Empfänger ausdrücklich wieder Mails von Ihnen möchte.',
          },
        ],
      },
      {
        id: 'consent',
        title: 'Einwilligung',
        blocks: [
          {
            type: 'p',
            text: 'Der Haken **Einwilligung dokumentiert** hält fest, dass Ihnen die Einwilligung dieses Empfängers in Werbung per E-Mail vorliegt. MixMarket prüft das nicht selbst, der Haken ist Ihre eigene Angabe.',
          },
          {
            type: 'warning',
            text: 'Setzen Sie den Haken nur, wenn Sie die Einwilligung nachweisen können. Mehr dazu im Kapitel Recht und Zustellbarkeit.',
          },
        ],
      },
      {
        id: 'origin-research',
        title: 'Kontakte aus der Recherche',
        blocks: [
          {
            type: 'p',
            text: 'Kontakte, die Sie in der Recherche über **In Kontakte übernehmen** oder **Anschreiben** aus den Interessenten anlegen, erhalten intern die Herkunft „Recherche“ und keine Einwilligung. Sie sind mit der Firma aus der Recherche verknüpft, damit der Ansatzpunkt der KI in Ihre Mail kommen kann.',
          },
          {
            type: 'p',
            text: 'Bevor Sie eine Kampagne senden oder planen, weist MixMarket Sie darauf hin, wie viele Empfänger keine dokumentierte Einwilligung haben und wie viele davon aus der Recherche stammen. Im Postausgang tragen Mails an Kontakte ohne Einwilligung die Kennzeichnung **Ohne Einwilligung**.',
          },
        ],
      },
    ],
  },
  {
    id: 'lists',
    title: 'Listen',
    summary: 'Listen fassen Kontakte zu Gruppen zusammen, an die Sie Kampagnen schicken.',
    sections: [
      {
        id: 'purpose',
        title: 'Wofür Listen da sind',
        blocks: [
          {
            type: 'p',
            text: 'Eine Kampagne geht immer an eine oder mehrere Listen. Ein Kontakt kann in beliebig vielen Listen stehen. Steht er in mehreren Listen einer Kampagne, bekommt er die Mail trotzdem nur einmal.',
          },
          {
            type: 'p',
            text: 'Die Seite **Listen** zeigt je Liste Namen, Beschreibung, Typ und die Zahl der Kontakte. Ein Klick auf die Kontaktanzahl öffnet **Kontakte** mit dieser Liste als Filter, so sehen Sie sofort, wer in der Liste steht.',
          },
        ],
      },
      {
        id: 'create',
        title: 'Liste anlegen und bearbeiten',
        blocks: [
          {
            type: 'steps',
            items: [
              'Klicken Sie oben rechts auf **Liste anlegen**.',
              'Geben Sie einen **Name** ein, auf Wunsch eine **Beschreibung**.',
              'Wählen Sie den **Typ**, meist **Normal**.',
              'Unter **Farbe (optional)** können Sie einen Farbwert wie #0066ff eintragen. Die Farbe erscheint als Punkt vor dem Namen.',
              'Klicken Sie **Speichern**.',
            ],
          },
          {
            type: 'p',
            text: 'Mit **Bearbeiten** in der Zeile ändern Sie eine Liste später.',
          },
        ],
      },
      {
        id: 'assign-contacts',
        title: 'Kontakte in eine Liste aufnehmen',
        blocks: [
          {
            type: 'p',
            text: 'So kommen Kontakte in eine Liste:',
          },
          {
            type: 'list',
            items: [
              'Einzeln: Öffnen Sie den Kontakt unter **Kontakte** zum Bearbeiten und setzen Sie unter **Zu Listen hinzufügen** die Haken.',
              'Beim Import: Wählen Sie unter **In Liste aufnehmen (optional)** die Liste. Neue und schon vorhandene Kontakte kommen hinein.',
              'Aus der Recherche: Kontakte, die Sie über **In Kontakte übernehmen** oder **Anschreiben** anlegen oder verknüpfen, kommen automatisch in die Interessentenliste ihres Produkts.',
            ],
          },
        ],
      },
      {
        id: 'list-types',
        title: 'Listentypen',
        blocks: [
          {
            type: 'p',
            text: 'Der **Typ** (**Normal**, **Abgemeldet**, **Unzustellbar**) dient nur der Einordnung und wird als farbige Marke angezeigt. MixMarket füllt diese Listen nicht automatisch. Wer wirklich nicht mehr angeschrieben werden darf, steht auf der Sperrliste.',
          },
        ],
      },
      {
        id: 'prospect-lists',
        title: 'Interessentenlisten je Produkt',
        blocks: [
          {
            type: 'p',
            text: 'Wenn Sie in der Recherche zum ersten Mal Interessenten eines Produkts in die Kontakte übernehmen oder anschreiben, legt MixMarket automatisch eine Liste namens „Interessenten“ mit dem Produktnamen an. Jede weitere Übernahme für dieses Produkt landet in derselben Liste.',
          },
          {
            type: 'p',
            text: 'Diese Liste ist mit dem Produkt verbunden. Nur über sie findet der Platzhalter {{ansatz}} den Ansatzpunkt der KI für einen Kontakt. Wählen Sie deshalb für eine Kampagne mit {{ansatz}} die Interessentenliste des Produkts als Empfängerliste.',
          },
          {
            type: 'tip',
            text: 'Sie können die Interessentenliste umbenennen. Die Verbindung zum Produkt bleibt erhalten.',
          },
        ],
      },
      {
        id: 'delete',
        title: 'Liste löschen',
        blocks: [
          {
            type: 'p',
            text: 'Das Papierkorbsymbol löscht eine Liste nach einer Rückfrage. Die Kontakte darin bleiben erhalten, sie verlieren nur die Zuordnung zu dieser Liste.',
          },
        ],
      },
    ],
  },
  {
    id: 'templates',
    title: 'Vorlagen',
    summary: 'In Vorlagen schreiben Sie den Inhalt Ihrer Mails und setzen Platzhalter für persönliche Angaben ein.',
    sections: [
      {
        id: 'purpose',
        title: 'Wofür Vorlagen da sind',
        blocks: [
          {
            type: 'p',
            text: 'Eine Vorlage enthält den Text einer Mail. Kampagnen und Automatisierungen verwenden eine Vorlage als Inhalt. Die Seite **Vorlagen** zeigt je Vorlage Namen, Sprache (DE oder EN), Betreff und das Datum der letzten Änderung.',
          },
        ],
      },
      {
        id: 'editor',
        title: 'Vorlage erstellen und bearbeiten',
        blocks: [
          {
            type: 'steps',
            items: [
              'Klicken Sie oben rechts auf **Vorlage erstellen**, oder bei einer vorhandenen Vorlage auf **Bearbeiten**.',
              'Geben Sie einen **Name** und einen **Betreff** ein. Beide sind Pflicht und mit * gekennzeichnet. Fehlt eines, markiert MixMarket das Feld beim Speichern rot.',
              'Wählen Sie unter **Sprache der Mail** **Deutsch** oder **Englisch**. Die Sprache bestimmt die Briefanrede {{anrede}}, den Abmelde-Hinweis im Footer und den Text des Abmeldelinks. Neue Vorlagen und Vorlagen aus früheren Versionen sind auf **Deutsch** eingestellt.',
              'Schreiben Sie den Text in das Feld **HTML-Inhalt**. Das Feld erwartet HTML, also zum Beispiel <p>Absatz</p> für einen Absatz und <a href="https://...">Linktext</a> für einen Link.',
              'Setzen Sie Platzhalter ein: Ein Klick auf einen Platzhalter unter **Platzhalter** hängt ihn ans Ende des Textes an. Verschieben Sie ihn dann an die richtige Stelle, oder tippen Sie ihn direkt mit doppelten geschweiften Klammern.',
              'Klicken Sie **Speichern**.',
            ],
          },
          {
            type: 'tip',
            text: 'Ihre Signatur schreiben Sie nicht in die Vorlage. MixMarket hängt die **Signatur** aus den Einstellungen beim Versand automatisch unter den Inhalt jeder Mail. Enthält Ihre Signatur schon einen Gruß wie „Viele Grüße“, schreiben Sie in der Vorlage keinen eigenen, sonst steht er doppelt da.',
          },
          {
            type: 'tip',
            text: 'Den Text der Mail und den Betreff schreiben Sie selbst in der gewählten Sprache. MixMarket übersetzt nichts. Die **Signatur** ist für alle Vorlagen dieselbe.',
          },
        ],
      },
      {
        id: 'packs',
        title: 'Vorlagenpakete',
        blocks: [
          {
            type: 'tip',
            text: 'Vorlagenpakete gehören zu MixMarket Pro. Ohne Pro zeigt der Knopf **Vorlagenpakete**, was die Pakete können.',
          },
          {
            type: 'p',
            text: 'Statt selbst zu schreiben, wählen Sie über **Vorlagenpakete** oben rechts, was Sie anbieten: **Webdesign-Agentur**, **Marketing-Agentur**, **IT-Dienstleister**, **Software-Anbieter**, **Unternehmensberatung**, **Foto und Video** oder **Gebäudereinigung**. **Ansehen** zeigt den Inhalt des Pakets.',
          },
          {
            type: 'list',
            items: [
              '**Drei Vorlagen**: Erstkontakt, Nachfassen und Terminvorschlag. Ein Klick auf eine Vorlage zeigt ihren Text. Unter **Sprache** wählen Sie Deutsch oder Englisch.',
              '**KI-Hinweise für die persönliche Ansprache**: Hinweise an die KI, wie sie Ihre Erstmails im Postausgang schreibt. Mit dem Häkchen übernimmt das Paket sie für das Produkt, das in der Recherche gewählt ist. Hat das Produkt schon eigene Hinweise, ist das Häkchen zunächst aus, denn das Paket würde sie ersetzen.',
              '**Passende Branchen für die Firmensuche**: Ein Klick öffnet die Firmensuche in der Recherche mit dieser Branche.',
            ],
          },
          {
            type: 'p',
            text: '**Paket übernehmen** legt die drei Vorlagen an, zum Beispiel „Webdesign: Erstkontakt“. Hat Ihre Signatur keine Grußformel, schreibt MixMarket „Mit freundlichen Grüßen“ ans Ende. Vorlagen mit demselben Namen legt das Paket kein zweites Mal an. Danach bearbeiten Sie die Vorlagen wie jede andere.',
          },
        ],
      },
      {
        id: 'preview',
        title: 'Vorschau',
        blocks: [
          {
            type: 'p',
            text: 'Neben dem Editor zeigt die **Vorschau**, wie der HTML-Inhalt dargestellt wird. Auf schmalen Bildschirmen wechseln Sie mit **Editor** und **Vorschau** zwischen beiden Ansichten.',
          },
          {
            type: 'p',
            text: 'Die Vorschau läuft in einem abgeschotteten Rahmen. Skripte und Formulare im HTML-Inhalt sind dort wirkungslos, und Bilder von fremden Adressen lädt die Vorschau nicht. In der versendeten Mail erscheinen diese Bilder wie gewohnt.',
          },
          {
            type: 'tip',
            text: 'Die Vorschau zeigt die Platzhalter so, wie Sie sie geschrieben haben, also zum Beispiel {{anrede}}. Ersetzt werden sie erst beim Versand. Signatur und Footer mit Postanschrift und Abmelde-Link werden ebenfalls erst beim Versand angehängt.',
          },
        ],
      },
      {
        id: 'placeholders',
        title: 'Die Platzhalter',
        blocks: [
          {
            type: 'p',
            text: 'Platzhalter stehen in doppelten geschweiften Klammern und werden beim Versand für jeden Empfänger durch seine Daten ersetzt. Sie wirken im HTML-Inhalt der Vorlage und im Betreff der Kampagne oder Automatisierung.',
          },
          {
            type: 'terms',
            items: [
              { term: '{{firstName}}', text: 'Vorname des Kontakts.' },
              { term: '{{lastName}}', text: 'Nachname des Kontakts.' },
              { term: '{{email}}', text: 'E-Mail-Adresse des Kontakts.' },
              { term: '{{company}}', text: 'Firma des Kontakts.' },
              { term: '{{position}}', text: 'Position des Kontakts.' },
              { term: '{{country}}', text: 'Land des Kontakts.' },
              { term: '{{sector}}', text: 'Branche des Kontakts.' },
              { term: '{{anrede}}', text: 'Vollständige Briefanrede aus Anrede, Titel und Name in der Sprache der Vorlage, zum Beispiel „Sehr geehrte Frau Dr. Muster“ oder „Dear Ms Miller“.' },
              { term: '{{ansatz}}', text: 'Ansatzpunkt der KI für die Erstansprache, passend zum Produkt der Interessentenliste.' },
            ],
          },
          {
            type: 'list',
            items: [
              'Ist ein Feld beim Kontakt leer, bleibt an dieser Stelle nichts stehen.',
              'Ein falsch geschriebener Platzhalter wird nicht ersetzt und erscheint unverändert in der Mail. Prüfen Sie die Schreibweise genau, auch Groß und Kleinschreibung.',
              'Im HTML-Inhalt setzt MixMarket die Werte als reinen Text ein. Steht in einem Kontaktfeld oder im Ansatzpunkt HTML, etwa ein Link, erscheint es in der Mail als sichtbarer Text und wird nicht ausgeführt.',
              'Im Betreff entfernt MixMarket Zeilenumbrüche aus den eingesetzten Werten und setzt an ihre Stelle ein Leerzeichen.',
            ],
          },
        ],
      },
      {
        id: 'placeholder-anrede',
        title: 'Der Platzhalter {{anrede}}',
        blocks: [
          {
            type: 'p',
            text: '{{anrede}} setzt die passende Briefanrede in der **Sprache der Mail** der Vorlage ein. MixMarket bildet sie aus den Feldern **Anrede**, **Titel (optional)**, **Vorname** und **Nachname** des Kontakts. In deutschen Vorlagen:',
          },
          {
            type: 'list',
            items: [
              'Herr mit Nachname: „Sehr geehrter Herr Muster“, mit Titel „Sehr geehrter Herr Dr. Muster“.',
              'Frau mit Nachname: „Sehr geehrte Frau Muster“.',
              'Ohne Anrede, aber mit Nachname: „Guten Tag Erika Muster“.',
              'Ohne Nachname: „Sehr geehrte Damen und Herren“.',
            ],
          },
          {
            type: 'p',
            text: 'In englischen Vorlagen:',
          },
          {
            type: 'list',
            items: [
              'Herr mit Nachname: „Dear Mr Smith“.',
              'Frau mit Nachname: „Dear Ms Miller“.',
              'Mit Titel und Nachname, ob mit oder ohne Anrede: „Dear Dr. Smith“. Der Titel ersetzt dann Mr oder Ms.',
              'Ohne Anrede, aber mit Nachname: „Dear John Smith“.',
              'Ohne Nachname: „Dear Sir or Madam“.',
            ],
          },
          {
            type: 'tip',
            text: 'Die Anrede endet ohne Satzzeichen. Schreiben Sie das Komma selbst direkt hinter {{anrede}}. In deutschen Vorlagen beginnen Sie die nächste Zeile klein.',
          },
          {
            type: 'p',
            text: 'Bei Kontakten aus der Recherche kommen Anrede und Name vom gewählten Ansprechpartner der Firma. Ist keiner bekannt, lautet die Anrede „Sehr geehrte Damen und Herren“ oder in englischen Vorlagen „Dear Sir or Madam“.',
          },
        ],
      },
      {
        id: 'placeholder-ansatz',
        title: 'Der Platzhalter {{ansatz}}',
        blocks: [
          {
            type: 'p',
            text: '{{ansatz}} setzt den Ansatzpunkt ein, den die KI bei der Bewertung einer Firma vorgeschlagen hat: ein bis zwei sachliche Sätze, die ein konkretes Detail der Firma mit Ihrem Produkt verbinden, ohne Anrede und Grußformel. Die KI formuliert den Ansatzpunkt immer auf Deutsch, auch für Vorlagen mit der Sprache Englisch. In englischen Vorlagen verwenden Sie {{ansatz}} daher besser nicht.',
          },
          {
            type: 'p',
            text: 'Damit {{ansatz}} gefüllt wird, müssen alle Bedingungen erfüllt sein:',
          },
          {
            type: 'list',
            items: [
              'Der Kontakt wurde über **In Kontakte übernehmen** aus den Interessenten angelegt oder mit der Firma verknüpft.',
              'Er steht in der Interessentenliste des Produkts, und genau diese Liste ist eine Empfängerliste der Kampagne.',
              'Die Firma wurde für dieses Produkt mit KI bewertet und hat eine Passung über 3. Bei 1 bis 3 schreibt die KI keinen Ansatzpunkt.',
            ],
          },
          {
            type: 'p',
            text: 'Fehlt der Ansatzpunkt, bleibt die Stelle leer. Vor dem Versand und beim Planen zeigt MixMarket deshalb an, wie vielen Empfängern er fehlt.',
          },
          {
            type: 'tip',
            text: 'Schreiben Sie den Satz um {{ansatz}} so, dass die Mail auch ohne ihn verständlich bleibt. Den Ansatzpunkt einer Firma können Sie in ihrer Detailansicht mit **Kopieren** übernehmen und prüfen.',
          },
          {
            type: 'warning',
            text: 'Ändern Sie Produktbeschreibung, idealen Kunden oder Mindestgröße, gelten die Bewertungen als veraltet. {{ansatz}} verwendet dann weiter den bisherigen Ansatzpunkt, bis Sie die Firmen neu bewerten.',
          },
        ],
      },
      {
        id: 'footer-tracking',
        title: 'Was beim Versand hinzukommt',
        blocks: [
          {
            type: 'list',
            items: [
              'Unter den Inhalt setzt MixMarket Ihre **Signatur** aus den Einstellungen, sofern dort eine eingetragen ist.',
              'Am Ende jeder Mail hängt MixMarket einen Footer an: Ihre Postanschrift aus den Einstellungen mit ihren Zeilenumbrüchen, dazu Abmelde-Hinweis und Abmeldelink in der **Sprache der Mail** der Vorlage. Bei Deutsch sind das der **Abmelde-Hinweis Deutsch** und der Link „Hier abmelden“, bei Englisch der **Abmelde-Hinweis Englisch** und der Link „Unsubscribe here“.',
              'Links in Inhalt und Signatur, die mit http oder https beginnen, werden über MixMarket umgeleitet, damit Klicks gezählt werden. Der Empfänger landet danach auf der ursprünglichen Seite.',
              'Ein unsichtbares Bild zählt, ob die Mail geöffnet wurde.',
              'Zusätzlich erzeugt MixMarket aus dem HTML automatisch eine reine Textfassung mit Inhalt, Signatur, Postanschrift und Abmelde-Link in derselben Sprache und schickt sie mit. Das verbessert die Zustellbarkeit.',
            ],
          },
        ],
      },
      {
        id: 'subject-note',
        title: 'Betreff der Vorlage',
        blocks: [
          {
            type: 'p',
            text: 'Der **Betreff** der Vorlage ist ein Vorschlag. Wählen Sie in einer Kampagne eine Vorlage, während der Betreff der Kampagne leer ist, übernimmt MixMarket den Betreff der Vorlage in das Feld. Versendet wird immer der Betreff der Kampagne oder Automatisierung. In einer Automatisierung tragen Sie den Betreff selbst ein.',
          },
        ],
      },
      {
        id: 'delete',
        title: 'Vorlage löschen',
        blocks: [
          {
            type: 'p',
            text: 'Das Papierkorbsymbol in der Zeile löscht eine Vorlage nach einer Rückfrage.',
          },
        ],
      },
    ],
  },
  {
    id: 'campaigns',
    title: 'Kampagnen',
    summary: 'Eine Kampagne verschickt eine Vorlage an die Kontakte ausgewählter Listen, sofort oder zu einem geplanten Zeitpunkt.',
    sections: [
      {
        id: 'purpose',
        title: 'Die Kampagnenliste',
        blocks: [
          {
            type: 'p',
            text: 'Die Seite **Kampagnen** zeigt je Kampagne Namen und Betreff, den Status, die Kennzahlen und rechts die Knöpfe, die zum Status passen.',
          },
        ],
      },
      {
        id: 'create',
        title: 'Kampagne anlegen',
        blocks: [
          {
            type: 'steps',
            items: [
              'Klicken Sie oben rechts auf **Neue Kampagne**.',
              'Tragen Sie **Name der Kampagne** und **Betreff** ein. Im Betreff dürfen Platzhalter stehen, zum Beispiel {{company}}.',
              'Prüfen Sie **Absendername** und **Absenderadresse**. Bei einer neuen Kampagne sind beide aus Ihrem Postfach in den Einstellungen vorausgefüllt. Verwenden Sie als Absenderadresse am besten die Adresse Ihres Postfachs.',
              'Wählen Sie unter **Vorlage** den Inhalt der Mail. Ist der Betreff noch leer, übernimmt MixMarket dabei den Betreff der Vorlage.',
              'Setzen Sie unter **Listen** die Haken bei allen Listen, deren Kontakte die Mail bekommen sollen. Neben jeder Liste steht die Zahl ihrer Kontakte.',
              'Lassen Sie **Geplant für** leer, um die Kampagne als Entwurf zu speichern. Wählen Sie Datum und Uhrzeit, wird die Kampagne beim Speichern geplant und zu diesem Zeitpunkt automatisch versendet.',
              'Klicken Sie **Speichern**.',
            ],
          },
          {
            type: 'list',
            items: [
              'Pflichtfelder sind mit * markiert: **Name der Kampagne**, **Betreff**, **Absendername** und **Absenderadresse**. Fehlt eines oder ist die Absenderadresse ungültig, markiert MixMarket das Feld rot und meldet „Bitte die rot markierten Pflichtfelder ausfüllen.“',
              'Die **Vorlage** ist für Versand und Planung nötig, darauf weist der Hinweis unter dem Feld hin. Einen Entwurf können Sie auch ohne Vorlage speichern.',
              'Ein Zeitpunkt unter **Geplant für** braucht eine Vorlage und muss in der Zukunft liegen. Sonst speichert MixMarket nicht und meldet den Grund.',
            ],
          },
        ],
      },
      {
        id: 'recipients',
        title: 'Wer die Mail bekommt',
        blocks: [
          {
            type: 'p',
            text: 'Empfänger sind alle Kontakte der gewählten Listen, die den Status Aktiv haben und nicht auf der Sperrliste stehen. Jeder Kontakt bekommt die Mail nur einmal, auch wenn er in mehreren Listen steht. Die Empfänger werden erst beim Versand ermittelt.',
          },
        ],
      },
      {
        id: 'send-now',
        title: 'Sofort versenden',
        blocks: [
          {
            type: 'steps',
            items: [
              'Klicken Sie in der Zeile eines Entwurfs auf **Jetzt versenden**.',
              'MixMarket zeigt, an wie viele Empfänger die Kampagne geht, und darunter mögliche Warnhinweise.',
              'Bestätigen Sie mit **Jetzt versenden** oder brechen Sie ab.',
            ],
          },
          {
            type: 'p',
            text: 'Hat die Kampagne keine Vorlage oder enthalten die gewählten Listen keine Empfänger, an die versendet werden darf, verweigert MixMarket den Versand mit einer Meldung. Ist der Not-Aus aktiv, verweigert MixMarket den Versand mit der Meldung „Der Versand ist per Not-Aus gestoppt.“ (Übersicht, Not-Aus).',
          },
          {
            type: 'p',
            text: 'Der Versand läuft im Hintergrund. Zwischen zwei Mails legt MixMarket eine kurze Pause ein, damit Ihr Postfach nicht als Massenversender auffällt. Der Status steht währenddessen auf **Wird versendet**.',
          },
        ],
      },
      {
        id: 'schedule',
        title: 'Versand planen',
        blocks: [
          {
            type: 'steps',
            items: [
              'Klicken Sie in der Zeile eines Entwurfs auf **Planen**.',
              'Wählen Sie unter **Geplant für** Datum und Uhrzeit und klicken Sie **Übernehmen**. Zeitpunkte in der Vergangenheit sind nicht möglich.',
              'Lesen Sie die Warnhinweise, falls welche erscheinen, und klicken Sie **Planen**.',
            ],
          },
          {
            type: 'p',
            text: 'Die Kampagne steht danach auf **Geplant**, darunter der Zeitpunkt. MixMarket prüft jede Minute, ob eine geplante Kampagne fällig ist, und startet dann den Versand. Während eines Not-Aus bleibt eine fällige Kampagne geplant und startet nach der Freigabe des Versands.',
          },
          {
            type: 'p',
            text: 'Ohne Vorlage oder ohne zulässige Empfänger verweigert MixMarket die Planung mit einer Meldung.',
          },
          {
            type: 'tip',
            text: 'Sie können auch im Bearbeiten-Fenster unter **Geplant für** einen Zeitpunkt eintragen. Beim Speichern wird die Kampagne zuerst als Entwurf gesichert, danach prüft MixMarket wie beim Knopf **Planen** die Empfänger, zeigt die Warnhinweise und fragt, ob Sie planen möchten. Lehnen Sie ab, bleibt die Kampagne ein Entwurf.',
          },
          {
            type: 'p',
            text: 'Eine geplante Kampagne halten Sie mit **Planung aufheben** in ihrer Zeile an. Nach einer Rückfrage wird sie wieder zum Entwurf. Sie lässt sich dann bearbeiten, sofort versenden oder neu planen.',
          },
        ],
      },
      {
        id: 'warnings',
        title: 'Warnhinweise vor dem Versand',
        blocks: [
          {
            type: 'p',
            text: 'Vor dem Versand und im Fenster zum Planen prüft MixMarket die Empfänger und Ihre Einstellungen und zeigt bei Bedarf diese Hinweise:',
          },
          {
            type: 'list',
            items: [
              'Fehlende Einwilligung: wie viele Empfänger keine dokumentierte Einwilligung haben, egal woher sie stammen, und wie viele davon aus der Recherche kommen.',
              'Fehlender Ansatzpunkt: Nutzt die Vorlage oder der Betreff {{ansatz}}, zeigt MixMarket, wie vielen Empfängern der Ansatzpunkt fehlt. Bei ihnen bleibt die Stelle leer.',
              'Fehlende Postanschrift: In den Einstellungen ist keine **Postanschrift (Pflicht im Footer)** eingetragen. Sie gehört in den Footer jeder Mail.',
            ],
          },
          {
            type: 'p',
            text: 'Die Hinweise sperren den Versand nicht. Sie entscheiden selbst, ob Sie fortfahren. Gesperrt sind Versand und Planung nur ohne Vorlage oder ohne zulässige Empfänger.',
          },
        ],
      },
      {
        id: 'status',
        title: 'Status einer Kampagne',
        blocks: [
          {
            type: 'terms',
            items: [
              { term: 'Entwurf', text: 'Angelegt, noch nicht versendet. Sie können bearbeiten, versenden, planen und löschen.' },
              { term: 'Geplant', text: 'Wartet auf den gewählten Zeitpunkt. Sie können die Planung aufheben oder die Kampagne löschen.' },
              { term: 'Wird versendet', text: 'Der Versand läuft gerade.' },
              { term: 'Versendet', text: 'Der Versand ist abgeschlossen.' },
              { term: 'Pausiert', text: 'Der Versand wurde unterbrochen, zum Beispiel durch einen Fehler, einen Neustart des Servers oder den Not-Aus. Sie können ihn mit **Fortsetzen** fortführen oder die Kampagne löschen.' },
              { term: 'Abgebrochen', text: 'Gibt es nur noch bei älteren Kampagnen, die früher gestoppt wurden. MixMarket vergibt diesen Status nicht mehr. Eine abgebrochene Kampagne bearbeiten, versenden, planen und löschen Sie wie einen Entwurf.' },
            ],
          },
        ],
      },
      {
        id: 'paused-resume',
        title: 'Pausiert und Fortsetzen',
        blocks: [
          {
            type: 'p',
            text: 'Bricht der Versand mit einem Fehler ab, wird der Server während des Versands beendet oder lösen Sie den Not-Aus aus, setzt MixMarket die Kampagne auf **Pausiert**. Was genau passiert ist, steht unter **Aktivitäten**. Pausierte Kampagnen erscheinen auch unter **Wartet auf Sie** auf der Übersicht.',
          },
          {
            type: 'steps',
            items: [
              'Beheben Sie die Ursache, etwa einen falschen Postfachzugang. Nach einem Not-Aus geben Sie den Versand auf der Übersicht mit **Versand freigeben** wieder frei. Eine pausierte Kampagne läuft danach nicht von selbst weiter.',
              'Klicken Sie in der Zeile auf **Fortsetzen**. Wie beim Versand zeigt MixMarket vorher mögliche Warnhinweise. Bestätigen Sie mit **Fortsetzen**.',
            ],
          },
          {
            type: 'p',
            text: 'Bereits versendete Mails werden dabei nicht erneut verschickt. Mails, die vorher fehlgeschlagen sind, versucht MixMarket noch einmal.',
          },
        ],
      },
      {
        id: 'metrics',
        title: 'Kennzahlen',
        blocks: [
          {
            type: 'p',
            text: 'Jede Kampagne zeigt drei Zahlen: wie viele Mails versendet wurden, wie viele Empfänger die Mail geöffnet haben und wie viele mindestens einen Link angeklickt haben. Öffnungen und Klicks zählen je Empfänger nur einmal.',
          },
          {
            type: 'tip',
            text: 'Öffnungen sind ungenau, weil viele Mailprogramme Bilder blockieren oder automatisch laden. Klicks sind verlässlicher.',
          },
        ],
      },
      {
        id: 'edit-delete',
        title: 'Bearbeiten und löschen',
        blocks: [
          {
            type: 'p',
            text: 'Entwürfe und ältere abgebrochene Kampagnen bearbeiten Sie über das Stiftsymbol in der Zeile. Eine geplante Kampagne bearbeiten Sie, nachdem Sie die Planung aufgehoben haben. Das Papierkorbsymbol löscht eine Kampagne in jedem Status nach einer Rückfrage.',
          },
          {
            type: 'warning',
            text: 'Mit einer Kampagne verschwinden auch ihre Kennzahlen aus der Übersicht. Ist sie Quellkampagne einer aktiven Automatisierung, pausiert MixMarket diese Automatisierung automatisch und vermerkt das unter **Aktivitäten**.',
          },
        ],
      },
      {
        id: 'replies',
        title: 'Antworten und Rückläufer',
        blocks: [
          {
            type: 'p',
            text: 'Ist der Empfang (IMAP) eingerichtet, landen Antworten auf Kampagnen-Mails unter **Gespräche**. MixMarket erkennt sie am Verlauf der Mail, Antworten auf Nachfass-Mails aus Automatisierungen an der Adresse des Kontakts. Im Verlauf des Gesprächs steht die Kampagne mit Namen und Betreff (Gespräche).',
          },
          {
            type: 'list',
            items: [
              'Bei eingeschaltetem Autopilot Antworten ordnet die KI jede Antwort ein. Bei der Einordnung Abmeldung kommt die Adresse auf die Sperrliste, und der Kontakt erhält den Status Abgemeldet.',
              'Kommt eine Kampagnen-Mail dauerhaft als unzustellbar zurück, setzt MixMarket die Adresse mit dem Grund Unzustellbar auf die Sperrliste, ein aktiver Kontakt erhält den Status Unzustellbar, und der Versand an diese Adresse gilt in der Kampagne als unzustellbar. Spätere Kampagnen lassen die Adresse aus.',
              'Zu viele dauerhafte Rückläufer in 24 Stunden lösen den automatischen Not-Aus aus (Übersicht, Not-Aus).',
              'Rückläufer finden Sie unter **Gespräche** in der Ansicht **Unzustellbar**.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'automations',
    title: 'Automatisierungen',
    summary: 'Automatisierungen schicken eine Nachfass-Mail, je nachdem wie Empfänger auf eine Kampagne reagiert haben.',
    sections: [
      {
        id: 'purpose',
        title: 'Wofür Automatisierungen da sind',
        blocks: [
          {
            type: 'tip',
            text: 'Automatisierungen gehören zu MixMarket Pro. Ohne Pro zeigt die Seite **Automatisierungen** nur, was sie können.',
          },
          {
            type: 'p',
            text: 'Eine Automatisierung beobachtet die Kampagnen-Mails, die nach ihrem Anlegen versendet wurden. Trifft der gewählte Auslöser zu, bekommt der Empfänger nach der eingestellten Verzögerung eine Nachfass-Mail mit einer eigenen Vorlage. Jeder Kontakt bekommt je Automatisierung höchstens eine Nachfass-Mail.',
          },
          {
            type: 'p',
            text: 'Die Liste zeigt je Automatisierung Auslöser, Verzögerung, Vorlage, Quellkampagne, die Zahl der bisherigen Läufe und ob sie **Aktiv** oder **Pausiert** ist.',
          },
        ],
      },
      {
        id: 'create',
        title: 'Automatisierung anlegen',
        blocks: [
          {
            type: 'steps',
            items: [
              'Klicken Sie oben rechts auf **Automatisierung anlegen**.',
              'Geben Sie einen **Name** ein.',
              'Wählen Sie den **Auslöser**.',
              'Tragen Sie unter **Verzögerung (Tage)** ein, wie viele Tage nach dem Versand der ursprünglichen Mail die Nachfass-Mail folgen soll.',
              'Wählen Sie die **Quellkampagne** oder lassen Sie **Alle Kampagnen** stehen.',
              'Wählen Sie die **Vorlage** der Nachfass-Mail.',
              'Tragen Sie **Betreff**, **Absendername** und **Absenderadresse** ein.',
              'Klicken Sie **Speichern**. Eine neue Automatisierung ist sofort aktiv.',
            ],
          },
          {
            type: 'p',
            text: 'Pflichtfelder sind mit * markiert: **Name**, **Vorlage**, **Betreff**, **Absendername** und **Absenderadresse**. Fehlt eines oder ist die Absenderadresse ungültig, markiert MixMarket das Feld rot und speichert nicht.',
          },
        ],
      },
      {
        id: 'triggers',
        title: 'Auslöser',
        blocks: [
          {
            type: 'terms',
            items: [
              { term: 'Hat geklickt', text: 'Der Empfänger hat in der Kampagnen-Mail mindestens einen Link angeklickt.' },
              { term: 'Hat geöffnet', text: 'Die Kampagnen-Mail wurde als geöffnet gezählt.' },
              { term: 'Hat nicht geöffnet', text: 'Die Kampagnen-Mail ist nach Ablauf der Verzögerung noch nicht geöffnet.' },
            ],
          },
          {
            type: 'p',
            text: 'MixMarket prüft jede Minute. Bei **Hat geklickt** und **Hat geöffnet** merkt es einen Empfänger vor, sobald der Auslöser zutrifft. Bei **Hat nicht geöffnet** wartet MixMarket die Verzögerung ab und prüft erst dann, ob die Mail noch ungeöffnet ist. Nur dann geht die Nachfass-Mail raus.',
          },
          {
            type: 'tip',
            text: 'Öffnungen werden nicht immer erkannt, weil viele Mailprogramme Bilder blockieren. Bei **Hat nicht geöffnet** kann deshalb auch jemand eine Nachfass-Mail bekommen, der die Mail gelesen hat.',
          },
        ],
      },
      {
        id: 'delay',
        title: 'Verzögerung',
        blocks: [
          {
            type: 'p',
            text: 'Die Verzögerung zählt ab dem Versand der ursprünglichen Kampagnen-Mail, nicht ab dem Klick oder der Öffnung. Erlaubt sind 0 bis 60 Tage. Ist der Zeitpunkt bereits erreicht, geht die Nachfass-Mail bei der nächsten Prüfung raus. Bei **Hat nicht geöffnet** ist die Verzögerung zugleich die Wartezeit, nach der MixMarket prüft, ob die Mail noch ungeöffnet ist.',
          },
        ],
      },
      {
        id: 'source-campaign',
        title: 'Quellkampagne',
        blocks: [
          {
            type: 'p',
            text: 'Mit einer **Quellkampagne** gilt die Automatisierung nur für Mails dieser einen Kampagne. Ohne Quellkampagne gilt sie für alle Kampagnen.',
          },
          {
            type: 'p',
            text: 'In beiden Fällen lösen nur Kampagnen-Mails, die nach dem Anlegen der Automatisierung versendet wurden, Nachfass-Mails aus. Ältere Versände bleiben unberücksichtigt.',
          },
          {
            type: 'warning',
            text: 'Löschen Sie die Quellkampagne, pausiert MixMarket die Automatisierung automatisch und vermerkt das unter **Aktivitäten**. Sie hat danach keine Quellkampagne mehr. Aktivieren Sie sie wieder, gilt sie für alle Kampagnen. Wählen Sie deshalb vorher unter **Bearbeiten** eine neue Quellkampagne.',
          },
          {
            type: 'p',
            text: 'Für {{ansatz}} sucht MixMarket den Ansatzpunkt in den Listen der Quellkampagne, ohne Quellkampagne in allen Listen des Kontakts.',
          },
        ],
      },
      {
        id: 'pause-edit',
        title: 'Pausieren, bearbeiten, löschen',
        blocks: [
          {
            type: 'list',
            items: [
              'Das Ein-Aus-Symbol in der Zeile schaltet eine Automatisierung zwischen **Aktiv** und **Pausiert** um. Für Screenreader heißt es **Pausieren**, solange sie aktiv ist, und **Aktivieren**, solange sie pausiert ist.',
              '**Bearbeiten** öffnet die Einstellungen der Automatisierung.',
              'Das Papierkorbsymbol löscht die Automatisierung nach einer Rückfrage.',
            ],
          },
          {
            type: 'p',
            text: 'Eine pausierte Automatisierung verschickt nichts und merkt keine neuen Empfänger vor. Bereits vorgemerkte Nachfass-Mails warten, bis Sie sie wieder aktivieren. Ist ihr Zeitpunkt dann schon erreicht, gehen sie bei der nächsten Prüfung raus.',
          },
          {
            type: 'warning',
            text: 'Auch Kampagnen-Mails, die während der Pause versendet wurden, berücksichtigt die Automatisierung nach dem Aktivieren. Sollen gar keine Nachfass-Mails mehr verschickt werden, löschen Sie die Automatisierung.',
          },
        ],
      },
      {
        id: 'how-it-runs',
        title: 'Was beim Nachfassen geprüft wird',
        blocks: [
          {
            type: 'list',
            items: [
              'Ist der Kontakt nicht mehr aktiv oder steht er auf der Sperrliste, wird die Nachfass-Mail übersprungen.',
              'Nachfass-Mails bekommen wie Kampagnen Ihre Signatur, den Footer mit Postanschrift und Abmelde-Link und eine automatische Textfassung. Anrede, Abmelde-Hinweis und Text des Abmeldelinks richten sich nach der **Sprache der Mail** der Vorlage, die in der Automatisierung gewählt ist. Eine Abmeldung über den Link oder den Abmeldeknopf des Mailprogramms wirkt genauso.',
              'Wie viele Nachfass-Mails versendet wurden oder fehlschlugen, steht unter **Aktivitäten**.',
              'Während eines Not-Aus verschickt keine Automatisierung eine Nachfass-Mail. Neue Empfänger merkt sie weiter vor, fällige Nachfass-Mails gehen nach der Freigabe des Versands hinaus (Übersicht, Not-Aus).',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'research',
    title: 'Recherche',
    summary: 'In der Recherche finden Sie Firmen, durchleuchten ihre Webseiten, bilden Zielgruppen, lassen sie von der KI bewerten und pflegen Ihre Interessenten.',
    sections: [
      {
        id: 'overview',
        title: 'Aufbau der Recherche',
        blocks: [
          {
            type: 'p',
            text: 'Die Recherche hat vier Reiter. Auf dem Handy wählen Sie sie über ein Auswahlfeld. MixMarket merkt sich, welchen Reiter Sie zuletzt geöffnet hatten.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Firmen finden', text: 'Firmen einer Branche in einer Region suchen und ihre Webseiten durchleuchten.' },
              { term: 'Zielgruppen', text: 'Aus allen gefundenen Firmen über Merkmale eine Auswahl bilden und mit KI bewerten.' },
              { term: 'Interessenten', text: 'Ihre Arbeitsliste je Produkt: Firmen, die Sie ansprechen wollen, mit Status und Notiz. Von hier schreiben Sie sie auch über den Postausgang an.' },
              { term: 'Webseiten auslesen', text: 'Einzelne Webseiten gezielt nach E-Mail-Adressen oder eigenen Feldern auslesen.' },
            ],
          },
          {
            type: 'p',
            text: 'In den ersten drei Reitern steht oben **Kunden suchen für** mit der Auswahl des Produkts. Zielgruppen, KI-Bewertungen und Interessenten gelten immer für das hier gewählte Produkt.',
          },
        ],
      },
      {
        id: 'products',
        title: 'Produkte verwalten',
        blocks: [
          {
            type: 'p',
            text: 'Ein Produkt ist das, was Sie verkaufen wollen. Für jedes Produkt bilden Sie eigene Zielgruppen, und die KI bewertet die Firmen je Produkt getrennt.',
          },
          {
            type: 'steps',
            items: [
              'Klicken Sie in der Recherche oben auf **Produkte verwalten**, beim allerersten Mal auf **Erstes Produkt anlegen**.',
              'Klicken Sie **Neues Produkt**.',
              'Tragen Sie **Name** und auf Wunsch **Webseite (optional)** ein.',
              'Beschreiben Sie unter **Was Sie verkaufen** das Produkt: wichtigste Funktionen, Preise und für wen es gedacht ist. Nur Tatsachen, die KI übernimmt sie in die Ansatzpunkte.',
              'Beschreiben Sie unter **Ihr idealer Kunde**, welche Betriebe besonders gut passen und welche nicht. Danach vergibt die KI die Passung.',
              'Tragen Sie bei Bedarf die **Mindestgröße der Kundenfirma (optional)** ein.',
              'Klicken Sie **Speichern**.',
            ],
          },
          {
            type: 'tip',
            text: 'Beide Beschreibungen brauchen mindestens einen ganzen Satz. Je genauer Sie den idealen Kunden beschreiben, desto treffender werden Passung und Ansatzpunkte.',
          },
          {
            type: 'p',
            text: 'In der Liste der Produkte sehen Sie je Produkt die Zahl der Zielgruppen und der bewerteten Firmen. Dort bearbeiten oder löschen Sie Produkte.',
          },
          {
            type: 'warning',
            text: 'Wenn Sie ein Produkt löschen, werden seine KI-Bewertungen und seine Interessenten mit gelöscht, ebenso seine Mails im Postausgang. Die Rückfrage nennt, wie viele es jeweils sind. Zielgruppen und die Interessentenliste mit ihren Kontakten bleiben ohne Produkt erhalten.',
          },
        ],
      },
      {
        id: 'min-size',
        title: 'Mindestgröße',
        blocks: [
          {
            type: 'p',
            text: 'Die **Mindestgröße der Kundenfirma (optional)** ist die Zahl der Mitarbeiter, ab der Ihr Produkt sinnvoll ist. Firmen, die erkennbar kleiner sind, bewertet die KI mit höchstens 3. Ist die Größe unklar, bewertet sie vorsichtig. Lassen Sie das Feld leer, wenn die Größe keine Rolle spielt.',
          },
          {
            type: 'p',
            text: 'Die Größe einer Firma ermittelt MixMarket aus einer auf der Webseite genannten Mitarbeiterzahl, sonst aus der Schätzung der KI, sonst aus Hinweisen wie Abteilungen, Standorten oder offenen Stellen.',
          },
          {
            type: 'warning',
            text: 'Ändern Sie Beschreibung, idealen Kunden oder Mindestgröße, gelten die bisherigen Bewertungen dieses Produkts als veraltet. Bewerten Sie die Firmen dann neu.',
          },
        ],
      },
      {
        id: 'find-companies',
        title: 'Firmen finden',
        blocks: [
          {
            type: 'steps',
            items: [
              'Öffnen Sie den Reiter **Firmen finden** und klicken Sie oben rechts auf **Neue Suche**.',
              'Wählen Sie unter **Quelle** die Suchquelle. Rechts steht, ob sie **kostenlos**, **Eingerichtet** oder ohne Zugang ist (**Zugang fehlt**).',
              'Wählen Sie unter **Branche** einen Eintrag aus der Liste. Darunter sehen Sie unter **Gesucht wird nach** den Suchbegriff, den MixMarket verwendet. Für einen eigenen Begriff wählen Sie **Eigener Suchbegriff** und tippen ihn unter **Suchbegriff** ein.',
              'Tragen Sie unter **Ort** einen Ort oder eine Postleitzahl ein.',
              'Je nach Quelle wählen Sie **Umkreis** und **Höchstzahl** oder die **Suchtiefe**. Die **Höchstzahl** legt fest, wie viele Firmen die Suche höchstens liefert, zum Beispiel **100 Firmen**. Mit der Entfernung hat sie nichts zu tun, die stellen Sie unter **Umkreis** ein.',
              'Prüfen Sie unten die Angabe **Geschätzte Kosten** und klicken Sie **Suche starten**. Kostet die Suche etwas, bestätigen Sie den Betrag noch einmal.',
            ],
          },
          {
            type: 'list',
            items: [
              'Es läuft immer nur eine Suche gleichzeitig. Starten Sie die nächste, wenn die laufende fertig ist.',
              'Fehlt für die gewählte Quelle der Zugang, führt der Link **Zugang in den Einstellungen eintragen** direkt zu den Recherche-Zugängen.',
              'Liegen die geschätzten Kosten über Ihrer Kostenobergrenze je Suche, startet die Suche nicht. Die Grenze ändern Sie in den Einstellungen.',
            ],
          },
        ],
      },
      {
        id: 'sources-costs',
        title: 'Quellen und Kosten',
        blocks: [
          {
            type: 'tip',
            text: 'DataForSEO und Serper gehören zu MixMarket Pro. Ohne Pro sucht MixMarket über OpenStreetMap, kostenlos.',
          },
          {
            type: 'terms',
            items: [
              {
                term: 'OpenStreetMap',
                text: 'Freie Kartendaten, kostenlos und ohne Konto. Gut für Praxen, Läden und Gastronomie, lückenhaft bei Handwerkern ohne Geschäftsräume. Sucht nur nach Branchen aus der Liste, nicht nach eigenen Suchbegriffen. Einstellbar sind Umkreis und Höchstzahl.',
              },
              {
                term: 'DataForSEO Branchenverzeichnis',
                text: 'Google-Unternehmensprofile im Umkreis mit Telefon, Webseite und Bewertung. Rund 0,37 USD je 1.000 Firmen. Einstellbar sind Umkreis und Höchstzahl.',
              },
              {
                term: 'DataForSEO Google-Suche',
                text: 'Wer bei Google für Branche und Ort vorne steht, mit Platzierung. 0,002 USD je 10 Treffer. Einstellbar ist die Suchtiefe.',
              },
              {
                term: 'Serper Google-Suche',
                text: 'Google-Suche mit Platzierung. 2.500 Abfragen kostenlos, danach bis etwa 1 USD je 1.000 Abfragen. Einstellbar ist die Suchtiefe.',
              },
            ],
          },
          {
            type: 'p',
            text: 'Die Branchen-Quellen suchen im Umkreis um den Ort. Die Suchmaschinen-Quellen suchen nach Suchbegriff und Ort und merken sich die Platzierung. Plätze 11 bis 30 sind oft Firmen, die sichtbar sein wollen, es aber noch nicht schaffen.',
          },
          {
            type: 'tip',
            text: 'Die Kostenschätzung erscheint, sobald Branche oder Suchbegriff gewählt sind. Nach der Suche zeigt die Zeile der Suche die tatsächlichen Kosten.',
          },
        ],
      },
      {
        id: 'search-results',
        title: 'Ergebnis einer Suche',
        blocks: [
          {
            type: 'p',
            text: 'Jede Suche erscheint als Zeile mit Branche oder Suchbegriff, Ort, Quelle, Kosten, Datum und Status. Ist sie fertig, steht dort zum Beispiel „12 neu, 3 bekannt, 4 aussortiert“:',
          },
          {
            type: 'list',
            items: [
              'neu: Firmen, die MixMarket zum ersten Mal gefunden hat.',
              'bekannt: Firmen, die schon aus einer früheren Suche bekannt sind. Sie werden nicht doppelt angelegt, fehlende Angaben werden ergänzt.',
              'aussortiert: Verzeichnisse und Portale wie Gelbe Seiten, die keine echten Betriebe sind.',
            ],
          },
          {
            type: 'p',
            text: 'Solange eine Suche läuft, steht unter ihr „Suche läuft. Bei OpenStreetMap kann das unter Last bis zu einer Minute dauern.“ Ist OpenStreetMap stark ausgelastet, wartet MixMarket länger auf die Antwort und versucht es erneut, bevor es einen Fehler meldet.',
          },
          {
            type: 'p',
            text: 'Schlägt eine Suche fehl, steht die Fehlermeldung unter der Suche und daneben der Knopf **Erneut suchen**. Er wiederholt die Suche mit denselben Angaben. Auch dabei läuft nur eine Suche gleichzeitig, der Zugang zur Quelle muss eingetragen sein, und die geschätzten Kosten dürfen die Kostenobergrenze je Suche nicht übersteigen.',
          },
          {
            type: 'p',
            text: 'Der Knopf mit der Zahl der Firmen öffnet die Liste der gefundenen Firmen. Die Tabelle zeigt **Firma** mit Adresse, **Ansprechpartner**, **Kontakt**, **Webseite** und **Merkmale**, je nach Quelle auch **Platz** und **Bewertung**, nach einer KI-Bewertung die **Passung**. Ein Klick auf den Firmennamen öffnet die Detailansicht.',
          },
          {
            type: 'warning',
            text: 'Wenn Sie eine Suche löschen, werden Firmen, die nur diese Suche gefunden hat, mit gelöscht, samt ihren Bewertungen, Interessenten-Einträgen und Mails im Postausgang.',
          },
        ],
      },
      {
        id: 'profiling',
        title: 'Durchleuchten',
        blocks: [
          {
            type: 'p',
            text: 'Durchleuchten heißt: MixMarket lädt die öffentlichen Seiten einer Firmenwebseite, also Startseite, Impressum, Kontakt, Karriere, Team, robots.txt und Sitemap, und gewinnt daraus Ansprechpartner, E-Mail-Adressen und Merkmale. Das kostet nichts und nutzt keine KI.',
          },
          {
            type: 'steps',
            items: [
              'Klicken Sie in der Zeile einer fertigen Suche auf **Firmen durchleuchten**.',
              'Der Fortschritt erscheint unter der Suche. Sie können währenddessen weiterarbeiten.',
              'Danach steht dort, wie viele Webseiten durchleuchtet wurden. Mit **Erneut durchleuchten** wiederholen Sie den Vorgang.',
            ],
          },
          {
            type: 'list',
            items: [
              'Durchleuchtet werden nur Firmen mit bekannter Webseite.',
              'MixMarket beachtet die robots.txt einer Webseite und ruft gesperrte Seiten nicht ab. Je Firma sind es höchstens 14 Abrufe, nacheinander und mit kurzer Pause.',
              'Adressen im eigenen Netz, etwa localhost oder private IP-Adressen, ruft MixMarket nie ab. Geprüft wird die Adresse, mit der MixMarket tatsächlich verbunden wird, auch nach jeder Weiterleitung.',
              'Es wird immer nur eine Suche gleichzeitig durchleuchtet.',
              'Eine einzelne Firma durchleuchten Sie in ihrer Detailansicht mit **Durchleuchten** beziehungsweise **Erneut durchleuchten**.',
              'Mit eingeschaltetem Autopilot Recherche durchleuchtet MixMarket fertige Suchen, die noch nie durchleuchtet wurden, selbst, eine nach der anderen (Übersicht, Autopilot).',
            ],
          },
          {
            type: 'tip',
            text: 'Werbung von Google oder Meta wird nur erkannt, wenn sie schon beim ersten Laden der Seite eingebunden ist. Lädt sie erst nach der Cookie-Zustimmung, erscheint „Nein“.',
          },
        ],
      },
      {
        id: 'company-detail',
        title: 'Detailansicht einer Firma',
        blocks: [
          {
            type: 'p',
            text: 'Ein Klick auf einen Firmennamen, in allen Firmenlisten der Recherche, öffnet die Detailansicht. Oben steht, wann die Firma durchleuchtet wurde, daneben die Knöpfe **Als Interessent übernehmen** und **Durchleuchten** oder **Erneut durchleuchten**. Ist die Firma schon Interessent des gewählten Produkts, steht dort ihr Status.',
          },
          {
            type: 'list',
            items: [
              'KI-Bewertung für das gewählte Produkt: Passung von 1 bis 10, Begründung und der **Ansatzpunkt für die Erstansprache** mit dem Knopf **Kopieren**. Ist die Bewertung veraltet, steht ein Hinweis daneben.',
              '**Bewertungen für andere Produkte**: Passung und Begründung für Ihre übrigen Produkte.',
              '**Ansprechpartner**: Namen aus Impressum und Teamseite mit Rolle. **Entscheider** markiert Geschäftsführung, Inhaber und ähnliche Rollen.',
              '**Kontakt und Unternehmen**: Adresse, Telefon, E-Mail persönlich oder allgemein, Impressum, Rechtsform, Handelsregister, USt-IdNr. und Hinweise auf die Größe.',
              '**Webseite**: System, Erstellt von, Werbung, Online-Buchung, Kontaktformular, Handytauglichkeit, HTTPS, strukturierte Daten, Jahr im Copyright, letzte Änderung, Seitenzahl, soziale Netzwerke und weitere Technik.',
              '**Offene Stellen**: erkannte Stellenanzeigen oder der Hinweis auf eine Karriereseite.',
            ],
          },
          {
            type: 'tip',
            text: 'Das kleine Pfeilsymbol hinter einer Angabe öffnet die Fundstelle, also die Seite, auf der MixMarket die Angabe gefunden hat.',
          },
        ],
      },
      {
        id: 'target-groups',
        title: 'Zielgruppen bilden',
        blocks: [
          {
            type: 'p',
            text: 'Im Reiter **Zielgruppen** stellen Sie aus den gefundenen Firmen eine Auswahl zusammen. Die Zahl passender Firmen zählt bei jeder Änderung sofort mit.',
          },
          {
            type: 'steps',
            items: [
              'Wählen Sie unter **Umfang** entweder **Alle Firmen** oder **Bestimmte Suchen** und setzen Sie dann die Haken bei den gewünschten Suchen.',
              'Stellen Sie bei jedem Merkmal ein, ob es **egal** ist, zutreffen **muss** oder **nicht** zutreffen darf.',
              'Rechts sehen Sie die Zahl passender Firmen „von“ der Gesamtzahl. Darunter zeigt die Liste **Passende Firmen** die Treffer, bewertete Firmen mit der höchsten Passung zuerst.',
              'Um die Auswahl zu behalten, geben Sie unter **Name der Zielgruppe** einen Namen ein und klicken **Speichern**. Direkt über dem Feld steht die Zusammenfassung der gewählten Merkmale, so prüfen Sie vor dem Speichern, was die Zielgruppe enthält.',
            ],
          },
          {
            type: 'list',
            items: [
              'Gespeicherte Zielgruppen stehen rechts unter **Gespeicherte Zielgruppen** mit der aktuellen Zahl passender Firmen. Ein Klick lädt sie.',
              'Eine geladene Zielgruppe ändern Sie und sichern mit **Änderungen speichern**, oder löschen sie mit **Löschen**. Die Firmen bleiben dabei erhalten.',
              '**Neue Zielgruppe** oben rechts setzt alle Merkmale zurück.',
              'Eine Zielgruppe gehört zu dem Produkt, das beim Speichern gewählt war. Zielgruppen ohne Produkt sind mit **ohne Produkt** gekennzeichnet.',
            ],
          },
          {
            type: 'tip',
            text: 'Die Tabelle zeigt höchstens die ersten 200 passenden Firmen. Gezählt, bewertet und übernommen werden trotzdem alle.',
          },
        ],
      },
      {
        id: 'signals',
        title: 'Merkmale',
        blocks: [
          {
            type: 'p',
            text: 'Merkmale sind Eigenschaften einer Firma, die MixMarket aus der Suche, beim Durchleuchten oder durch die KI-Bewertung kennt. Sie sind in Gruppen geordnet: **Kontakt**, **Webseite**, **Unternehmen**, **Suche und Google-Profil** und **KI-Bewertung**.',
          },
          {
            type: 'p',
            text: 'Bei den meisten Merkmalen steht darunter, wie viele Firmen im gewählten Umfang ja, nein oder unbekannt haben. Das hilft beim Zusammenstellen.',
          },
          {
            type: 'list',
            items: [
              'Ist ein Merkmal unbekannt, etwa weil die Firma noch nicht durchleuchtet wurde, zählt sie weder bei **muss** noch bei **nicht**. Durchleuchten Sie die Firmen deshalb vor dem Filtern.',
              'Bei **Webseiten-System** und **Rechtsform** wählen Sie zusätzlich einen Wert aus. Bei **beliebig** genügt, dass überhaupt ein Wert bekannt ist.',
              'Bei **KI-Passung** wählen Sie eine Untergrenze von mindestens 5 bis 9. Ohne Wahl gilt **ab 7 (Standard)**.',
              'Bei **Geschätzte Größe** wählen Sie eine Mindestzahl von Mitarbeitern zwischen 5 und 250. Ohne Wahl gilt **ab 20 Mitarbeitern (Standard)**.',
            ],
          },
          {
            type: 'p',
            text: 'Findet keine Firma zu allen Merkmalen, stellen Sie einzelne Merkmale wieder auf **egal**.',
          },
        ],
      },
      {
        id: 'ai-rating',
        title: 'KI-Bewertung',
        blocks: [
          {
            type: 'p',
            text: 'Die KI bewertet Firmen danach, wie gut sie zum gewählten Produkt passen. Sie arbeitet mit den Angaben aus dem Durchleuchten und mit Ihrer Produktbeschreibung. Voraussetzung ist ein in den Einstellungen gewähltes und gespeichertes KI-Abo.',
          },
          {
            type: 'steps',
            items: [
              'Wählen Sie oben das Produkt und stellen Sie im Reiter **Zielgruppen** die Auswahl ein, die bewertet werden soll.',
              'Klicken Sie rechts im Kasten **KI-Bewertung für** Ihr Produkt auf **Mit KI bewerten**.',
              'Der Fortschritt erscheint im Kasten. Mit **Abbrechen** beenden Sie den Lauf nach der laufenden Anfrage.',
              'Ist der Lauf fertig, erscheint die Passung in den Firmenlisten und in der Detailansicht.',
            ],
          },
          {
            type: 'list',
            items: [
              'Bewertet werden nur durchleuchtete Firmen der Auswahl, fünf je Anfrage an die KI. Wie viele noch nicht durchleuchtet sind, meldet MixMarket beim Start.',
              'Bereits aktuell bewertete Firmen werden übersprungen. Mit dem Haken **Bereits bewertete neu bewerten** bewertet die KI auch diese noch einmal.',
              'Es läuft immer nur eine KI-Bewertung gleichzeitig. Das Ergebnis des letzten Laufs steht im Kasten.',
              'Die KI bekommt keine Werkzeuge und kann nichts auf Ihrem Rechner ausführen.',
              'Mit eingeschaltetem Autopilot Recherche bewertet MixMarket gespeicherte Zielgruppen mit Produkt selbst, und zwar die Firmen ohne aktuelle Bewertung. Läuft gerade eine Bewertung, startet er keine weitere (Übersicht, Autopilot).',
              'Während einer KI-Pause wartet eine Bewertung vor dem nächsten Stapel, bis das Abo wieder unter der Grenze liegt, und läuft dann weiter. Mit **Abbrechen** beenden Sie sie auch in dieser Zeit (Übersicht, KI-Pause).',
            ],
          },
          {
            type: 'tip',
            text: 'Der Link **KI-Einstellungen** im Kasten führt zu den Einstellungen der KI-Bewertung.',
          },
        ],
      },
      {
        id: 'fit-and-hook',
        title: 'Passung und Ansatzpunkt',
        blocks: [
          {
            type: 'terms',
            items: [
              {
                term: 'Passung',
                text: 'Ganze Zahl von 1 (passt gar nicht) bis 10 (passt ideal), dazu eine kurze Begründung. Werte ab 7 und Werte bis 3 sind farblich hervorgehoben. Firmen, die offensichtlich nicht zur Zielgruppe gehören, erhalten 1 bis 3.',
              },
              {
                term: 'Ansatzpunkt',
                text: 'Ein bis zwei Sätze für eine erste persönliche Ansprache. Die KI greift ein konkretes Detail der Firma auf und verbindet es sachlich mit Ihrem Produkt, in der Sie-Form, ohne Anrede und Grußformel. Bei einer Passung von 1 bis 3 gibt es keinen Ansatzpunkt.',
              },
            ],
          },
          {
            type: 'p',
            text: 'Zusätzlich schätzt die KI die Mitarbeiterzahl der Firma. Diese Schätzung fließt in das Merkmal **Geschätzte Größe** ein.',
          },
          {
            type: 'warning',
            text: 'Die KI darf nur Fakten aus den gesammelten Angaben verwenden, kann sich aber irren. Lesen Sie Ansatzpunkte vor dem Versand stichprobenartig.',
          },
        ],
      },
      {
        id: 'prospects',
        title: 'Interessenten',
        blocks: [
          {
            type: 'p',
            text: 'Interessenten sind Firmen, die Sie für das gewählte Produkt ansprechen wollen. Der Reiter **Interessenten** ist Ihre Arbeitsliste, höchste Passung zuerst.',
          },
          {
            type: 'p',
            text: 'So nehmen Sie Firmen auf:',
          },
          {
            type: 'list',
            items: [
              'Aus einer Zielgruppe: Wählen Sie im Kasten **Interessenten für** Ihr Produkt **Alle Firmen** oder eine Untergrenze wie **Passung ab 7** und klicken Sie **Übernehmen**. Schon vorhandene Interessenten werden übersprungen, Firmen unter der Untergrenze oder ohne Bewertung auch.',
              'Einzeln: Klicken Sie in der Detailansicht einer Firma auf **Als Interessent übernehmen**.',
              'Automatisch: Mit eingeschaltetem Autopilot Schreiben übernimmt MixMarket Firmen gespeicherter Zielgruppen ab der Mindestpassung selbst und gibt sie in den Postausgang (Übersicht, Autopilot).',
            ],
          },
          {
            type: 'p',
            text: 'Jede Zeile zeigt Passung und Firmenname, Branche und Ort, den Ansatzpunkt der KI, Ansprechpartner, Telefon, E-Mail und Webseite sowie Ihre Notiz. **In Kontakten** zeigt, dass der Interessent schon als Kontakt übernommen ist, **persönlich** markiert eine persönliche E-Mail-Adresse.',
          },
          {
            type: 'p',
            text: 'Ist der Interessent im Postausgang, zeigt die Zeile einen Verweis mit dem Stand seiner jüngsten Mail, zum Beispiel „Postausgang: Zur Freigabe“ oder nach dem Versand „Postausgang: Mail 1 gesendet“. Ein Klick darauf öffnet den **Postausgang**.',
          },
          {
            type: 'p',
            text: 'Der Status hält fest, wie weit Sie sind:',
          },
          {
            type: 'terms',
            items: [
              { term: 'Neu', text: 'Übernommen, noch nicht angesprochen.' },
              { term: 'Kontaktiert', text: 'Sie haben die Firma angeschrieben oder angerufen. Nach dem Versand der Erstmail aus dem Postausgang setzt MixMarket diesen Status selbst.' },
              { term: 'Im Gespräch', text: 'Es gibt einen Austausch. Geht unter **Gespräche** eine Antwort ein, setzt MixMarket einen Interessenten mit dem Status Neu oder Kontaktiert selbst auf diesen Status. Ein laufender Ablauf im Postausgang endet.' },
              { term: 'Kein Interesse', text: 'Die Firma möchte nicht. Meldet sich ein Kontakt über den Link in einer Mail ab, setzt MixMarket seine Interessenten automatisch auf diesen Status, ebenso den Interessenten einer Antwort mit der Einordnung Kein Interesse oder Abmeldung (Gespräche). Interessenten mit diesem Status übernimmt **In Kontakte übernehmen** nicht. Ein laufender Ablauf im Postausgang endet.' },
              { term: 'Kunde', text: 'Die Firma ist Kunde geworden. Ein laufender Ablauf im Postausgang endet.' },
            ],
          },
          {
            type: 'list',
            items: [
              'Den Status ändern Sie direkt im Auswahlfeld rechts in der Zeile. MixMarket ändert ihn nicht von selbst, wenn Sie eine Kampagne versenden. Eingehende Antworten ändern ihn dagegen, wie oben beschrieben.',
              'Die Leiste über der Liste filtert nach Status und zeigt die Anzahl je Status.',
              '**Bearbeiten** öffnet das Fenster **Interessent bearbeiten** mit **Ansprechpartner**, **Status** und **Notiz**. Unter **Ansprechpartner** wählen Sie, wen Sie ansprechen; **Automatisch: erster Entscheider** nimmt den ersten erkannten Entscheider.',
              'Das Papierkorbsymbol entfernt den Interessenten. Firma und Kontakt bleiben erhalten, seine Mails im Postausgang werden mit entfernt.',
            ],
          },
          {
            type: 'p',
            text: 'Persönlich anschreiben: **Anschreiben** in einer Zeile übergibt den Interessenten an den Postausgang, **Neue anschreiben** oben rechts alle Interessenten des Produkts, die angeschrieben werden können. Das sind Interessenten mit dem Status Neu und bekannter E-Mail-Adresse, die noch nicht im Postausgang sind. Nur bei ihnen erscheint der Knopf **Anschreiben**. Die KI schreibt dann für jede Firma eine Erstmail, die Sie im Postausgang prüfen und freigeben (Postausgang, Interessenten anschreiben).',
          },
        ],
      },
      {
        id: 'prospects-to-contacts',
        title: 'Interessenten in Kontakte übernehmen',
        blocks: [
          {
            type: 'p',
            text: 'Damit Sie Interessenten per Kampagne anschreiben können, übernehmen Sie sie in die Kontakte. Für den Postausgang ist dieser Schritt nicht nötig: **Anschreiben** legt fehlende Kontakte auf dieselbe Weise selbst an.',
          },
          {
            type: 'steps',
            items: [
              'Öffnen Sie den Reiter **Interessenten** und prüfen Sie, ob oben das richtige Produkt gewählt ist.',
              'Klicken Sie oben rechts auf **In Kontakte übernehmen**.',
              'Lesen Sie die Hinweise im Fenster und bestätigen Sie.',
            ],
          },
          {
            type: 'list',
            items: [
              'Übernommen werden alle Interessenten des Produkts mit E-Mail-Adresse, außer denen mit dem Status **Kein Interesse**. Wie viele deshalb nicht übernommen wurden, nennt eine eigene Meldung.',
              'Als Adresse nimmt MixMarket die persönliche Adresse des gewählten Ansprechpartners, wenn sie erkennbar zu ihm gehört, sonst die allgemeine Adresse der Firma.',
              'Anrede, Titel und Name kommen vom Ansprechpartner, Branche, Firma und Webseite von der Firma.',
              'Neue Kontakte erhalten die Herkunft „Recherche“ und keine Einwilligung. Vor dem Versand einer Kampagne erscheint dazu ein Hinweis.',
              'Vorhandene Kontakte werden nur verknüpft, nicht doppelt angelegt. Adressen auf der Sperrliste werden übersprungen.',
              'Alle übernommenen Kontakte kommen in die Interessentenliste des Produkts. Interessenten ohne E-Mail bleiben in der Liste, zum Beispiel für einen Anruf.',
            ],
          },
        ],
      },
      {
        id: 'read-web-pages',
        title: 'Webseiten auslesen',
        blocks: [
          {
            type: 'p',
            text: 'Im Reiter **Webseiten auslesen** lesen Sie einzelne Webseiten gezielt aus, unabhängig von der Firmensuche. Ein Auftrag arbeitet eine Liste von Adressen ab.',
          },
          {
            type: 'steps',
            items: [
              'Klicken Sie oben rechts auf **Neuer Auftrag**.',
              'Geben Sie einen **Name** ein und wählen Sie die Art: **Strukturierte Daten** oder **Kontaktdaten**.',
              'Tragen Sie unter **URLs (eine pro Zeile)** die Adressen ein, jeweils mit http:// oder https://, höchstens 50 je Auftrag.',
              'Optional: Unter **Muss Begriff enthalten** verarbeitet MixMarket nur Seiten, auf denen dieser Begriff vorkommt.',
              'Bei **Strukturierte Daten** setzen Sie **E-Mail-Adressen extrahieren**, wenn zusätzlich E-Mail-Adressen gesammelt werden sollen. Bei **Kontaktdaten** sucht MixMarket immer nach E-Mail-Adressen.',
              'Setzen Sie **Browser verwenden (für dynamische Seiten)** für Seiten, deren Inhalt erst im Browser entsteht.',
              'Bei **Strukturierte Daten** tragen Sie unter **Felder (optional)** je Zeile einen Feldnamen und einen CSS-Selektor ein, also die technische Angabe, wo auf der Seite der Wert steht.',
              'Klicken Sie **Starten**.',
            ],
          },
          {
            type: 'list',
            items: [
              'Der Auftrag läuft im Hintergrund. Die Liste zeigt Art, Zahl der Ergebnisse, Datum und den Status **Läuft**, **Fertig** oder **Fehler**.',
              '**Ergebnisse** zeigt die gefundenen Werte samt Quelle.',
              '**Als Kontakte übernehmen** legt aus Ergebnissen mit E-Mail-Adresse neue Kontakte an. Vorhandene Adressen werden übersprungen. Die neuen Kontakte stehen in keiner Liste und haben keine Einwilligung.',
            ],
          },
          {
            type: 'list',
            items: [
              'Adressen ohne http:// oder https:// oder mehr als 50 Adressen nimmt MixMarket nicht an. Der Auftrag startet dann nicht, und MixMarket nennt den Grund.',
              'Adressen im eigenen Netz, etwa localhost oder private IP-Adressen wie 192.168.x.x, ruft MixMarket nie ab, ebenso Adressen mit einem anderen Port als 80 oder 443 oder mit Zugangsdaten. Solche Adressen liefern keine Ergebnisse, die übrigen Adressen des Auftrags werden trotzdem verarbeitet.',
              'Von jeder Seite liest MixMarket höchstens 1,5 MB, den Rest lässt es weg.',
              'Den Browser nutzt MixMarket nur, wenn Sie **Browser verwenden (für dynamische Seiten)** gesetzt haben. Auch im Browser blockiert MixMarket jede Anfrage an Adressen im eigenen Netz.',
            ],
          },
          {
            type: 'tip',
            text: 'Bei der Art **Kontaktdaten** sammelt MixMarket E-Mail-Adressen auch dann, wenn der Haken **E-Mail-Adressen extrahieren** nicht gesetzt ist.',
          },
        ],
      },
    ],
  },
  {
    id: 'outbox',
    title: 'Postausgang',
    summary: 'Im Postausgang schreibt die KI persönliche Mails an einzelne Interessenten. Sie prüfen und geben frei, MixMarket verschickt die Mails nach Ihren Versandregeln und fasst auf Wunsch nach.',
    sections: [
      {
        id: 'purpose',
        title: 'Wofür der Postausgang da ist',
        blocks: [
          {
            type: 'p',
            text: 'Der **Postausgang** verschickt persönliche Mails an einzelne Interessenten aus der Recherche. Statt einer Vorlage für alle schreibt die KI für jede Firma eine eigene Erstmail. Sie prüfen jede Mail und geben sie frei, MixMarket verschickt sie nach Ihren Versandregeln. Auf Wunsch folgen bis zu drei Nachfass-Mails im selben Verlauf.',
          },
          {
            type: 'p',
            text: 'Sie öffnen den **Postausgang** in der Kopfleiste, auf schmalen Bildschirmen über die Seitenleiste.',
          },
          {
            type: 'tip',
            text: 'Der Postausgang ist ein zweiter Weg neben den Kampagnen. Eine Kampagne schickt dieselbe Vorlage an ganze Listen, der Postausgang schreibt jede Firma einzeln an. Vorlage, Liste und Kampagne brauchen Sie dafür nicht.',
          },
          {
            type: 'p',
            text: 'Voraussetzung ist ein KI-Anbieter, den Sie in den **Einstellungen** im Abschnitt **KI-Bewertung** gewählt und gespeichert haben. Für den echten Versand brauchen Sie außerdem ein eingerichtetes Postfach (Abschnitt Testmodus und Hinweise).',
          },
          {
            type: 'p',
            text: 'Alles, was im Postausgang geschieht, steht unter **Aktivitäten** im Bereich **Postausgang**. Entwürfe der KI erscheinen dort mit dem Handelnden „KI-Postausgang“.',
          },
          {
            type: 'p',
            text: 'Antworten der Empfänger und Rückläufer finden Sie unter **Gespräche**. Eine Antwort beendet den Ablauf des Interessenten von selbst (Abschnitt Wann ein Ablauf endet).',
          },
          {
            type: 'p',
            text: 'Über den Autopiloten auf der **Übersicht** läuft der Postausgang auf Wunsch von selbst: Schreiben füllt ihn mit Firmen gespeicherter Zielgruppen ab der Mindestpassung, Versand verschickt die freigegebenen Mails. Der Not-Aus hält jeden Versand an (Übersicht, Autopilot und Not-Aus).',
          },
        ],
      },
      {
        id: 'contact-prospects',
        title: 'Interessenten anschreiben',
        blocks: [
          {
            type: 'steps',
            items: [
              'Öffnen Sie **Recherche**, Reiter **Interessenten**, und prüfen Sie, ob oben das richtige Produkt gewählt ist.',
              'Klicken Sie in der Zeile eines Interessenten auf **Anschreiben**, oder oben rechts auf **Neue anschreiben** für alle Interessenten des Produkts, die angeschrieben werden können.',
              'Lesen Sie die Hinweise im Fenster und bestätigen Sie mit **Anschreiben**.',
            ],
          },
          {
            type: 'list',
            items: [
              'Angeschrieben werden Interessenten mit dem Status Neu, deren E-Mail-Adresse bekannt ist und die noch nicht im Postausgang sind. **Neue anschreiben** berücksichtigt alle solchen Interessenten des Produkts, unabhängig vom gewählten Statusfilter.',
              'Fehlt der Kontakt, legt MixMarket ihn an wie bei **In Kontakte übernehmen**: mit der Herkunft „Recherche“, ohne Einwilligung und in der Interessentenliste des Produkts. Adressen auf der Sperrliste und Kontakte, die nicht aktiv sind, werden übersprungen.',
              'MixMarket meldet, wie viele Mails geschrieben werden. Interessenten, die schon im Postausgang sind, nennt eine eigene Meldung.',
              'Danach zeigt die Zeile des Interessenten einen Verweis wie „Postausgang: Zur Freigabe“, nach dem Versand etwa „Postausgang: Mail 1 gesendet“. Ein Klick darauf öffnet den **Postausgang**.',
              'Ist in den Einstellungen kein KI-Anbieter gewählt, legt MixMarket keine Mail an und meldet „Bitte zuerst in den Einstellungen einen KI-Anbieter wählen.“',
              'Der Autopilot Schreiben legt Erstmails auf dieselbe Weise selbst an, je Tag höchstens so viele, wie das Tageslimit erlaubt (Übersicht, Autopilot).',
            ],
          },
          {
            type: 'tip',
            text: 'Ein Interessent kommt nur einmal in den Postausgang. Auch wenn sein Ablauf beendet ist, lässt er sich dort nicht erneut anschreiben.',
          },
          {
            type: 'warning',
            text: 'Hat ein gewählter Interessent keinen Kontakt mit dokumentierter Einwilligung, warnt das Fenster: Werbung per E-Mail ohne Einwilligung kann nach UWG § 7 unzulässig sein. Prüfen Sie jeden Fall vor der Freigabe.',
          },
        ],
      },
      {
        id: 'ai-drafts',
        title: 'Wie die KI schreibt',
        blocks: [
          {
            type: 'p',
            text: 'Die KI schreibt mit dem Anbieter, den Sie in den **Einstellungen** im Abschnitt **KI-Bewertung** gewählt haben. Für jede Mail bekommt sie diese Angaben:',
          },
          {
            type: 'list',
            items: [
              'Ihr Produkt mit Name, Webseite und der Beschreibung unter **Was Sie verkaufen**, dazu Ihren Unternehmensnamen.',
              'Ihre **Hinweise an die KI** aus dem Ablauf des Produkts.',
              'Den Ansprechpartner des Interessenten. Ist keiner bekannt, erfährt die KI, dass die Mail an die allgemeine Adresse der Firma geht.',
              'Ansatzpunkt und Begründung aus der KI-Bewertung, soweit vorhanden.',
              'Die gesammelten Angaben zur Firma aus der Recherche.',
              'Bei Nachfass-Mails zusätzlich die bereits gesendeten Mails an diese Firma.',
            ],
          },
          {
            type: 'p',
            text: 'Anrede und Grußformel setzt MixMarket selbst. Die Anrede bildet es aus Anrede, Titel und Name des Kontakts wie beim Platzhalter {{anrede}}, in der **Sprache der Mails** des Ablaufs (Kontakte, Anrede und Titel). Den Gruß schreibt es als „Mit freundlichen Grüßen“ oder „Kind regards“. Ist in den Einstellungen keine **Signatur** hinterlegt, steht darunter der **Absendername** aus dem Postfach, fehlt er, der **Unternehmensname**. Enthält Ihre Signatur schon eine Grußformel wie „Viele Grüße“, „Mit freundlichen Grüßen“ oder „Best regards“, setzt MixMarket keinen eigenen Gruß darüber, damit er nicht doppelt erscheint. Emojis und Bildsymbole kommen in den Mails nie vor: Die KI soll keine schreiben, und MixMarket entfernt sie zusätzlich, falls doch welche im Text stehen.',
          },
          {
            type: 'p',
            text: 'Steht im Impressum nicht, ob der Ansprechpartner Herr oder Frau ist, leitet die KI beim Schreiben die Anrede aus dem Vornamen ab. Die Mail beginnt dann zum Beispiel mit „Sehr geehrter Herr Muster“. Nur bei uneindeutigen Vornamen bleibt es bei „Guten Tag Erika Muster“ mit Vor und Nachname. Die abgeleitete Anrede speichert MixMarket im Feld **Anrede** des Kontakts. Dort können Sie sie jederzeit ändern (Kontakte, Anrede und Titel).',
          },
          {
            type: 'list',
            items: [
              'Die KI soll sachlich und ohne Werbesprech schreiben, nur Fakten aus den Angaben verwenden und keine Zahlen, Kunden, Preise oder Termine erfinden. Die Erstmail soll höchstens 120 Wörter haben, eine Nachfass-Mail höchstens 70.',
              'Die Mail ist reiner Text ohne Formatierung. Adressen, die mit http oder https beginnen, werden beim Versand zu anklickbaren Links.',
              'Die KI schreibt immer nur eine Mail gleichzeitig. Solange sie schreibt, steht die Mail mit dem Status **KI schreibt** im Reiter **Zur Freigabe**. Das dauert meist unter einer Minute, die Ansicht aktualisiert sich von selbst.',
            ],
          },
          {
            type: 'p',
            text: 'Gelingt das Schreiben nicht, steht die Mail mit dem Status **Fehler** und der **Fehlermeldung** im Reiter **Beendet**. Ist die KI gar nicht erreichbar, etwa weil das Abo nicht angemeldet ist, betrifft das alle Mails, die gerade auf die KI warten. Mit **Neu schreiben** versuchen Sie es erneut.',
          },
          {
            type: 'p',
            text: 'Während einer KI-Pause gilt das nicht als Fehler: Die Mails bleiben bei **KI schreibt** und werden nach der Pause geschrieben (Übersicht, KI-Pause).',
          },
          {
            type: 'warning',
            text: 'Die KI kann sich irren. Lesen Sie jede Mail vor der Freigabe.',
          },
        ],
      },
      {
        id: 'review',
        title: 'Prüfen und freigeben',
        blocks: [
          {
            type: 'tip',
            text: '**Alle freigeben** gehört zu MixMarket Pro. Ohne Pro geben Sie jede Mail einzeln frei.',
          },
          {
            type: 'p',
            text: 'Im Reiter **Zur Freigabe** warten die fertigen Mails auf Sie. Wählen Sie eine Mail in der Liste. Die Ansicht zeigt Firma, Produkt und Ort, den Empfänger unter **An**, den **Betreff** und den Text. Unter dem Text zeigt die Vorschau auch Signatur, Postanschrift und Abmeldehinweis so, wie sie beim Versand angehängt werden, mit dem Hinweis „Signatur, Anschrift und Abmeldehinweis setzt MixMarket beim Versand automatisch darunter.“ Darunter stehen die Knöpfe:',
          },
          {
            type: 'terms',
            items: [
              { term: 'Freigeben', text: 'Die Mail wechselt in den Reiter **Geplant** und geht im nächsten Versandfenster hinaus, eine Nachfass-Mail frühestens zu ihrem Termin.' },
              { term: 'Bearbeiten', text: 'Ändern Sie **Betreff** und Text und klicken Sie **Speichern**, oder verwerfen Sie die Änderung mit **Abbrechen**. Die Mail trägt danach den Hinweis **Von Ihnen bearbeitet**. Eine geschriebene Mail mit Fehler kehrt nach dem Speichern in den Reiter **Zur Freigabe** zurück.' },
              { term: 'Neu schreiben', text: 'Öffnet das Fenster **Neu schreiben lassen**. Unter **Wunsch an die KI** geben Sie freiwillig an, was anders werden soll, zum Beispiel kürzer oder ohne Link. Mit **Neu schreiben** schreibt die KI die Mail neu und ersetzt die bisherige Fassung samt Ihren Änderungen.' },
              { term: 'Ablehnen', text: 'Die Mail geht nicht hinaus, und der Ablauf für diesen Interessenten endet. Alle seine offenen Mails entfallen.' },
              { term: 'Ablauf beenden', text: 'Alle noch offenen Mails dieses Interessenten entfallen, auch vorgemerkte Nachfass-Mails. Sie stehen danach im Reiter **Beendet** mit dem Grund „Von Hand beendet“.' },
            ],
          },
          {
            type: 'list',
            items: [
              '**Freigeben** gibt es nur bei Mails zur Freigabe.',
              '**Bearbeiten**, **Neu schreiben** und **Ablehnen** gehen auch bei freigegebenen, noch nicht versendeten Mails und bei Mails mit Fehler.',
              '**Ablauf beenden** gibt es, solange der Ablauf läuft, also auch bei vorgemerkten Nachfass-Mails.',
              'Vor **Ablehnen** und **Ablauf beenden** fragt MixMarket nach.',
            ],
          },
          {
            type: 'p',
            text: 'Mit **Alle freigeben** geben Sie alle fertigen Mails im Reiter **Zur Freigabe** auf einmal frei. Haben Sie unter **Alle Produkte** ein Produkt gewählt, gilt das nur für dessen Mails. Die Rückfrage nennt die Zahl der Mails und weist darauf hin, dass sie nacheinander im Versandfenster hinausgehen, höchstens so viele je Tag wie Ihr Tageslimit. Mails, die die KI gerade schreibt, bleiben außen vor.',
          },
          {
            type: 'warning',
            text: 'Gehen Mails im Reiter **Zur Freigabe** an Kontakte ohne dokumentierte Einwilligung, steht über der Liste ein Warnhinweis mit ihrer Zahl, ebenso in der Rückfrage zu **Alle freigeben**. Jede solche Mail trägt die Kennzeichnung **Ohne Einwilligung**. Prüfen Sie jeden Fall vor der Freigabe.',
          },
        ],
      },
      {
        id: 'views',
        title: 'Reiter und Ansicht',
        blocks: [
          {
            type: 'terms',
            items: [
              { term: 'Zur Freigabe', text: 'Mails, die die KI gerade schreibt oder die auf Ihre Freigabe warten.' },
              { term: 'Geplant', text: 'Freigegebene Mails und vorgemerkte Nachfass-Mails, die noch nicht geschrieben sind.' },
              { term: 'Gesendet', text: 'Verschickte Mails, auch Testversände, mit Öffnungen und Klicks.' },
              { term: 'Beendet', text: 'Abgelehnte Mails, Mails mit Fehler und Mails, deren Ablauf beendet wurde.' },
            ],
          },
          {
            type: 'list',
            items: [
              'Hinter jedem Reiter steht die Zahl seiner Mails. Auf dem Handy wählen Sie den Reiter über ein Auswahlfeld.',
              'Die Auswahl **Alle Produkte** zeigt auf Wunsch nur die Mails eines Produkts. Die Zahlen der Reiter folgen dieser Auswahl.',
              'Jede Zeile zeigt Firma, Zeitpunkt, Status, die Stelle im Ablauf wie **Erstmail** oder **Nachfass 1**, den Empfänger, den Betreff und den Anfang des Textes.',
              'Auf breiten Bildschirmen steht links die Liste und rechts die gewählte Mail. Auf schmalen Bildschirmen öffnet ein Klick die Mail in einem Fenster, **Zurück zur Liste** schließt es wieder.',
            ],
          },
          {
            type: 'p',
            text: 'Oben in der Ansicht einer Mail zeigt eine Ablaufleiste alle Stationen des Ablaufs: **Erstmail**, **Nachfass 1** und so weiter. Bei gesendeten Stationen steht der Status, bei offenen der geplante Zeitpunkt. Darunter stehen die Angaben zu dieser Mail:',
          },
          {
            type: 'list',
            items: [
              '„Nach Freigabe frühestens“ bei Mails zur Freigabe und „Geplant ab“ bei freigegebenen Mails, jeweils mit dem frühesten Versandzeitpunkt.',
              '„Termin“ bei vorgemerkten Nachfass-Mails und „Gesendet am“ bei verschickten Mails.',
              '**Geöffnet** und **Link geklickt**, sobald der Empfänger die Mail geöffnet oder einen Link angeklickt hat. Wie bei Kampagnen sind Öffnungen nur ein grober Anhaltspunkt.',
              '**Von Ihnen bearbeitet**, wenn Sie den Text geändert haben.',
              'Bei beendeten Mails der Grund, bei Mails mit Fehler die **Fehlermeldung**.',
            ],
          },
          {
            type: 'p',
            text: 'Über den Reitern zeigt eine Statuszeile den Stand des Versands: wie viele Mails heute gesendet sind, etwa „Heute 3 von 20 gesendet“, Versandtage und Uhrzeiten wie „Mo bis Fr, 08:00 bis 17:00 Uhr“ und daneben **Versandfenster offen**, „Nächster Versand ab“ mit Zeitpunkt oder **Tageslimit erreicht**.',
          },
        ],
      },
      {
        id: 'sequence',
        title: 'Ablauf je Produkt',
        blocks: [
          {
            type: 'tip',
            text: 'Nachfass-Mails gehören zu MixMarket Pro. Ohne Pro bekommt jeder Interessent nur die Erstmail. Sprache, Freigabe und Hinweise an die KI stellen Sie trotzdem hier ein.',
          },
          {
            type: 'p',
            text: 'Mit **Ablauf** oben rechts legen Sie je Produkt fest, wie viele Mails ein Interessent höchstens bekommt, in welchem Abstand und in welcher Sprache.',
          },
          {
            type: 'steps',
            items: [
              'Klicken Sie **Ablauf** und wählen Sie unter **Produkt** das Produkt. Vorgewählt ist das Produkt aus der Auswahl über der Liste, sonst das in der Recherche gewählte.',
              'Wählen Sie unter **Nachfass-Mails**, wie viele Nachfass-Mails auf die Erstmail folgen, von **Keine Nachfass-Mail** bis **3 Nachfass-Mails**.',
              'Tragen Sie für jede Nachfass-Mail unter **Abstand vor Nachfass 1** und so weiter die Zahl der Tage ein, 1 bis 60. Gezählt wird ab dem Versand der vorigen Mail.',
              'Wählen Sie unter **Sprache der Mails** **Deutsch** oder **Englisch**. Danach richten sich Text, Anrede, Grußformel und Abmelde-Hinweis.',
              'Lassen Sie den Haken **Jede Mail vor dem Versand freigeben** gesetzt, wenn Sie jede Mail selbst prüfen wollen.',
              'Unter **Hinweise an die KI** geben Sie auf Wunsch vor, worauf die KI achten soll, zum Beispiel eine kurze Vorführung per Video anzubieten.',
              'Klicken Sie **Speichern**.',
            ],
          },
          {
            type: 'list',
            items: [
              'Voreingestellt sind 2 Nachfass-Mails im Abstand von 4 und 7 Tagen, die Sprache Deutsch und die Freigabe jeder Mail.',
              'Ohne den Haken **Jede Mail vor dem Versand freigeben** gehen die Mails der KI direkt in den Reiter **Geplant** und ungeprüft hinaus.',
              'Ausnahme: Hat die KI einen Link auf eine fremde Domain in eine Mail geschrieben, landet die Mail trotzdem im Reiter **Zur Freigabe**. Als eigene Domain gilt die **Webseite (optional)** des Produkts samt ihren Unterdomains und ihrer übergeordneten Domain. Auch Adressen ohne http wie beispiel.de zählen als Link, E-Mail-Adressen nicht. Hat das Produkt keine Webseite, gilt jeder Link als fremd.',
              'Stellen Sie weniger Nachfass-Mails ein, entfallen bereits vorgemerkte überzählige Nachfass-Mails dieses Produkts. Sie stehen dann im Reiter **Beendet**.',
              'Ihre Einstellungen gelten für alle Mails, die danach geschrieben oder vorgemerkt werden. Schon geschriebene Texte ändert MixMarket nicht.',
              'Gibt es noch kein Produkt, zeigt das Fenster den Hinweis „Legen Sie zuerst unter Recherche ein Produkt an.“',
            ],
          },
          {
            type: 'warning',
            text: 'Ohne Freigabe gehen die Mails der KI ungeprüft hinaus, ausgenommen Mails mit einem Link auf eine fremde Domain. Lassen Sie den Haken gesetzt, solange Sie die Mails der KI nicht gut kennen.',
          },
        ],
      },
      {
        id: 'follow-ups',
        title: 'Nachfass-Mails',
        blocks: [
          {
            type: 'tip',
            text: 'Nachfass-Mails gehören zu MixMarket Pro.',
          },
          {
            type: 'list',
            items: [
              'Sobald eine Mail versendet ist, merkt MixMarket die nächste Nachfass-Mail vor, falls der Ablauf eine vorsieht. Sie steht mit dem Status **Vorgemerkt** und ihrem Termin im Reiter **Geplant**.',
              'Etwa einen Tag vor dem Termin schreibt die KI die Nachfass-Mail. Sie kennt dabei die bisher gesendeten Mails und soll einen neuen Gesichtspunkt einbringen. Danach erscheint die Mail im Reiter **Zur Freigabe**, ohne Freigabe direkt unter **Geplant**, außer sie enthält einen Link auf eine fremde Domain (Abschnitt Ablauf je Produkt).',
              'Versendet wird frühestens zum Termin, im nächsten Versandfenster.',
              'Nachfass-Mails gehen als Antwort im selben Verlauf hinaus. Ihr Betreff ist der Betreff der Erstmail mit vorangestelltem „Re:“, und Mailprogramme können sie der Erstmail zuordnen.',
              'Die letzte Nachfass-Mail eines Ablaufs kündigt freundlich an, dass danach keine weitere Mail folgt.',
            ],
          },
          {
            type: 'tip',
            text: 'Die Abstände zählen ab dem tatsächlichen Versand der vorigen Mail. Wartet eine Mail länger auf Ihre Freigabe, verschieben sich die folgenden Termine entsprechend.',
          },
        ],
      },
      {
        id: 'send-rules',
        title: 'Versandregeln',
        blocks: [
          {
            type: 'p',
            text: 'Mit **Versandregeln** oben rechts legen Sie fest, wann und wie viele Mails der Postausgang verschickt. Die Regeln gelten für alle Mails aus dem Postausgang, nicht für Kampagnen und Automatisierungen.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Versandtage', text: 'Die Wochentage, an denen versendet wird. Mindestens ein Tag ist nötig.' },
              { term: 'Von und Bis', text: 'Beginn und Ende des Versandfensters als Uhrzeit wie 08:00, in der Ortszeit des Servers. Der Beginn muss vor dem Ende liegen.' },
              { term: 'Tageslimit', text: 'Höchstzahl der Mails je Tag, 1 bis 500.' },
              { term: 'Abstand zwischen Mails', text: 'Mindestabstand zwischen zwei Mails in Minuten, 1 bis 240.' },
            ],
          },
          {
            type: 'p',
            text: 'Voreingestellt sind Montag bis Freitag, 08:00 bis 17:00 Uhr, 20 Mails je Tag und 3 Minuten Abstand. Mit **Speichern** übernehmen Sie die Regeln.',
          },
          {
            type: 'list',
            items: [
              'Freigegebene Mails gehen frühestens im nächsten Versandfenster hinaus, nacheinander und die mit dem frühesten Termin zuerst. MixMarket prüft dazu jede Minute.',
              'Ist das Tageslimit erreicht, geht es am nächsten Versandtag weiter. Testversände zählen beim Tageslimit mit.',
              'Versendet wird mit **Absendername** und **Absenderadresse** Ihres Postfachs aus den Einstellungen.',
              'Nach dem Versand der Erstmail setzt MixMarket den Interessenten vom Status Neu auf Kontaktiert.',
              'Ist der Autopilot Versand aus oder der Not-Aus aktiv, verschickt der Postausgang nichts. Freigegebene Mails warten dann, die KI schreibt weiter (Übersicht).',
            ],
          },
          {
            type: 'tip',
            text: 'Ein niedriges Tageslimit und ein Abstand zwischen den Mails helfen, dass Ihr Postfach nicht als Massenversender auffällt.',
          },
        ],
      },
      {
        id: 'auto-stop',
        title: 'Wann ein Ablauf endet',
        blocks: [
          {
            type: 'p',
            text: 'Ein Ablauf endet von selbst, und alle noch offenen Mails des Interessenten entfallen, in diesen Fällen:',
          },
          {
            type: 'list',
            items: [
              'Der Empfänger antwortet. Sobald MixMarket die Antwort aus dem Postfach abgerufen hat, endet der Ablauf mit dem Grund „Empfänger hat geantwortet“, und der Interessent wechselt von Neu oder Kontaktiert auf Im Gespräch (Gespräche). Abwesenheitsnotizen beenden den Ablauf nicht.',
              'Der Status des Interessenten wechselt auf Im Gespräch, Kein Interesse oder Kunde.',
              'Der Empfänger meldet sich über den Link in einer Mail oder den Abmeldeknopf seines Mailprogramms ab. Seine Interessenten erhalten dann auch den Status Kein Interesse. Ordnet die KI eine Antwort als Abmeldung ein, endet der Ablauf ebenso, und der Interessent dieser Antwort erhält den Status Kein Interesse.',
              'Eine Mail an die Adresse kommt dauerhaft als unzustellbar zurück. Die Adresse kommt dann auf die Sperrliste, im Reiter **Beendet** steht der Grund „Mail war unzustellbar“.',
              'Die Adresse steht auf der Sperrliste.',
              'Der Kontakt fehlt oder ist nicht mehr aktiv.',
              'Sie lehnen eine Mail des Ablaufs ab.',
              'Sie beenden den Ablauf mit **Ablauf beenden** von Hand.',
            ],
          },
          {
            type: 'p',
            text: 'Den Grund sehen Sie im Reiter **Beendet** bei jeder betroffenen Mail, etwa „Empfänger hat geantwortet“, „Empfänger hat sich abgemeldet“ oder „Status des Interessenten geändert“.',
          },
          {
            type: 'p',
            text: 'Unmittelbar vor jedem Versand und bevor die KI eine Nachfass-Mail schreibt, prüft MixMarket diese Bedingungen erneut. So geht keine Mail an jemanden, der sich inzwischen abgemeldet hat oder gesperrt ist.',
          },
          {
            type: 'tip',
            text: 'Antworten und Rückläufer erkennt MixMarket nur, wenn in den **Einstellungen** im Abschnitt **Postfach** der Empfang (IMAP) eingerichtet ist. Ohne Empfang setzen Sie den Status des Interessenten selbst auf Im Gespräch, sobald jemand antwortet. Damit endet der Ablauf ebenfalls.',
          },
        ],
      },
      {
        id: 'test-mode',
        title: 'Testmodus und Hinweise',
        blocks: [
          {
            type: 'p',
            text: 'Ist kein Postfach eingerichtet, zeigt der Postausgang oben einen Hinweis zum Testmodus mit dem Knopf **Postfach einrichten**, der zum Abschnitt **Postfach** der Einstellungen führt. Im Testmodus laufen Freigabe und Versandregeln wie gewohnt, die Mails werden aber nur als gesendet markiert und nicht verschickt. In der Liste tragen sie den Status **Testversand**, in der Ansicht den Hinweis „Testversand, nicht verschickt“.',
          },
          {
            type: 'p',
            text: 'Ist kein KI-Anbieter gewählt, erscheint ein Hinweis mit dem Knopf **KI einrichten**, der zum Abschnitt **KI-Bewertung** der Einstellungen führt. Ohne KI schreibt der Postausgang keine Mails.',
          },
          {
            type: 'warning',
            text: 'Auch ein Testversand gilt als gesendet: Der Interessent wechselt auf Kontaktiert, die nächste Nachfass-Mail wird vorgemerkt, und anschreiben lässt er sich danach nicht mehr. Probieren Sie den Testmodus deshalb mit Interessenten aus, die Sie später nicht echt anschreiben wollen.',
          },
        ],
      },
      {
        id: 'legal',
        title: 'Pflichtangaben und Recht',
        blocks: [
          {
            type: 'list',
            items: [
              'Jede Mail aus dem Postausgang enthält wie eine Kampagnen-Mail Ihre **Signatur**, falls eingetragen, den Footer mit **Postanschrift (Pflicht im Footer)**, Abmelde-Hinweis und Abmeldelink in der **Sprache der Mails** sowie eine automatisch erzeugte Textfassung.',
              'MixMarket sendet eine technische Abmeldeangabe mit, damit Mailprogramme einen eigenen Abmeldeknopf anzeigen können.',
              'Öffnungen und Klicks werden wie bei Kampagnen über ein unsichtbares Bild und umgeleitete Links gezählt.',
            ],
          },
          {
            type: 'warning',
            text: 'Kontakte aus der Recherche haben keine dokumentierte Einwilligung. Werbung per E-Mail ohne Einwilligung kann nach UWG § 7 unzulässig sein, auch wenn jede Mail einzeln geschrieben ist. Prüfen Sie jeden Fall vor der Freigabe. Mehr dazu im Kapitel Recht und Zustellbarkeit.',
          },
        ],
      },
    ],
  },
  {
    id: 'conversations',
    title: 'Gespräche',
    summary: 'Unter Gespräche sammelt MixMarket die Antworten auf Ihre Mails aus dem Postfach, erkennt Rückläufer und Abwesenheitsnotizen, lässt die KI Antworten einordnen und hilft Ihnen beim Antworten.',
    sections: [
      {
        id: 'purpose',
        title: 'Wofür Gespräche da sind',
        blocks: [
          {
            type: 'p',
            text: 'Unter **Gespräche** landen die Antworten auf Ihre Mails. MixMarket liest dazu Ihr Postfach mit, ordnet jede Antwort der Mail und dem Kontakt zu, auf die sie sich bezieht, und fasst alles je Kontakt zu einem Gespräch zusammen. Eine echte Antwort beendet sofort den Ablauf im Postausgang. Ist der Autopilot Antworten eingeschaltet, ordnet die KI die Antwort danach ein und schreibt bei Interesse oder einer Frage einen Antwortentwurf.',
          },
          {
            type: 'p',
            text: 'Sie öffnen **Gespräche** in der Kopfleiste, auf schmalen Bildschirmen über die Seitenleiste. Die Zahl hinter **Gespräche** nennt die offenen Antworten.',
          },
          {
            type: 'tip',
            text: 'Ohne Ihren Klick auf **Senden** geht keine Antwort hinaus. Entwürfe der KI warten immer auf Sie.',
          },
          {
            type: 'p',
            text: 'Voraussetzung ist der Empfang in den **Einstellungen** im Abschnitt **Postfach** unter **Empfang (IMAP)**. Für die Einordnung und die Entwürfe brauchen Sie außerdem einen KI-Anbieter im Abschnitt **KI-Bewertung**.',
          },
        ],
      },
      {
        id: 'fetching',
        title: 'Abruf des Postfachs',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket ruft den **Ordner für Antworten** aus den Einstellungen etwa alle 2 Minuten ab. Es öffnet das Postfach dabei nur lesend: Mails bleiben ungelesen und unverändert, MixMarket verschiebt und löscht nichts.',
          },
          {
            type: 'list',
            items: [
              'Beim ersten Abruf schaut MixMarket 14 Tage zurück. Danach holt es nur Mails, die seit dem letzten Abruf neu eingegangen sind.',
              'Je Abruf verarbeitet MixMarket höchstens 200 Mails, der Rest folgt beim nächsten Abruf. Mails über 8 MB, meist mit großen Anhängen, lädt es nicht.',
              'Mit **Jetzt abrufen** oben rechts rufen Sie das Postfach sofort ab. Danach meldet MixMarket zum Beispiel „Abgerufen, 2 neue Mails“ oder „Abgerufen, nichts Neues“.',
              'Über der Liste zeigt eine Statuszeile „Zuletzt abgerufen“ mit Datum und Uhrzeit, vor dem ersten Abruf „Noch nicht abgerufen“, daneben „Abruf alle 2 Minuten, nur lesend“.',
            ],
          },
        ],
      },
      {
        id: 'what-is-stored',
        title: 'Welche Mails MixMarket speichert',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket speichert nur Mails, die zu Ihrer Arbeit in MixMarket gehören:',
          },
          {
            type: 'list',
            items: [
              'Antworten auf Ihre eigenen Mails, also auf Mails aus dem Postausgang, auf Kampagnen-Mails und auf Ihre Antworten unter **Gespräche**. MixMarket erkennt sie am Verlauf der Mail, auch wenn die Antwort von einer anderen Adresse kommt.',
              'Mails von bekannten Kontakten, also von Adressen, die unter **Kontakte** stehen. Auf diesem Weg erkennt MixMarket auch Antworten auf Nachfass-Mails aus Automatisierungen. Auch eine Mail, die ein Kontakt von sich aus schreibt, gilt als Antwort.',
              'Rückläufer zu Ihren eigenen Mails oder an bekannte Kontakte.',
            ],
          },
          {
            type: 'p',
            text: 'Alle anderen Mails speichert MixMarket nicht, sie bleiben nur in Ihrem Postfach. Mails mit der Absenderadresse Ihres Postfachs wertet MixMarket nie als Antwort. Eine Mail, die schon gespeichert ist, übernimmt es kein zweites Mal.',
          },
          {
            type: 'p',
            text: 'Ein Gespräch umfasst alle Mails eines Kontakts. Gehört eine Mail zu keinem Kontakt, bildet die Absenderadresse das Gespräch, bei Rückläufern die unzustellbare Adresse.',
          },
        ],
      },
      {
        id: 'replies',
        title: 'Was eine Antwort auslöst',
        blocks: [
          {
            type: 'p',
            text: 'Ist eine Mail eine echte Antwort, also weder Rückläufer noch Abwesenheitsnotiz, geschieht sofort Folgendes:',
          },
          {
            type: 'list',
            items: [
              'Der Ablauf im Postausgang endet. Alle offenen Mails entfallen und stehen im Postausgang im Reiter **Beendet** mit dem Grund „Empfänger hat geantwortet“. Gehört die Antwort zu einem Interessenten, gilt das für seinen Ablauf, sonst für alle Abläufe des Kontakts.',
              'Der Interessent wechselt vom Status Neu oder Kontaktiert auf Im Gespräch. Andere Status bleiben.',
              'Die Antwort ist offen und zählt bei **Gespräche** in der Kopfleiste mit.',
              'Ist der Autopilot Antworten eingeschaltet, ordnet die KI die Antwort ein (Abschnitt Einordnung durch die KI).',
            ],
          },
          {
            type: 'tip',
            text: 'MixMarket erkennt eine Antwort erst beim nächsten Abruf des Postfachs. Bis dahin läuft der Ablauf im Postausgang weiter. Mit **Jetzt abrufen** holen Sie neue Mails sofort.',
          },
        ],
      },
      {
        id: 'ai-category',
        title: 'Einordnung durch die KI',
        blocks: [
          {
            type: 'tip',
            text: 'Die Einordnung durch die KI gehört zu MixMarket Pro. Ohne Pro steht bei neuen Antworten **Nicht eingeordnet**, und Sie ordnen sie selbst ein.',
          },
          {
            type: 'p',
            text: 'Die KI liest jede echte Antwort ohne die zitierten früheren Mails, dazu bis zu sechs frühere Mails mit diesem Kontakt, Ihren Unternehmensnamen und, wenn die Antwort zu einem Interessenten gehört, Ihr Produkt mit Beschreibung und Ihre **Hinweise an die KI**. Sie wählt eine von fünf Einordnungen und fasst die Antwort in einem Satz auf Deutsch zusammen. Unter **Aktivitäten** erscheint sie als Handelnder „KI-Gespräche“.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Interesse', text: 'Der Empfänger möchte mehr wissen, etwa einen Termin, ein Angebot oder einen Test.' },
              { term: 'Frage', text: 'Der Empfänger stellt eine konkrete Frage ohne klares Interesse.' },
              { term: 'Kein Interesse', text: 'Der Empfänger lehnt ab, hat keinen Bedarf oder schon eine Lösung.' },
              { term: 'Abmeldung', text: 'Der Empfänger möchte keine weiteren Mails, verlangt die Löschung seiner Daten oder widerspricht.' },
              { term: 'Sonstiges', text: 'Alles andere, zum Beispiel eine Weiterleitung an Kollegen.' },
            ],
          },
          {
            type: 'p',
            text: 'Je nach Einordnung setzt MixMarket diese Folgen um:',
          },
          {
            type: 'list',
            items: [
              '**Kein Interesse** und **Abmeldung** setzen den zugehörigen Interessenten auf Kein Interesse. Ein Kunde bleibt Kunde.',
              '**Abmeldung** setzt die Adresse zusätzlich mit dem Grund Abgemeldet auf die Sperrliste, ein bestehender Sperrgrund bleibt dabei. Der Kontakt erhält den Status Abgemeldet, laufende Abläufe im Postausgang an diese Adresse enden, und offene Entwürfe zu dieser Antwort entfallen. Antworten an diese Adresse lassen sich danach nicht mehr senden.',
              'Bei **Interesse**, **Frage** und **Sonstiges** setzt MixMarket einen Interessenten mit dem Status Neu oder Kontaktiert auf Im Gespräch.',
              'Bei **Interesse** und **Frage** legt die KI außerdem einen Antwortentwurf an (Abschnitt Antworten schreiben und senden).',
            ],
          },
          {
            type: 'p',
            text: 'Solange die KI arbeitet, steht an der Antwort **KI ordnet ein**. Gelingt die Einordnung nicht, etwa weil kein KI-Anbieter gewählt oder die KI nicht erreichbar ist, steht dort **Einordnung fehlgeschlagen** mit der Fehlermeldung. Ordnen Sie die Antwort dann selbst ein.',
          },
          {
            type: 'p',
            text: 'Die KI ordnet nur ein, solange der Autopilot Antworten auf der **Übersicht** eingeschaltet ist. Ist er aus, bleiben neue Antworten bei **KI ordnet ein**, bekommen keinen automatischen Entwurf und werden eingeordnet, sobald Sie ihn wieder einschalten. Während einer KI-Pause warten sie ebenso und werden nach der Pause eingeordnet (Übersicht, Autopilot und KI-Pause).',
          },
          {
            type: 'tip',
            text: 'Ordnen Sie eine wartende Antwort selbst ein, übernimmt die KI sie danach nicht mehr.',
          },
        ],
      },
      {
        id: 'category-manual',
        title: 'Einordnung selbst ändern',
        blocks: [
          {
            type: 'p',
            text: 'An jeder Antwort im Verlauf steht das Auswahlfeld **Einordnung**. Wählen Sie dort eine andere Einordnung, setzt MixMarket dieselben Folgen um wie bei der KI und vermerkt die Änderung unter **Aktivitäten**.',
          },
          {
            type: 'list',
            items: [
              'Einen Antwortentwurf legt eine Änderung von Hand nicht an. Klicken Sie dafür unter **Ihre Antwort** auf **Antwort entwerfen**.',
              'Folgen werden nicht zurückgenommen. Ändern Sie etwa **Abmeldung** in **Interesse**, bleibt die Adresse gesperrt und der Interessent auf Kein Interesse. Den Status ändern Sie dann unter **Status des Interessenten**, die Sperre heben Sie unter **Sperrliste** mit **Freigeben** auf.',
            ],
          },
          {
            type: 'warning',
            text: 'Die KI kann sich irren. Prüfen Sie besonders Antworten mit der Einordnung **Abmeldung** oder **Kein Interesse**, denn sie ändern Interessent, Kontakt und Sperrliste ohne Rückfrage.',
          },
        ],
      },
      {
        id: 'bounces',
        title: 'Rückläufer',
        blocks: [
          {
            type: 'p',
            text: 'Ein Rückläufer ist die Meldung eines Mailservers, dass eine Mail nicht zugestellt werden konnte. MixMarket erkennt ihn am Absender, etwa mailer-daemon oder postmaster, an der technischen Zustellmeldung oder am Betreff, etwa „Unzustellbar“ oder „Undeliverable“. Aus der Meldung liest es die betroffene Adresse und ob der Fehler dauerhaft oder vorübergehend ist. Ohne eindeutige Angabe gilt er als dauerhaft.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Unzustellbar', text: 'Dauerhafter Fehler, etwa eine Adresse, die es nicht gibt. MixMarket setzt die Adresse mit dem Grund Unzustellbar auf die Sperrliste, ein bestehender Sperrgrund bleibt dabei. Ein aktiver Kontakt erhält den Status Unzustellbar. Laufende Abläufe im Postausgang an diese Adresse enden mit dem Grund „Mail war unzustellbar“. Stammt die Mail aus einer Kampagne, vermerkt MixMarket den Versand an diese Adresse als unzustellbar.' },
              { term: 'Vorübergehend unzustellbar', text: 'Vorübergehender Fehler. MixMarket vermerkt die Meldung nur und ändert nichts an Adresse, Kontakt und Ablauf. Der Mailserver versucht es meist erneut.' },
            ],
          },
          {
            type: 'list',
            items: [
              'Rückläufer stehen in der Ansicht **Unzustellbar**, nicht unter **Offen** und **Alle**. Dauerhafte Rückläufer bleiben offen, bis Sie sie mit **Erledigt** schließen, vorübergehende gelten sofort als erledigt. Die Zahl an **Unzustellbar** nennt die offenen Rückläufer.',
              'Im Verlauf steht ein Rückläufer als **Unzustellbar-Meldung** mit einem Hinweis, was MixMarket getan hat. Auf einen Rückläufer lässt sich nicht antworten.',
              'Jeder Rückläufer erscheint unter **Aktivitäten**, ein dauerhafter als Warnung. Ein dauerhafter erscheint außerdem als Hinweis unter **Wartet auf Sie** auf der Übersicht.',
              'Dauerhafte Rückläufer zählen für den automatischen Not-Aus. Sind es in 24 Stunden zu viele, stoppt MixMarket jeden Versand (Übersicht, Not-Aus).',
            ],
          },
        ],
      },
      {
        id: 'auto-replies',
        title: 'Abwesenheitsnotizen',
        blocks: [
          {
            type: 'p',
            text: 'Automatische Antworten wie Abwesenheitsnotizen, Urlaubsmeldungen oder Eingangsbestätigungen erkennt MixMarket an ihrer technischen Kennzeichnung oder am Betreff, etwa „Automatische Antwort“, „Abwesenheit“ oder „Out of Office“.',
          },
          {
            type: 'list',
            items: [
              'Sie stehen im Gespräch mit der Kennzeichnung **Abwesenheit** und gelten sofort als erledigt. Sie finden sie in der Ansicht **Alle**.',
              'Sie beenden keinen Ablauf im Postausgang, ändern den Status des Interessenten nicht und werden nicht von der KI eingeordnet.',
              'Auf eine Abwesenheitsnotiz lässt sich nicht antworten.',
            ],
          },
        ],
      },
      {
        id: 'views',
        title: 'Ansichten und Liste',
        blocks: [
          {
            type: 'terms',
            items: [
              { term: 'Offen', text: 'Gespräche mit mindestens einer offenen Antwort. Mit dieser Ansicht öffnet sich die Seite.' },
              { term: 'Alle', text: 'Alle Gespräche mit Antworten und Abwesenheitsnotizen, auch erledigte.' },
              { term: 'Unzustellbar', text: 'Alle Rückläufer, je Kontakt oder Adresse zusammengefasst.' },
            ],
          },
          {
            type: 'list',
            items: [
              'Hinter **Offen** steht die Zahl offener Antworten, hinter **Unzustellbar** die Zahl offener Rückläufer. Auf dem Handy wählen Sie die Ansicht über ein Auswahlfeld.',
              'Jede Zeile zeigt Firma oder Absender, den Zeitpunkt der jüngsten Mail, die Kennzeichnung, den Namen des Absenders und die Zusammenfassung der KI, ohne Zusammenfassung den Betreff und den Anfang des Textes. Gespräche mit offenen Antworten sind hervorgehoben.',
              'Hat ein Gespräch mehrere Mails, nennt der Hinweis „2 neu“ die offenen. **Entwurf** zeigt, dass ein Antwortentwurf wartet.',
              'Kennzeichnungen sind die Einordnung der KI, **KI ordnet ein**, **Einordnung fehlgeschlagen**, **Abwesenheit**, **Unzustellbar** und **Vorübergehend unzustellbar**.',
              'Auf breiten Bildschirmen steht links die Liste und rechts das gewählte Gespräch. Auf schmalen Bildschirmen öffnet ein Klick das Gespräch in einem Fenster, **Zurück zur Liste** schließt es wieder.',
              'Die Ansicht aktualisiert sich von selbst, solange die KI arbeitet, in kurzen Abständen.',
            ],
          },
        ],
      },
      {
        id: 'thread',
        title: 'Der Verlauf',
        blocks: [
          {
            type: 'p',
            text: 'Die Ansicht eines Gesprächs zeigt oben Firma, Name und Adresse des Kontakts und das Produkt. Darunter steht der ganze Verlauf, die älteste Mail zuerst:',
          },
          {
            type: 'list',
            items: [
              '**Ihre Mail** aus dem Postausgang mit ihrer Nummer im Ablauf, etwa „Ihre Mail, Postausgang 1“, und ihrem Text.',
              'Kampagnen-Mails mit dem Namen der Kampagne und dem Betreff, ohne Text.',
              'Antworten mit Kennzeichnung, Zusammenfassung der KI und dem Auswahlfeld **Einordnung**. Angezeigt wird nur die neue Antwort. Zitierte frühere Mails blenden Sie mit **Zitat anzeigen** ein und mit **Zitat ausblenden** wieder aus.',
              '**Ihre Antwort** für jede Antwort, die Sie unter **Gespräche** gesendet haben, im Testmodus mit dem Hinweis „Testversand, nicht verschickt“.',
              'Rückläufer und Abwesenheitsnotizen mit einem kurzen Hinweis.',
            ],
          },
          {
            type: 'p',
            text: 'Der Verlauf zeigt alle Mails, die dieser Kontakt aus dem Postausgang und aus Kampagnen von Ihnen bekommen hat, nicht nur die beantwortete.',
          },
          {
            type: 'p',
            text: 'Oben rechts schließen Sie das Gespräch mit **Erledigt**. Alle offenen Mails des Gesprächs gelten dann als erledigt, und es verschwindet aus **Offen**. Ist nichts mehr offen, steht dort **Wieder öffnen**. Das Gespräch kommt dann zurück nach **Offen**.',
          },
          {
            type: 'p',
            text: 'Gehört das Gespräch zu einem Interessenten, ändern Sie seinen Status direkt im Auswahlfeld **Status des Interessenten**, so wie in der Recherche (Recherche, Interessenten).',
          },
        ],
      },
      {
        id: 'reply',
        title: 'Antworten schreiben und senden',
        blocks: [
          {
            type: 'tip',
            text: 'Antwortentwürfe der KI gehören zu MixMarket Pro. Mit **Selbst schreiben** antworten Sie auch ohne Pro.',
          },
          {
            type: 'p',
            text: 'Unter dem Verlauf steht **Ihre Antwort**. Gibt es noch keinen Entwurf, wählen Sie:',
          },
          {
            type: 'terms',
            items: [
              { term: 'Antwort entwerfen', text: 'Die KI schreibt einen Entwurf auf die jüngste Antwort des Gesprächs. Das dauert meist unter einer Minute, die Ansicht aktualisiert sich von selbst. Dafür braucht es einen KI-Anbieter in den Einstellungen. Das geht auch bei ausgeschaltetem Autopilot Antworten. Während einer KI-Pause wird der Entwurf nach der Pause geschrieben.' },
              { term: 'Selbst schreiben', text: 'Ein leerer Entwurf mit Betreff, Anrede und Gruß. Enthält Ihre Signatur schon einen Gruß, fehlt der eigene. Sie schreiben den Text dazwischen.' },
            ],
          },
          {
            type: 'p',
            text: 'Liegt ein Entwurf vor, ändern Sie **Betreff** und Text direkt im Feld. Darunter stehen die Knöpfe:',
          },
          {
            type: 'terms',
            items: [
              { term: 'Senden', text: 'Nach einer Rückfrage geht die Antwort sofort hinaus. Ungespeicherte Änderungen speichert MixMarket vorher.' },
              { term: 'Entwurf speichern', text: 'Erscheint, sobald Sie etwas geändert haben, und sichert den Entwurf.' },
              { term: 'Neu schreiben', text: 'Öffnet das Fenster **Antwort neu schreiben lassen**. Unter **Wunsch an die KI** geben Sie freiwillig an, was anders werden soll, etwa kürzer oder mit einem Terminvorschlag. Mit **Neu schreiben** ersetzt die KI den bisherigen Entwurf samt Ihren Änderungen.' },
              { term: 'Verwerfen', text: 'Löscht den Entwurf nach einer Rückfrage. Danach können Sie neu beginnen.' },
            ],
          },
          {
            type: 'list',
            items: [
              'Der Betreff ist Pflicht, der Text braucht mindestens 10 Zeichen. Sonst markiert MixMarket das Feld rot und sendet nicht.',
              'Entwürfe der KI stehen in der Sprache der Antwort, Deutsch oder Englisch, auf Deutsch in der Sie-Form, mit höchstens 120 Wörtern. Anrede und Gruß setzt MixMarket selbst wie im Postausgang. Beim Selbstschreiben gilt die **Sprache der Mails** aus dem Ablauf des Produkts, ohne Produkt Deutsch.',
              'Die KI soll nur Fakten aus Ihrer Produktbeschreibung verwenden und keine Preise, Termine oder Zusagen erfinden. Was sie nicht weiß, soll sie nachzureichen versprechen.',
              'Ist die Adresse gesperrt, steht statt der Knöpfe ein Hinweis mit dem Sperrgrund, und es lässt sich keine Antwort senden.',
              'Schlägt der Versand fehl, steht die Fehlermeldung über dem Entwurf. Mit **Senden** versuchen Sie es erneut.',
              'Ist der Not-Aus aktiv, sendet MixMarket keine Antwort und meldet „Der Versand ist per Not-Aus gestoppt.“ Der Entwurf bleibt zur Freigabe stehen (Übersicht, Not-Aus).',
            ],
          },
          {
            type: 'warning',
            text: 'Die KI kann sich irren. Lesen Sie jeden Entwurf vor dem Senden.',
          },
        ],
      },
      {
        id: 'sending',
        title: 'Wie Antworten verschickt werden',
        blocks: [
          {
            type: 'list',
            items: [
              'Antworten gehen sofort hinaus, ohne Versandfenster und ohne Tageslimit des Postausgangs, und zählen dort nicht mit. Während eines Not-Aus gehen sie nicht hinaus.',
              'Sie gehen als Antwort im selben Verlauf hinaus, an die Adresse des Kontakts, ohne Kontakt an die Absenderadresse der Antwort. Der Betreff ist der Betreff der eingegangenen Mail mit vorangestelltem „Re:“, Sie können ihn ändern.',
              'Die Mail enthält Ihren Text, darunter Ihre **Signatur** und Ihre **Postanschrift (Pflicht im Footer)**, falls eingetragen, und die zitierte Mail des Empfängers. Ein Zählpixel und einen Abmeldelink enthält sie nicht.',
              'Versendet wird mit **Absendername** und **Absenderadresse** Ihres Postfachs.',
              'Nach dem Senden ist die beantwortete Mail erledigt. Sind im Gespräch noch andere Mails offen, schließen Sie sie mit **Erledigt**.',
              'Gesperrte Adressen bekommen keine Antwort, auch nicht über einen schon geschriebenen Entwurf.',
            ],
          },
        ],
      },
      {
        id: 'notices',
        title: 'Hinweise und Testmodus',
        blocks: [
          {
            type: 'list',
            items: [
              'Ist kein Empfang eingerichtet, zeigt die Seite einen Hinweis mit dem Knopf **Postfach einrichten**. Er führt zum Abschnitt **Postfach** der Einstellungen.',
              'Schlägt ein Abruf fehl, steht über der Liste ein Hinweis mit der vollständigen Meldung des Mailservers, ebenfalls mit **Postfach einrichten**. Unter **Aktivitäten** erscheint derselbe Fehler nur einmal, nicht bei jedem Abruf. Auf der Übersicht steht er zusätzlich unter **Wartet auf Sie**.',
              'Ist kein Postausgangsserver eingerichtet, läuft MixMarket im Testmodus. Antworten werden dann nur als gesendet markiert und nicht verschickt.',
              'Ist kein KI-Anbieter gewählt, erscheint ein Hinweis mit dem Knopf **KI einrichten**. Antworten werden dann nicht eingeordnet, und es entstehen keine Entwürfe. **Selbst schreiben** und das Auswahlfeld **Einordnung** funktionieren trotzdem.',
            ],
          },
          {
            type: 'p',
            text: 'Alles, was unter **Gespräche** geschieht, steht unter **Aktivitäten** im Bereich **Gespräche**: eingegangene Antworten, Abwesenheitsnotizen und Rückläufer, die Einordnung der KI und Ihre Änderungen daran, Antwortentwürfe, gesendete Antworten und Fehler beim Abruf.',
          },
        ],
      },
    ],
  },
  {
    id: 'suppression',
    title: 'Sperrliste',
    summary: 'Adressen auf der Sperrliste werden nie wieder angeschrieben, weder von Kampagnen noch von Automatisierungen, aus dem Postausgang oder mit einer Antwort unter Gespräche.',
    sections: [
      {
        id: 'purpose',
        title: 'Wofür die Sperrliste da ist',
        blocks: [
          {
            type: 'p',
            text: 'Die **Sperrliste** ist die zentrale Liste aller Adressen, die keine Mails mehr bekommen dürfen. MixMarket zieht sie bei jedem Versand ab, auch wenn der Kontakt noch in einer Liste steht. Gesperrte Adressen werden auch beim Übernehmen von Interessenten in die Kontakte und beim **Anschreiben** übersprungen. Laufende Abläufe im Postausgang an eine gesperrte Adresse enden sofort. Unter **Gespräche** lässt sich an eine gesperrte Adresse keine Antwort senden.',
          },
          {
            type: 'p',
            text: 'Sie öffnen die **Sperrliste** über das Benutzermenü oben rechts. Auf schmalen Bildschirmen steht sie in der Seitenleiste.',
          },
          {
            type: 'p',
            text: 'Die Tabelle zeigt E-Mail, Grund und Datum. Über die Knöpfe oben filtern Sie nach Grund, das Suchfeld sucht in den Adressen.',
          },
        ],
      },
      {
        id: 'reasons',
        title: 'Gründe',
        blocks: [
          {
            type: 'terms',
            items: [
              { term: 'Abgemeldet', text: 'Der Empfänger hat sich über den Link in einer Mail abgemeldet oder in einer Antwort um keine weiteren Mails gebeten. MixMarket trägt das automatisch ein. Derselbe Grund entsteht, wenn Sie einen Kontakt auf den Status Abgemeldet setzen.' },
              { term: 'Unzustellbar', text: 'Die Adresse ist nicht erreichbar. MixMarket trägt diesen Grund automatisch ein, wenn ein dauerhafter Rückläufer eingeht. Sie vergeben ihn auch selbst beim Sperren oder über den Status Unzustellbar eines Kontakts.' },
              { term: 'Beschwerde', text: 'Der Empfänger hat sich beschwert. Diesen Grund vergeben Sie selbst beim Sperren oder über den Status Beschwerde eines Kontakts.' },
              { term: 'Manuell', text: 'Sie haben die Adresse aus einem anderen Grund gesperrt.' },
            ],
          },
        ],
      },
      {
        id: 'unsubscribe-link',
        title: 'Abmeldung über den Link',
        blocks: [
          {
            type: 'p',
            text: 'Jede Mail aus MixMarket enthält unten einen Abmeldelink, je nach Sprache der Vorlage oder im Postausgang je nach **Sprache der Mails** „Hier abmelden“ oder „Unsubscribe here“. Das gilt für Kampagnen-Mails ebenso wie für Nachfass-Mails aus Automatisierungen und für Mails aus dem Postausgang, nicht aber für Ihre persönlichen Antworten unter **Gespräche**. Zusätzlich bieten viele Mailprogramme einen eigenen Abmeldeknopf an, den MixMarket ebenfalls unterstützt. Die Abmeldung wirkt sofort und ohne weitere Rückfrage:',
          },
          {
            type: 'list',
            items: [
              'Die Adresse kommt mit dem Grund Abgemeldet auf die Sperrliste.',
              'Der Kontakt erhält den Status Abgemeldet.',
              'Seine Interessenten mit dem Status Neu, Kontaktiert oder Im Gespräch springen auf Kein Interesse. Kunden bleiben Kunden.',
              'Laufende Abläufe im Postausgang für diesen Kontakt enden, alle offenen Mails entfallen.',
              'Der Empfänger sieht eine Bestätigungsseite auf Deutsch oder Englisch, je nach Sprache seines Browsers. Eine Bestätigungsmail bekommt er nicht.',
              'Die Abmeldung erscheint unter **Aktivitäten** und als Hinweis unter **Wartet auf Sie** auf der Übersicht. Eine Mail an Sie verschickt MixMarket dafür nicht.',
            ],
          },
        ],
      },
      {
        id: 'from-conversations',
        title: 'Automatische Sperre aus Gespräche',
        blocks: [
          {
            type: 'p',
            text: 'Ist der Empfang (IMAP) eingerichtet, sperrt MixMarket Adressen auch aufgrund eingehender Mails unter **Gespräche**:',
          },
          {
            type: 'list',
            items: [
              'Dauerhafter Rückläufer: Die Adresse kommt mit dem Grund Unzustellbar und der Notiz „Automatisch erkannter Rückläufer“ auf die Sperrliste. Ein aktiver Kontakt erhält den Status Unzustellbar, laufende Abläufe im Postausgang an diese Adresse enden.',
              'Abmeldewunsch per Antwort: Ordnet die KI oder Sie selbst eine Antwort als **Abmeldung** ein, kommt die Adresse mit dem Grund Abgemeldet und der Notiz „Abmeldewunsch per Antwort“ auf die Sperrliste. Der Kontakt erhält den Status Abgemeldet, der Interessent der Antwort den Status Kein Interesse, außer er ist Kunde, und laufende Abläufe im Postausgang an diese Adresse enden.',
            ],
          },
          {
            type: 'p',
            text: 'Steht die Adresse schon auf der Sperrliste, bleibt ihr bisheriger Grund erhalten. Vorübergehende Rückläufer sperren nichts.',
          },
          {
            type: 'p',
            text: 'Beide Fälle erscheinen als Hinweis unter **Wartet auf Sie** auf der Übersicht, ein Abmeldewunsch per Antwort nur, wenn die Adresse dadurch neu gesperrt wurde. Abmeldewünsche per Antwort erkennt die KI nur bei eingeschaltetem Autopilot Antworten. Ist er aus, ordnen Sie solche Antworten selbst als **Abmeldung** ein.',
          },
        ],
      },
      {
        id: 'manual-block',
        title: 'Adresse selbst sperren',
        blocks: [
          {
            type: 'steps',
            items: [
              'Klicken Sie oben rechts auf **Adresse sperren**.',
              'Tragen Sie die **E-Mail** ein und wählen Sie den **Grund**.',
              'Optional halten Sie in **Notiz** fest, warum Sie die Adresse sperren.',
              'Klicken Sie **Speichern**.',
            ],
          },
          {
            type: 'p',
            text: 'Gibt es einen Kontakt mit dieser Adresse, erhält er den passenden Status: Unzustellbar beim Grund Unzustellbar, Beschwerde beim Grund Beschwerde, sonst Abgemeldet. Laufende Abläufe im Postausgang an diese Adresse enden. Die Notiz erscheint nicht in der Tabelle, ist aber über die Suche auffindbar.',
          },
        ],
      },
      {
        id: 'release',
        title: 'Freigeben',
        blocks: [
          {
            type: 'p',
            text: 'Mit **Freigeben** in einer Zeile nehmen Sie eine Adresse nach einer Rückfrage von der Sperrliste. Sie kann danach wieder angeschrieben werden, und ein zugehöriger Kontakt wird wieder aktiv. Ein beendeter Ablauf im Postausgang startet dadurch nicht neu.',
          },
          {
            type: 'warning',
            text: 'Geben Sie eine Adresse nur frei, wenn der Empfänger ausdrücklich wieder Mails von Ihnen möchte. Eine Abmeldung müssen Sie respektieren.',
          },
        ],
      },
    ],
  },
  {
    id: 'activity',
    title: 'Aktivitäten',
    summary: 'Das Aktivitätsprotokoll zeigt, wer wann was getan hat: Sie, MixMarket selbst und die KI.',
    sections: [
      {
        id: 'purpose',
        title: 'Das Protokoll',
        blocks: [
          {
            type: 'p',
            text: 'Sie öffnen **Aktivitäten** über das Benutzermenü oben rechts. Die Einträge sind nach Tagen gruppiert, die neuesten oben. Jede Zeile zeigt Uhrzeit, wer gehandelt hat, was passiert ist, den betroffenen Eintrag und den Bereich.',
          },
          {
            type: 'list',
            items: [
              'Handelnde sind Sie mit dem Namen Ihres Kontos, MixMarket selbst bei automatischen Abläufen wie Versand, Abmeldungen oder Suchen, und KI-Agenten wie die KI-Bewertung, der „KI-Postausgang“, der die Mails im Postausgang schreibt, „KI-Gespräche“, das Antworten einordnet und Antwortentwürfe schreibt, und der „Autopilot“, der Suchen durchleuchten und Zielgruppen bewerten lässt, Interessenten übernimmt und in den Postausgang gibt.',
              'Im Bereich **Anmeldung und Konto** stehen die Ersteinrichtung, Anmeldungen und Abmeldungen, Änderungen an Name und E-Mail, Passwortänderungen, neue Wiederherstellungsschlüssel und das Zurücksetzen des Passworts. Fehlgeschlagene Anmeldungen und Wiederherstellungen erscheinen mit der eingegebenen E-Mail, ebenso eine Sperre nach zu vielen Fehlversuchen. Ein Zurücksetzen am Rechner mit npm run reset-password steht mit MixMarket als Handelndem im Protokoll.',
              'Warnungen und Fehler sind mit einem Warnsymbol markiert.',
              'Beim Versand werden Beginn und Ende einer Kampagne protokolliert, nicht jede einzelne Mail.',
              'Im Bereich **Postausgang** steht dagegen jede einzelne Mail: Entwürfe der KI, Ihre Freigaben, Änderungen und Ablehnungen, der Versand, Fehler und beendete Abläufe, dazu Änderungen an Ablauf und Versandregeln.',
              'Im Bereich **Gespräche** stehen eingegangene Antworten, Abwesenheitsnotizen und Rückläufer, die Einordnung der KI und Ihre Änderungen daran, angeforderte und geschriebene Antwortentwürfe, gesendete Antworten, erledigte und wieder geöffnete Gespräche sowie Fehler beim Abruf des Postfachs. Ein gleichbleibender Abruffehler steht nur einmal im Protokoll.',
              'Im Bereich **Steuerung** stehen Ihre Änderungen an Autopilot und Grenzen mit Vorher und Nachher, jeder Not-Aus, von Hand oder automatisch wegen zu vieler Rückläufer, jede Freigabe des Versands sowie Beginn und Ende einer KI-Pause.',
              'Die Liste aktualisiert sich alle 30 Sekunden. Mit **Ältere laden** holen Sie weitere Einträge.',
            ],
          },
        ],
      },
      {
        id: 'filters',
        title: 'Filter und Suche',
        blocks: [
          {
            type: 'list',
            items: [
              'Das Suchfeld sucht in Namen, Adressen und Personen der Einträge.',
              '**Alle Bereiche** grenzt auf einen Bereich ein, etwa Kampagnen, **Postausgang**, **Gespräche**, **Steuerung**, Postfach oder **Anmeldung und Konto**.',
              '**Alle Handelnden** grenzt auf **Nutzer** (also Sie), **MixMarket (automatisch)** oder **KI-Agenten** ein.',
              'Der Zeitraum reicht von **Heute und gestern** bis **Gesamter Zeitraum**. Voreingestellt ist **Letzte 30 Tage**.',
            ],
          },
        ],
      },
      {
        id: 'details',
        title: 'Einzelheiten',
        blocks: [
          {
            type: 'p',
            text: 'Einträge mit einem Pfeil rechts lassen sich aufklappen. Bei Änderungen zeigt eine Tabelle je **Feld** den Wert **Vorher** und **Nachher**. Bei Fehlern steht die vollständige Meldung des Servers darunter, etwa wenn ein Versand abgebrochen ist.',
          },
          {
            type: 'tip',
            text: 'Passwörter, Wiederherstellungsschlüssel und Zugangsschlüssel erscheinen im Protokoll nie im Klartext. Geänderte Zugangsdaten stehen dort nur als geändert.',
          },
        ],
      },
    ],
  },
  {
    id: 'settings',
    title: 'Einstellungen',
    summary: 'Hier verwalten Sie Ihr Konto und MixMarket Pro, hinterlegen Unternehmensdaten, Postfach, Zugänge der Suchquellen und die KI und wählen Darstellung und Sprache.',
    sections: [
      {
        id: 'account',
        title: 'Konto',
        blocks: [
          {
            type: 'p',
            text: 'Sie öffnen **Einstellungen** über das Benutzermenü oben rechts. Im Abschnitt **Konto** verwalten Sie Ihren Zugang zu MixMarket. Es gibt nur dieses eine Konto.',
          },
          {
            type: 'list',
            items: [
              '**Name** und **E-Mail für die Anmeldung**: Ändern Sie die Angaben und klicken Sie **Konto speichern**. Ändern Sie die E-Mail, erscheint zusätzlich das Feld **Aktuelles Passwort**. Ohne Ihr Passwort speichert MixMarket keine neue E-Mail. Danach melden Sie sich mit der neuen E-Mail an.',
              '**Passwort ändern**: Tragen Sie **Aktuelles Passwort**, **Neues Passwort** mit mindestens 10 Zeichen und **Neues Passwort wiederholen** ein und klicken Sie **Passwort ändern**. Sie bleiben angemeldet. Andere Anmeldungen, etwa in einem zweiten Browser, werden abgemeldet.',
              '**Wiederherstellungsschlüssel**: Der Hinweis darunter zeigt, ob ein Schlüssel hinterlegt ist. **Neuen Schlüssel erzeugen** öffnet ein Fenster. Geben Sie dort Ihr **Aktuelles Passwort** ein und klicken Sie erneut **Neuen Schlüssel erzeugen**. MixMarket zeigt den neuen Schlüssel einmalig an, wie bei der Ersteinrichtung mit **Kopieren**, **Als Datei speichern** und dem Haken **Ich habe den Schlüssel sicher aufbewahrt.** Mit **Fertig** schließen Sie das Fenster.',
            ],
          },
          {
            type: 'warning',
            text: 'Ein neuer Schlüssel macht den bisherigen sofort ungültig. Bewahren Sie danach nur noch den neuen auf.',
          },
          {
            type: 'tip',
            text: 'Erzeugen Sie einen neuen Schlüssel, wenn der alte verloren ist oder jemand anderes ihn gesehen haben könnte. Alle Änderungen am Konto stehen unter **Aktivitäten** im Bereich **Anmeldung und Konto**.',
          },
        ],
      },
      {
        id: 'pro',
        title: 'MixMarket Pro',
        blocks: [
          {
            type: 'p',
            text: 'Im Abschnitt **MixMarket Pro** schließen Sie das Abo ab und schalten Pro frei. Pro bringt geführte Touren, Autopilot, Nachfass-Mails, Automatisierungen, **Alle freigeben**, KI in Gespräche, weitere Suchquellen und Vorlagenpakete. Alles andere bleibt kostenlos. Rechts neben der Überschrift steht der Stand, etwa **Nicht aktiv** oder **Aktiv**.',
          },
          {
            type: 'steps',
            items: [
              'Klicken Sie unter **Abo abschließen** auf **Monatlich** oder **Jährlich**. Über dem Jahresabo steht, wie viel Prozent es gegenüber zwölf Monaten spart. Die Bezahlung öffnet sich bei Stripe in einem neuen Fenster.',
              'Nach der Bezahlung zeigt die Seite Ihren Schlüssel. Ein Klick auf das Kopier-Symbol daneben legt ihn in die Zwischenablage. Er kommt zusätzlich per Mail.',
              'Tragen Sie den Schlüssel unter **Schlüssel** ein und klicken Sie **Freischalten**. Groß- und Kleinschreibung ist egal. Pro steht danach sofort bereit, ohne die Seite neu zu laden.',
            ],
          },
          {
            type: 'p',
            text: 'Ist Pro aktiv, zeigt der Abschnitt **Abo**, **Bezahlt bis** und das Ende des **Schlüssels**. **Abo verwalten** öffnet das Kundenportal von Stripe: Dort kündigen Sie, ändern die Zahlungsart oder sehen Rechnungen. **Schlüssel entfernen** schaltet Pro auf diesem Rechner ab und gibt den Platz frei, das Abo läuft weiter.',
          },
          {
            type: 'list',
            items: [
              'Pro braucht eine Internetverbindung. MixMarket prüft das Abo beim Start und alle sechs Stunden. Fällt die Verbindung aus, läuft Pro höchstens 24 Stunden weiter, der Abschnitt nennt die Uhrzeit. Startet MixMarket ohne Verbindung, bleibt Pro aus, bis die Verbindung zurück ist.',
              'Beide Abos verlängern sich automatisch um einen Monat oder ein Jahr, bis Sie kündigen. Eine Kündigung wirkt zum Ende der Laufzeit, bis dahin läuft Pro weiter. Nach der Kündigung steht im Abschnitt **Endet am** statt **Bezahlt bis**, dazu ein Hinweis. Unter **Abo verwalten** können Sie die Kündigung bis dahin zurücknehmen.',
              'Ist das Abo abgelaufen oder beendet, schaltet Pro beim nächsten Abgleich ab. Ist nur eine Zahlung offen, holen Sie sie unter **Abo verwalten** nach und klicken danach **Jetzt prüfen**. Ein beendetes Abo schließen Sie neu ab und tragen den neuen Schlüssel ein.',
              'Manche Schlüssel gelten ohne Abo. Dann steht unter **Abo** „Freigeschaltet ohne Abo“ und darunter **Gültig bis** mit einem Datum oder „Unbegrenzt“; **Abo verwalten** gibt es dafür nicht.',
              'Ein Schlüssel läuft auf höchstens zwei Rechnern. Für einen dritten entfernen Sie ihn vorher auf einem der beiden.',
            ],
          },
          {
            type: 'tip',
            text: 'Jeder Pro-Hinweis in MixMarket hat einen Knopf **Pro freischalten**, der direkt hierher führt. Freischalten, Entfernen und Abschalten stehen unter **Aktivitäten** im Bereich **Einstellungen**.',
          },
        ],
      },
      {
        id: 'forgot-password',
        title: 'Passwort vergessen',
        blocks: [
          {
            type: 'p',
            text: 'Haben Sie Ihr Passwort vergessen, klicken Sie auf der Anmeldeseite **Passwort vergessen?**. Sie brauchen dafür den Wiederherstellungsschlüssel aus der Ersteinrichtung oder den zuletzt erzeugten.',
          },
          {
            type: 'steps',
            items: [
              'Tragen Sie Ihre **E-Mail** und den **Wiederherstellungsschlüssel** ein. Groß- und Kleinschreibung, Leerzeichen und Striche spielen beim Schlüssel keine Rolle.',
              'Geben Sie unter **Neues Passwort** ein Passwort mit mindestens 10 Zeichen ein und wiederholen Sie es unter **Neues Passwort wiederholen**.',
              'Klicken Sie **Neues Passwort setzen**.',
              'MixMarket zeigt einen neuen **Wiederherstellungsschlüssel**. Der bisherige ist damit verbraucht. Sichern Sie den neuen wie bei der Ersteinrichtung, setzen Sie den Haken **Ich habe den Schlüssel sicher aufbewahrt.** und klicken Sie **Weiter zu MixMarket**. Sie sind dann angemeldet.',
            ],
          },
          {
            type: 'p',
            text: 'Alle anderen Anmeldungen, etwa in einem zweiten Browser, werden dabei abgemeldet. Mit **Zurück zur Anmeldung** kehren Sie ohne Änderung zur Anmeldeseite zurück.',
          },
          {
            type: 'p',
            text: 'Ist auch der Schlüssel verloren, hilft eine Notlösung. Sie ist auf der Seite „Passwort vergessen“ bewusst versteckt: Klicken Sie in der Überschrift **Passwort vergessen** auf das erste „s“ im Wort „vergessen“. Der Mauszeiger ändert sich dort nicht. Danach erscheint der Hinweis **Schlüssel auch verloren?** mit dem Befehl. Merken Sie sich diesen Weg, denn ohne Anmeldung ist dieses Handbuch nicht erreichbar.',
          },
          {
            type: 'steps',
            items: [
              'Öffnen Sie auf dem Rechner, auf dem MixMarket läuft, ein Terminal im MixMarket-Ordner.',
              'Geben Sie npm run reset-password ein und bestätigen Sie mit der Eingabetaste. Im versteckten Hinweis kopiert der Knopf neben dem Befehl ihn in die Zwischenablage.',
              'Geben Sie das neue Passwort mit mindestens 10 Zeichen zweimal ein. Die Eingabe bleibt dabei unsichtbar.',
              'MixMarket zeigt einen neuen Wiederherstellungsschlüssel an. Bewahren Sie ihn sicher auf, der alte gilt nicht mehr.',
              'Melden Sie sich danach im Browser mit dem neuen Passwort an. Bisherige Anmeldungen sind abgemeldet.',
            ],
          },
          {
            type: 'tip',
            text: 'Auf beiden Wegen bleiben Ihre Daten erhalten. Es ändern sich nur Passwort und Schlüssel.',
          },
          {
            type: 'warning',
            text: 'Nach 5 Fehlversuchen innerhalb von 15 Minuten ist die Anmeldung von dieser Netzwerkadresse aus für 5 Minuten gesperrt. Das gilt ebenso für falsche Schlüssel unter **Passwort vergessen?**. MixMarket nennt in der Meldung, wann Sie es erneut versuchen können. Das Konto selbst sperrt MixMarket nicht. Gab es für dasselbe Konto innerhalb von 15 Minuten 5 Fehlversuche, gleich von wo, antwortet MixMarket auf jeden weiteren Versuch verzögert, mit jedem weiteren Fehlversuch 2 Sekunden später, höchstens nach 10 Sekunden.',
          },
        ],
      },
      {
        id: 'company',
        title: 'Unternehmen',
        blocks: [
          {
            type: 'p',
            text: 'Im Abschnitt **Unternehmen** der **Einstellungen** stehen Ihre Angaben für den Versand.',
          },
          {
            type: 'list',
            items: [
              '**Unternehmensname**: Ihr Firmenname.',
              '**Postanschrift (Pflicht im Footer)**: erscheint im Footer jeder versendeten Mail. Zeilenumbrüche bleiben dabei erhalten. Fehlt sie, warnt MixMarket vor Versand und Planung.',
              '**Signatur**: steht in jeder Kampagnen- und Nachfass-Mail unter dem Inhalt der Vorlage, in jeder Mail aus dem Postausgang und in jeder Antwort aus **Gespräche** unter dem Text. Normaler Text mit Name, Funktion und Kontaktdaten genügt, Zeilenumbrüche bleiben erhalten. HTML ist ebenfalls möglich. Links darin werden in Kampagnen, Nachfass-Mails und im Postausgang wie im Inhalt gezählt. Ist keine Signatur eingetragen, setzen Postausgang und Gespräche Ihren Absendernamen aus dem Postfach unter den Gruß, ersatzweise den Unternehmensnamen. Steht in der Signatur schon ein Gruß wie „Viele Grüße“, „Mit freundlichen Grüßen“ oder „Best regards“, setzen Postausgang und Gespräche keinen eigenen Gruß darüber, damit er nicht doppelt erscheint.',
              '**Abmelde-Hinweis Deutsch**: Satz vor dem Link „Hier abmelden“ im Footer von Mails aus Vorlagen mit der Sprache Deutsch und von Mails aus dem Postausgang mit der Sprache Deutsch. Ist das Feld leer, steht dort „Sie möchten keine weiteren E-Mails von uns erhalten?“.',
              '**Abmelde-Hinweis Englisch**: Satz vor dem Link „Unsubscribe here“ im Footer von Mails aus Vorlagen mit der Sprache Englisch und von Mails aus dem Postausgang mit der Sprache Englisch. Ist das Feld leer, steht dort „You no longer wish to receive emails from us?“.',
            ],
          },
          {
            type: 'p',
            text: 'Klicken Sie **Speichern**, um die Angaben zu sichern. MixMarket bestätigt das mit „Unternehmensdaten gespeichert“.',
          },
        ],
      },
      {
        id: 'mailbox',
        title: 'Postfach',
        blocks: [
          {
            type: 'p',
            text: 'Über das Postfach verschickt MixMarket Ihre Mails, und über den Empfang liest es die Antworten für **Gespräche**. Die Zugangsdaten finden Sie bei Ihrem E-Mail-Anbieter. Passwörter werden verschlüsselt gespeichert und nie angezeigt.',
          },
          {
            type: 'p',
            text: 'Oben rechts im Abschnitt zeigt eine Marke, woher der Versand seine Daten nimmt:',
          },
          {
            type: 'terms',
            items: [
              { term: 'Eigenes Postfach eingetragen', text: 'Der Versand nutzt die Daten aus diesem Abschnitt.' },
              { term: 'Versand über Server-Datei', text: 'Der Versand nutzt die Werte aus der Datei .env auf dem Server. Sobald Sie hier einen Server eintragen, gelten Ihre Angaben.' },
              { term: 'Testmodus', text: 'Es ist kein Postfach eingetragen. MixMarket verschickt keine echten Mails.' },
              { term: 'Passwort nicht lesbar, bitte neu eingeben', text: 'Ein gespeichertes Passwort lässt sich nicht mehr entschlüsseln. Tragen Sie es neu ein.' },
            ],
          },
        ],
      },
      {
        id: 'smtp',
        title: 'Versand (SMTP)',
        blocks: [
          {
            type: 'p',
            text: 'SMTP ist das Verfahren, über das Mails verschickt werden. Hier tragen Sie den Postausgangsserver Ihres Anbieters ein.',
          },
          {
            type: 'list',
            items: [
              '**Absendername** und **Absenderadresse**: Absender des Postfachs. Neue Kampagnen übernehmen beide als Vorschlag. Versendet wird mit dem Absender, der in der Kampagne oder Automatisierung steht. Der Postausgang versendet immer mit dem Absender des Postfachs. Ist hier keine Absenderadresse eingetragen, nimmt MixMarket den Benutzernamen, wenn er eine E-Mail-Adresse ist.',
              '**Server**: Name des Postausgangsservers, zum Beispiel smtp.firma.de.',
              '**Verschlüsselung**: **SSL/TLS** oder **STARTTLS**. Beim Wechsel setzt MixMarket den üblichen Port ein, 465 für SSL/TLS und 587 für STARTTLS, solange Sie keinen eigenen Port eingetragen haben.',
              '**Port**: bleibt er leer, gilt der übliche Port.',
              '**Benutzername** und **Passwort**: Ihre Anmeldung beim Anbieter. Ein leeres Passwortfeld lässt das gespeicherte Passwort unverändert. Mit dem Augensymbol zeigen Sie die Eingabe an.',
            ],
          },
          {
            type: 'tip',
            text: 'Unter **Absendername** und **Absenderadresse** steht ein Tipp zur Absender-Domain: Nutzen Sie für die Erstansprache nicht die Hauptdomain Ihrer Firma, sondern eine eigene Absender-Domain, am sichersten eine Zweitdomain, sonst eine Subdomain. Richten Sie dafür SPF, DKIM und DMARC ein und senden Sie anfangs nur wenige Mails pro Tag. So bleibt Ihre normale Geschäftspost unberührt, falls Spamfilter anschlagen.',
          },
          {
            type: 'warning',
            text: 'Ohne Absenderadresse und ohne Benutzernamen in Form einer E-Mail-Adresse kann MixMarket den Zugang nicht nutzen und bleibt im Testmodus.',
          },
        ],
      },
      {
        id: 'imap',
        title: 'Empfang (IMAP)',
        blocks: [
          {
            type: 'p',
            text: 'IMAP ist das Verfahren, über das Mails aus einem Postfach gelesen werden. Hier tragen Sie den Posteingangsserver Ihres Anbieters ein.',
          },
          {
            type: 'list',
            items: [
              '**Server**, **Verschlüsselung** und **Port** wie beim Versand. Übliche Ports sind 993 für SSL/TLS und 143 für STARTTLS.',
              '**Gleiche Anmeldung wie beim Versand**: Ist der Haken gesetzt, nutzt MixMarket Benutzername und Passwort des Versands. Sonst tragen Sie eine eigene Anmeldung ein.',
              '**Ordner für Antworten**: meist INBOX. Nach einem erfolgreichen Test wählen Sie aus den vorhandenen Ordnern.',
            ],
          },
          {
            type: 'p',
            text: 'MixMarket ruft den **Ordner für Antworten** etwa alle 2 Minuten ab und legt Antworten, Abwesenheitsnotizen und Rückläufer unter **Gespräche** ab (Gespräche). Es öffnet das Postfach dabei nur lesend: Mails bleiben ungelesen und unverändert, MixMarket verschiebt und löscht nichts.',
          },
        ],
      },
      {
        id: 'mailbox-test',
        title: 'Verbindung testen und speichern',
        blocks: [
          {
            type: 'steps',
            items: [
              'Klicken Sie unter Versand oder Empfang auf **Verbindung testen**. Ungespeicherte Änderungen werden dabei zuerst gespeichert.',
              'Beim Versand meldet sich MixMarket nur am Server an, es wird keine Mail verschickt. Beim Empfang öffnet es den Ordner und zählt die Nachrichten.',
              'Das Ergebnis erscheint unter den Feldern. Bei einem Fehler steht dort die Ursache und die vollständige Meldung des Mailservers.',
              'Klicken Sie **Postfach speichern**, um Ihre Angaben zu sichern.',
            ],
          },
          {
            type: 'tip',
            text: 'Wird die Anmeldung abgelehnt, verlangt Ihr Anbieter oft ein eigenes App-Passwort. Passt die Verschlüsselung nicht zum Port, gehört SSL/TLS meist zu Port 465 oder 993 und STARTTLS zu Port 587 oder 143.',
          },
          {
            type: 'p',
            text: '**Zugang entfernen** löscht nach einer Rückfrage den Versand oder Empfangszugang. Ohne Versandzugang verschickt MixMarket keine echten Mails mehr, ohne Empfangszugang liest es keine Antworten mehr.',
          },
        ],
      },
      {
        id: 'provider-access',
        title: 'Recherche-Zugänge',
        blocks: [
          {
            type: 'tip',
            text: 'Die Zugänge zu DataForSEO und Serper gehören zu MixMarket Pro.',
          },
          {
            type: 'p',
            text: 'Für die Suchquellen DataForSEO und Serper brauchen Sie ein eigenes Konto beim Anbieter. OpenStreetMap braucht keinen Zugang. Passwort und Schlüssel werden verschlüsselt gespeichert und nicht wieder angezeigt. Ein leeres Feld lässt den gespeicherten Wert unverändert.',
          },
          {
            type: 'list',
            items: [
              'DataForSEO: Tragen Sie **API-Login** und **API-Passwort** ein. Das API-Passwort steht bei DataForSEO unter API Access und ist nicht Ihr Kontopasswort. Ein Zugang gilt für Branchenverzeichnis und Google-Suche.',
              'Der Haken **Testumgebung (Sandbox) verwenden: Beispieldaten, kostet nichts** liefert Beispieldaten und kostet nichts. Für echte Suchen entfernen Sie ihn.',
              '**Zugang prüfen** testet den DataForSEO-Zugang kostenlos und zeigt Ihr Guthaben.',
              'Serper: Tragen Sie den **API-Schlüssel** ein. **Schlüssel prüfen (verbraucht 1 Abfrage)** testet ihn.',
              '**Konto anlegen** öffnet die Seite des Anbieters, **Zugang entfernen** löscht einen Zugang nach einer Rückfrage.',
              '**Kostenobergrenze je Suche**: Suchen, deren geschätzte Kosten darüber liegen, werden nicht gestartet. Erlaubt sind 0 bis 100 USD, voreingestellt ist 1 USD.',
            ],
          },
          {
            type: 'p',
            text: 'Klicken Sie **Zugänge speichern**. Prüfen Sie den Zugang erst danach, denn der Test nutzt die gespeicherten Daten.',
          },
        ],
      },
      {
        id: 'ai',
        title: 'KI-Bewertung',
        blocks: [
          {
            type: 'p',
            text: 'Die KI nutzt Ihr bestehendes Abo über ein Programm, das auf dem Rechner mit MixMarket installiert und angemeldet ist. Ein API-Schlüssel ist nicht nötig.',
          },
          {
            type: 'steps',
            items: [
              'Wählen Sie unter **Abo** entweder **Claude-Abo** oder **ChatGPT-Abo**. Für das Claude-Abo muss Claude Code installiert und angemeldet sein, für das ChatGPT-Abo Codex.',
              'Wählen Sie unter **Modell** das Modell aus der Liste. Voreingestellt ist **Standard des Abos**. Welches Modell das ist, bestimmt Ihr Abo, MixMarket kann es nicht auslesen. Ihre eigenen Einstellungen in Claude Code oder Codex gelten hier nicht. Für E-Mails reicht meist ein kleineres Modell, das schneller ist und Ihr Abo weniger beansprucht. Beim Claude-Abo stehen zusätzlich **Opus**, **Sonnet** und **Haiku** zur Wahl, beim ChatGPT-Abo die Modelle, die Codex für Ihr angemeldetes Abo kennt. Findet MixMarket diese Liste nicht, steht dort nur der Standard. Wechseln Sie das Abo, springt das Modell auf **Standard des Abos** zurück. Ein früher von Hand eingetragener Modellname bleibt wählbar.',
              'Klicken Sie **Verbindung prüfen**.',
              'Klicken Sie **KI-Einstellungen speichern**. Erst danach lässt sich eine Bewertung starten.',
            ],
          },
          {
            type: 'p',
            text: 'Dieselbe KI schreibt auch die Mails im **Postausgang**, ordnet unter **Gespräche** die Antworten ein und schreibt dort Antwortentwürfe. Ohne gespeicherten Anbieter legt der Postausgang keine Mails an, und Antworten werden nicht eingeordnet.',
          },
          {
            type: 'p',
            text: 'Wie stark das gewählte Abo ausgelastet ist und ab welcher Auslastung die KI pausiert, sehen und steuern Sie auf der **Übersicht** (Übersicht, Auslastung und KI-Pause).',
          },
          {
            type: 'p',
            text: 'Was Sie verkaufen und wer Ihr idealer Kunde ist, pflegen Sie je Produkt in der Recherche unter **Produkte verwalten**. Der Link **Zur Recherche** führt dorthin.',
          },
          {
            type: 'tip',
            text: 'Die KI bekommt keine Werkzeuge und kann nichts auf dem Rechner ausführen.',
          },
        ],
      },
      {
        id: 'appearance-language',
        title: 'Darstellung und Sprache',
        blocks: [
          {
            type: 'list',
            items: [
              '**Erscheinungsbild**: **Dunkel** oder **Hell**. Die Änderung wirkt sofort.',
              '**Sprache**: DE für Deutsch oder EN für Englisch. Die Änderung wirkt sofort.',
            ],
          },
          {
            type: 'p',
            text: 'Beides können Sie auch jederzeit in der Kopfleiste umschalten. MixMarket merkt sich Ihre Wahl in diesem Browser. Die Sprache der Oberfläche hat keinen Einfluss auf Ihre Mails. Deren Sprache legen Sie je Vorlage unter **Sprache der Mail** fest, im Postausgang je Produkt unter **Sprache der Mails**.',
          },
        ],
      },
      {
        id: 'updates',
        title: 'Updates',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket sieht einmal am Tag auf GitHub nach, ob es eine neuere Version gibt. Dabei liest es nur die öffentliche Versionsnummer und die Liste der Änderungen, es überträgt nichts von Ihnen. Gibt es eine neue Version, erscheint ein kleiner pulsierender Punkt an Ihren Initialen oben rechts, und im Benutzermenü steht **Update verfügbar**.',
          },
          {
            type: 'list',
            items: [
              '**Update verfügbar** öffnet ein Fenster mit der neuen Versionsnummer, unter **Was ist neu** den Änderungen seit Ihrer Version und unter **So aktualisieren Sie** den Schritten zum Aktualisieren. Die Befehle kopieren Sie mit dem Kopiersymbol daneben.',
              '**Nach Updates suchen** fragt sofort bei GitHub nach. Ist Ihre Version aktuell, steht dort **Sie nutzen die neueste Version.** mit dem Zeitpunkt der letzten Prüfung und dem Knopf **Erneut prüfen**.',
              'Ist GitHub nicht erreichbar, etwa ohne Internetverbindung, sagt MixMarket das im Fenster. Ihre Arbeit läuft davon unberührt weiter.',
            ],
          },
          {
            type: 'tip',
            text: 'MixMarket aktualisiert sich nie von selbst. Sie entscheiden, wann Sie die Befehle ausführen. Ihre Daten und Einstellungen bleiben dabei erhalten.',
          },
        ],
      },
    ],
  },
  {
    id: 'search',
    title: 'Suche',
    summary: 'Die Suche durchsucht alle Bereiche von MixMarket auf einmal und springt direkt zum gefundenen Eintrag.',
    sections: [
      {
        id: 'open',
        title: 'Suche öffnen',
        blocks: [
          {
            type: 'p',
            text: 'Klicken Sie in der Kopfleiste auf **Suchen** oder drücken Sie Cmd K auf dem Mac beziehungsweise Strg K unter Windows und Linux. Der Knopf **Suchen** zeigt die Tastenkombination für Ihr Gerät an. Dieselbe Tastenkombination oder Esc schließt die Suche wieder.',
          },
          {
            type: 'p',
            text: 'Ohne Eingabe zeigt die Suche alle Seiten von MixMarket zum schnellen Springen. Tippen Sie, werden die Seiten nach ihrem Namen gefiltert. Ab zwei Zeichen durchsucht MixMarket zusätzlich alle Bereiche.',
          },
        ],
      },
      {
        id: 'what-is-searched',
        title: 'Was durchsucht wird',
        blocks: [
          {
            type: 'p',
            text: 'Groß und Kleinschreibung und Leerzeichen spielen keine Rolle. Durchsucht werden:',
          },
          {
            type: 'list',
            items: [
              'Kontakte: Name, E-Mail, Firma, Position, Branche, Webseite, Land und Notiz.',
              'Firmen: Name, Webseite, E-Mail, Telefon, Adresse, Kategorie, Ansprechpartner, Ansatzpunkt und Begründung der KI sowie der Text der Webseite.',
              'Interessenten: Firma, Ansprechpartner und Notiz.',
              'Postausgang: Firma, Betreff, Empfängeradresse und Text der Mails.',
              'Gespräche: Name und Adresse des Absenders, Betreff und Text eingegangener Mails, auch von Rückläufern und Abwesenheitsnotizen.',
              'Produkte: Name, Webseite, Beschreibung und idealer Kunde.',
              'Listen und Zielgruppen: Name und Beschreibung.',
              'Vorlagen: Name, Betreff, Inhalt und Textfassung.',
              'Kampagnen und Automatisierungen: Name, Betreff und Absender.',
              'Firmensuchen: Suchbegriff und Ort.',
              'Webseiten-Aufträge: Name.',
              'Sperrliste: E-Mail und Notiz.',
              'Handbuch: Titel und Text aller Abschnitte. Ein Klick auf einen Treffer öffnet das Handbuch an genau dieser Stelle.',
            ],
          },
        ],
      },
      {
        id: 'areas',
        title: 'Bereiche und Trefferzahl',
        blocks: [
          {
            type: 'p',
            text: 'Unter dem Eingabefeld zeigt **Gefunden in** die Bereiche mit Treffern und ihre Anzahl. **Alle** zeigt die Treffer aller Bereiche, ein Klick auf einen Bereich zeigt nur dessen Treffer.',
          },
          {
            type: 'list',
            items: [
              'Jeder Treffer zeigt Titel, Untertitel und die Fundstelle mit dem Feld, in dem der Begriff vorkommt. Der Begriff ist hervorgehoben.',
              'Je Bereich erscheinen zunächst bis zu fünf Treffer. Gibt es mehr, öffnet der Eintrag am Ende des Bereichs die weiteren Treffer dieses Bereichs.',
              'Esc in einem gewählten Bereich führt zurück zu allen Bereichen.',
            ],
          },
        ],
      },
      {
        id: 'jump',
        title: 'Zum Eintrag springen',
        blocks: [
          {
            type: 'p',
            text: 'Mit den Pfeiltasten wählen Sie einen Eintrag, mit Enter oder einem Klick öffnen Sie ihn. MixMarket öffnet die passende Seite und den Eintrag selbst:',
          },
          {
            type: 'list',
            items: [
              'Kontakte, Listen, Vorlagen und Automatisierungen öffnen sich zum Bearbeiten.',
              'Entwürfe und ältere abgebrochene Kampagnen öffnen sich zum Bearbeiten, andere Kampagnen werden in der Liste hervorgehoben.',
              'Firmen öffnen sich in der Detailansicht, Firmensuchen mit der Liste ihrer Firmen.',
              'Zielgruppen, Interessenten und Produkte öffnen sich in der Recherche, das passende Produkt wird dabei gewählt.',
              'Mails des Postausgangs öffnen sich im passenden Reiter, die Auswahl der Produkte steht dann auf **Alle Produkte**. Auf schmalen Bildschirmen öffnet sich die Mail im Fenster.',
              'Gespräche öffnen sich unter **Gespräche** in der Ansicht **Alle** mit dem gefundenen Gespräch, auf schmalen Bildschirmen im Fenster.',
              'Webseiten-Aufträge öffnen ihre Ergebnisse, Einträge der Sperrliste werden hervorgehoben.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'legal',
    title: 'Recht und Zustellbarkeit',
    summary: 'Was Sie rechtlich beachten sollten und wie MixMarket Pflichtangaben, Abmeldung, Schutz der Anmeldung und Testmodus umsetzt.',
    sections: [
      {
        id: 'disclaimer',
        title: 'Vorab',
        blocks: [
          {
            type: 'warning',
            text: 'Dieses Kapitel ist keine Rechtsberatung. Es beschreibt, wie MixMarket arbeitet, und nennt Punkte, die Sie prüfen sollten. Ob eine Ansprache in Ihrem Fall zulässig ist, klären Sie bitte selbst oder mit einer Rechtsberatung.',
          },
        ],
      },
      {
        id: 'consent',
        title: 'Einwilligung',
        blocks: [
          {
            type: 'p',
            text: 'In Deutschland ist Werbung per E-Mail nach UWG § 7 ohne vorherige ausdrückliche Einwilligung des Empfängers in der Regel unzulässig, auch gegenüber Unternehmen. Es gibt nur enge Ausnahmen, etwa unter bestimmten Bedingungen bei eigenen Bestandskunden. Dazu kommen die Regeln des Datenschutzes für die Daten Ihrer Kontakte.',
          },
          {
            type: 'p',
            text: 'Mit dem Haken **Einwilligung dokumentiert** halten Sie am Kontakt fest, dass Ihnen eine Einwilligung vorliegt. MixMarket speichert nur diese Angabe, nicht den Nachweis selbst. Bewahren Sie den Nachweis gesondert auf.',
          },
        ],
      },
      {
        id: 'research-without-consent',
        title: 'Kontakte aus der Recherche',
        blocks: [
          {
            type: 'p',
            text: 'Firmen aus der Recherche haben Ihnen keine Einwilligung gegeben. Übernehmen Sie Interessenten in die Kontakte, erhalten diese die Herkunft „Recherche“ und keine Einwilligung.',
          },
          {
            type: 'p',
            text: 'Bevor Sie eine Kampagne versenden oder planen, prüft MixMarket die Empfänger. Haben Empfänger keine dokumentierte Einwilligung, nennt der Hinweis ihre Zahl und wie viele davon aus der Recherche stammen. Der Versand bleibt möglich, die Entscheidung und die Verantwortung liegen bei Ihnen.',
          },
          {
            type: 'p',
            text: 'Diese Warnungen gelten auch für den Postausgang. MixMarket warnt dort beim **Anschreiben**, über der Liste im Reiter **Zur Freigabe** und bei **Alle freigeben**, und jede betroffene Mail trägt die Kennzeichnung **Ohne Einwilligung**. Auch hier entscheiden Sie selbst, ob Sie eine Mail freigeben.',
          },
          {
            type: 'warning',
            text: 'Der Hinweis zählt alle Empfänger ohne den Haken **Einwilligung dokumentiert**, also auch Kontakte aus **Webseiten auslesen**, aus dem Import oder von Hand angelegte. Werbung per E-Mail ohne Einwilligung kann nach UWG § 7 unzulässig sein.',
          },
          {
            type: 'warning',
            text: 'Der Autopilot Schreiben legt Mails an Firmen aus der Recherche an, also an Empfänger ohne dokumentierte Einwilligung, ohne dass Sie jede Firma einzeln auswählen. Am Risiko nach UWG § 7 ändert das nichts. Lassen Sie im **Ablauf** des Produkts **Jede Mail vor dem Versand freigeben** gesetzt und prüfen Sie jede Mail (Übersicht, Autopilot).',
          },
          {
            type: 'tip',
            text: 'Die Recherche lässt sich auch ohne Mailversand nutzen: Die Interessentenliste zeigt Telefon und Ansatzpunkt, zum Beispiel für einen Anruf.',
          },
        ],
      },
      {
        id: 'footer',
        title: 'Pflichtangaben im Footer',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket hängt an jede Mail aus Kampagnen, Automatisierungen und dem Postausgang einen Footer an. Er enthält Ihre **Postanschrift (Pflicht im Footer)** aus den Einstellungen mit ihren Zeilenumbrüchen sowie Abmelde-Hinweis und Abmeldelink in der Sprache der Vorlage, im Postausgang in der **Sprache der Mails** des Ablaufs: den **Abmelde-Hinweis Deutsch** mit dem Link „Hier abmelden“ oder den **Abmelde-Hinweis Englisch** mit dem Link „Unsubscribe here“. Darüber steht Ihre **Signatur**, falls eingetragen.',
          },
          {
            type: 'p',
            text: 'Ihre persönlichen Antworten unter **Gespräche** haben keinen solchen Footer. Sie enthalten Ihre Signatur und Ihre Postanschrift, falls eingetragen, aber keinen Abmeldelink.',
          },
          {
            type: 'warning',
            text: 'Ist keine Postanschrift eingetragen, fehlt sie im Footer. MixMarket weist Sie vor Versand und Planung darauf hin, verhindert den Versand aber nicht. Tragen Sie die Anschrift vor dem ersten Versand ein. Welche weiteren Angaben Ihre geschäftlichen Mails enthalten müssen, etwa nach Handelsrecht, prüfen Sie bitte selbst.',
          },
        ],
      },
      {
        id: 'unsubscribe',
        title: 'Abmeldung',
        blocks: [
          {
            type: 'p',
            text: 'Jede Mail aus Kampagnen, Automatisierungen und dem Postausgang enthält einen Abmelde-Link, auch jede Nachfass-Mail. Ausgenommen sind Ihre persönlichen Antworten unter **Gespräche**. Zusätzlich sendet MixMarket eine technische Abmeldeangabe mit, damit Mailprogramme einen eigenen Abmeldeknopf anzeigen können. Eine Abmeldung wirkt sofort: Die Adresse kommt auf die Sperrliste, der Kontakt wird abgemeldet, offene Interessenten springen auf Kein Interesse.',
          },
          {
            type: 'p',
            text: 'Gesperrte Adressen bekommen keine Kampagnen, keine Nachfass-Mails, keine Mails aus dem Postausgang und keine Antworten aus **Gespräche** mehr, laufende Abläufe im Postausgang enden.',
          },
          {
            type: 'p',
            text: 'Bittet ein Empfänger in einer Antwort um keine weiteren Mails oder um die Löschung seiner Daten, ordnet die KI die Antwort unter **Gespräche** als **Abmeldung** ein, solange der Autopilot Antworten eingeschaltet ist. MixMarket setzt die Adresse dann wie bei einer Abmeldung über den Link auf die Sperrliste, und der Kontakt wird abgemeldet (Gespräche, Einordnung durch die KI). Ohne KI, bei ausgeschaltetem Autopilot Antworten oder bei falscher Einordnung wählen Sie unter **Einordnung** selbst **Abmeldung**. Abmeldungen auf anderem Weg, etwa per Telefon, tragen Sie selbst mit **Adresse sperren** in die Sperrliste ein.',
          },
          {
            type: 'p',
            text: 'Jede Abmeldung über den Link und jede neue Sperre wegen eines Abmeldewunschs per Antwort erscheint als Hinweis unter **Wartet auf Sie** auf der Übersicht. Eine Mail an Sie verschickt MixMarket dafür nicht.',
          },
          {
            type: 'warning',
            text: 'Die Einordnung der KI kann sich irren. Prüfen Sie Antworten unter **Gespräche** regelmäßig, damit kein Abmeldewunsch übersehen wird. Eine Löschung der Daten setzt MixMarket nicht selbst um, sie bleibt Ihre Aufgabe.',
          },
        ],
      },
      {
        id: 'tracking',
        title: 'Öffnungen und Klicks',
        blocks: [
          {
            type: 'p',
            text: 'Um Öffnungen zu zählen, enthält jede Mail aus Kampagnen, Automatisierungen und dem Postausgang ein unsichtbares Bild. Links werden über MixMarket umgeleitet, um Klicks zu zählen. Dabei werden Zeitpunkt, IP-Adresse und Browserkennung des Empfängers gespeichert. Bei Antworten unter **Gespräche** zählt MixMarket weder Öffnungen noch Klicks.',
          },
          {
            type: 'p',
            text: 'Die umgeleiteten Links sind signiert. Direkt öffnet sich nur ein Ziel, das MixMarket selbst in die Mail geschrieben hat. Ist ein Link verändert oder nicht signiert, etwa in Mails, die vor Version 0.14.1 verschickt wurden, zeigt MixMarket eine kurze Zwischenseite „Sie öffnen eine externe Seite“ mit dem Ziel zum Weiterklicken, je nach Browser des Empfängers auf Deutsch oder Englisch. Ein solcher Aufruf zählt nicht als Klick.',
          },
          {
            type: 'p',
            text: 'Wiederholte Öffnungen derselben Mail innerhalb einer Stunde speichert MixMarket nur einmal, wiederholte Klicks auf denselben Link innerhalb einer Minute ebenso.',
          },
          {
            type: 'tip',
            text: 'Prüfen Sie, ob und wie Sie Ihre Empfänger darüber informieren müssen, zum Beispiel in Ihrer Datenschutzerklärung.',
          },
        ],
      },
      {
        id: 'sign-in-protection',
        title: 'Schutz der Anmeldung',
        blocks: [
          {
            type: 'p',
            text: 'In MixMarket liegen personenbezogene Daten Ihrer Kontakte. Den Zugang dazu schützt MixMarket so:',
          },
          {
            type: 'list',
            items: [
              'Es gibt genau ein Konto. Sein Passwort braucht mindestens 10 Zeichen. Passwort und Wiederherstellungsschlüssel werden nicht im Klartext gespeichert.',
              'Nach 5 Fehlversuchen innerhalb von 15 Minuten ist die Anmeldung von dieser Netzwerkadresse aus für 5 Minuten gesperrt, ebenso **Passwort vergessen?** nach 5 falschen Schlüsseln.',
              'Das Konto selbst wird nicht gesperrt, damit niemand Sie absichtlich aussperren kann. Nach 5 Fehlversuchen für das Konto innerhalb von 15 Minuten, gleich von wo, antwortet MixMarket auf jeden weiteren Versuch verzögert, bis zu 10 Sekunden.',
              'Nach einer Passwortänderung oder einem Zurücksetzen gelten andere Anmeldungen nicht mehr. **Abmelden** beendet alle Anmeldungen auf allen Geräten.',
              'Anmeldungen, Fehlversuche, Sperren und Änderungen am Konto stehen im Aktivitätsprotokoll.',
            ],
          },
          {
            type: 'tip',
            text: 'Verwenden Sie ein Passwort, das Sie nirgends sonst nutzen, und bewahren Sie den Wiederherstellungsschlüssel getrennt vom Rechner auf.',
          },
        ],
      },
      {
        id: 'test-mode',
        title: 'Testmodus',
        blocks: [
          {
            type: 'p',
            text: 'Solange kein Postfach eingetragen ist, läuft MixMarket im Testmodus. Kampagnen, Automatisierungen, der Postausgang und Antworten unter **Gespräche** laufen ganz normal durch und zählen als versendet, die Mails werden aber nur im Protokoll des Servers vermerkt und nicht verschickt.',
          },
          {
            type: 'tip',
            text: 'Nutzen Sie den Testmodus, um Abläufe auszuprobieren. Testen Sie danach mit eingetragenem Postfach eine Kampagne an eine Liste, die nur Ihre eigene Adresse enthält, und prüfen Sie Anrede, Ansatzpunkt, Links und Footer in der echten Mail.',
          },
          {
            type: 'warning',
            text: 'Im Testmodus gelten Mails als versendet. Eine Kampagne lässt sich danach nicht noch einmal an dieselben Empfänger schicken, und aktive Automatisierungen merken Empfänger bereits vor. Legen Sie für den echten Versand neue Kampagnen an. Ein Interessent, dem der Postausgang im Testmodus geschrieben hat, lässt sich dort nicht erneut anschreiben.',
          },
        ],
      },
      {
        id: 'deliverability',
        title: 'Zustellbarkeit',
        blocks: [
          {
            type: 'p',
            text: 'Damit Ihre Mails ankommen und nicht im Spam landen, legt MixMarket eine kurze Pause zwischen zwei Mails ein und schickt zu jeder Mail eine automatisch erzeugte reine Textfassung mit. Einiges liegt bei Ihnen:',
          },
          {
            type: 'list',
            items: [
              'Verwenden Sie als Absenderadresse in Kampagnen die Adresse des eingetragenen Postfachs. Fremde Absenderadressen werden von vielen Anbietern abgelehnt oder als Spam eingestuft.',
              'Schreiben Sie wenige, gut passende Empfänger an statt vieler unpassender. Die Passung der KI hilft bei der Auswahl.',
              'Achten Sie auf ein ausgewogenes Verhältnis von Text und Links und verzichten Sie auf reißerische Betreffzeilen.',
              'Im Postausgang steuern Sie mit den **Versandregeln**, an welchen Tagen, zu welchen Uhrzeiten, wie viele und in welchem Abstand Mails hinausgehen.',
              'Wie viele Mails einer Kampagne fehlschlugen und die erste Fehlermeldung sehen Sie unter **Aktivitäten**. Dauerhaft unzustellbare Adressen sperrt MixMarket selbst, sobald ein Rückläufer eingeht und der Empfang (IMAP) eingerichtet ist (Gespräche, Rückläufer). Ohne Empfang sperren Sie solche Adressen selbst mit dem Grund Unzustellbar.',
              'Häufen sich dauerhafte Rückläufer, löst MixMarket den automatischen Not-Aus aus und stoppt jeden Versand, bis Sie ihn freigeben. Die Grenze stellen Sie auf der Übersicht unter **Not-Aus bei Rückläufern ab** ein (Übersicht, Not-Aus).',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'glossary',
    title: 'Begriffe',
    summary: 'Kurze Erklärungen der wichtigsten Begriffe in MixMarket.',
    sections: [
      {
        id: 'terms',
        title: 'Begriffe von A bis Z',
        blocks: [
          {
            type: 'terms',
            items: [
              { term: 'Ablauf', text: 'Folge aus Erstmail und bis zu drei Nachfass-Mails, die der Postausgang an einen Interessenten schickt. Je Produkt unter Ablauf eingestellt.' },
              { term: 'Abwesenheitsnotiz', text: 'Automatische Antwort wie eine Urlaubs- oder Abwesenheitsmeldung. MixMarket erkennt sie unter Gespräche, sie beendet keinen Ablauf im Postausgang.' },
              { term: 'Aktivitätsprotokoll', text: 'Liste aller Vorgänge in MixMarket mit Zeitpunkt und Handelndem, erreichbar über Aktivitäten im Benutzermenü.' },
              { term: 'Ansatzpunkt', text: 'Ein bis zwei Sätze der KI für die erste persönliche Ansprache einer Firma, passend zum Produkt. In Vorlagen über den Platzhalter {{ansatz}} einsetzbar.' },
              { term: 'Auslastung', text: 'Wie stark ein KI-Abo in 5 Stunden und in der Woche ausgelastet ist, in Prozent. Die Übersicht zeigt sie für Claude-Abo und ChatGPT-Abo, dazu KI-Aufrufe, Versand und Rückläufer.' },
              { term: 'Automatisierung', text: 'Regel, die nach einer Kampagne automatisch eine Nachfass-Mail schickt, wenn ein Auslöser wie Klick oder Öffnung zutrifft.' },
              { term: 'Autopilot', text: 'Schalter je Bereich auf der Übersicht, mit denen MixMarket Recherche, Schreiben, Versand und Antworten selbst erledigt.' },
              { term: 'Durchleuchten', text: 'Auslesen der öffentlichen Seiten einer Firmenwebseite, um Ansprechpartner, E-Mail-Adressen und Merkmale zu gewinnen. Kostenlos und ohne KI.' },
              { term: 'Einordnung', text: 'Einschätzung einer Antwort unter Gespräche durch die KI oder durch Sie: Interesse, Frage, Kein Interesse, Abmeldung oder Sonstiges. Kein Interesse und Abmeldung ändern Interessent, Kontakt und Sperrliste.' },
              { term: 'Einwilligung', text: 'Zustimmung eines Empfängers, Werbung per E-Mail zu erhalten. In MixMarket als Haken am Kontakt festgehalten.' },
              { term: 'Ersteinrichtung', text: 'Anlegen des einzigen Kontos beim allerersten Start auf der Seite MixMarket einrichten. Danach zeigt MixMarket einmalig den Wiederherstellungsschlüssel.' },
              { term: 'Erstmail', text: 'Erste persönliche Mail, die die KI im Postausgang an einen Interessenten schreibt.' },
              { term: 'Firmensuche', text: 'Suche nach Betrieben einer Branche an einem Ort über eine Quelle, im Reiter Firmen finden.' },
              { term: 'Gespräch', text: 'Alle eingegangenen Mails eines Kontakts zusammen mit Ihren Mails an ihn, im Bereich Gespräche. Ohne Kontakt fasst MixMarket nach Absenderadresse zusammen.' },
              { term: 'Idealer Kunde', text: 'Ihre Beschreibung, welche Betriebe gut zu einem Produkt passen und welche nicht. Grundlage der Passung.' },
              { term: 'IMAP', text: 'Verfahren zum Lesen von Mails aus einem Postfach. Der Posteingangsserver Ihres Anbieters. MixMarket liest darüber die Antworten für Gespräche.' },
              { term: 'Interessent', text: 'Firma, die Sie für ein bestimmtes Produkt ansprechen wollen, mit Status und Notiz.' },
              { term: 'Interessentenliste', text: 'Liste, die MixMarket je Produkt anlegt, wenn Sie Interessenten in die Kontakte übernehmen oder anschreiben. Über sie findet {{ansatz}} den Ansatzpunkt.' },
              { term: 'Kampagne', text: 'Versand einer Vorlage an die Kontakte ausgewählter Listen, sofort oder geplant.' },
              { term: 'KI-Bewertung', text: 'Bewertung durchleuchteter Firmen durch die KI: Passung von 1 bis 10, Begründung, Ansatzpunkt und geschätzte Größe.' },
              { term: 'KI-Pause', text: 'Automatische Pause der KI, sobald das gewählte Abo die eingestellte Auslastung erreicht. Bewertung, Postausgang und Gespräche warten und laufen nach der Pause weiter.' },
              { term: 'Kontakt', text: 'Empfänger mit E-Mail-Adresse und weiteren Angaben wie Name, Anrede und Firma.' },
              { term: 'Konto', text: 'Ihr Zugang zu MixMarket mit Name, E-Mail und Passwort. Es gibt genau ein Konto, verwaltet in den Einstellungen im Abschnitt Konto.' },
              { term: 'Liste', text: 'Gruppe von Kontakten. Kampagnen gehen immer an eine oder mehrere Listen.' },
              { term: 'Merkmal', text: 'Eigenschaft einer Firma, etwa „Sucht Personal“ oder „Hat Kontaktformular“, nach der Sie Zielgruppen bilden.' },
              { term: 'Mindestgröße', text: 'Zahl der Mitarbeiter, ab der ein Produkt passt. Erkennbar kleinere Firmen erhalten höchstens die Passung 3.' },
              { term: 'Nachfass-Mail', text: 'Mail, die nach einer ersten Mail nachfasst: in einer Automatisierung nach einer Kampagne, im Postausgang als Antwort auf die Erstmail im selben Verlauf.' },
              { term: 'Not-Aus', text: 'Stoppt sofort jeden Versand aus Postausgang, Kampagnen, Automatisierungen und Gespräche. Von Hand auf der Übersicht oder automatisch bei zu vielen Rückläufern ausgelöst, aufgehoben mit Versand freigeben.' },
              { term: 'Passung', text: 'Zahl von 1 bis 10, wie gut eine Firma laut KI zu einem Produkt passt.' },
              { term: 'Platzhalter', text: 'Ausdruck in doppelten geschweiften Klammern, etwa {{firstName}}, der beim Versand durch die Daten des Empfängers ersetzt wird.' },
              { term: 'Postausgang', text: 'Bereich, in dem die KI persönliche Mails an einzelne Interessenten schreibt, die Sie vor dem Versand freigeben.' },
              { term: 'Postfach', text: 'Ihr E-Mail-Konto, über das MixMarket versendet und Antworten liest. Eingetragen in den Einstellungen.' },
              { term: 'Produkt', text: 'Was Sie verkaufen. Zielgruppen, KI-Bewertungen und Interessenten gelten je Produkt.' },
              { term: 'Quelle', text: 'Dienst, über den die Firmensuche Betriebe findet: OpenStreetMap, DataForSEO oder Serper.' },
              { term: 'Rückläufer', text: 'Meldung eines Mailservers, dass eine Mail nicht zugestellt werden konnte. Bei einem dauerhaften Rückläufer sperrt MixMarket die Adresse mit dem Grund Unzustellbar.' },
              { term: 'SMTP', text: 'Verfahren zum Verschicken von Mails. Der Postausgangsserver Ihres Anbieters.' },
              { term: 'Sperrliste', text: 'Adressen, die nie wieder angeschrieben werden, etwa nach einer Abmeldung.' },
              { term: 'Testmodus', text: 'Zustand ohne eingetragenes Postfach. Kampagnen, Postausgang und Antworten unter Gespräche laufen durch, es werden aber keine echten Mails verschickt.' },
              { term: 'Versandfenster', text: 'Versandtage und Uhrzeiten, in denen der Postausgang Mails verschickt. Festgelegt unter Versandregeln.' },
              { term: 'Wiederherstellungsschlüssel', text: 'Schlüssel aus 6 Gruppen zu 4 Zeichen, mit dem Sie bei vergessenem Passwort ein neues setzen. Er wird nur einmal angezeigt und gilt für genau eine Wiederherstellung.' },
              { term: 'Zielgruppe', text: 'Gespeicherte Auswahl von Firmen nach Merkmalen, je Produkt.' },
            ],
          },
        ],
      },
    ],
  },
]
