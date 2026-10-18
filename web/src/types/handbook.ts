// Aufbau des eingebauten Handbuchs. Die Inhalte stehen je Sprache in src/i18n/handbook/.
// In Texten markiert **so** eine Beschriftung der Oberfläche (Knopf, Reiter, Feld); sie wird hervorgehoben.

// Kapitel; die Kennungen sind in allen Sprachen gleich und dienen als Adresse (/handbook/<kapitel>)
export type HandbookChapterId =
  | 'start'
  | 'dashboard'
  | 'contacts'
  | 'lists'
  | 'templates'
  | 'campaigns'
  | 'automations'
  | 'research'
  | 'outbox'
  | 'conversations'
  | 'suppression'
  | 'activity'
  | 'settings'
  | 'search'
  | 'legal'
  | 'glossary'

// Inhaltsbausteine eines Abschnitts
export type HandbookBlock =
  | { type: 'p'; text: string } // Absatz
  | { type: 'steps'; items: string[] } // nummerierte Schritte
  | { type: 'list'; items: string[] } // Aufzählung
  | { type: 'tip'; text: string } // Hinweis
  | { type: 'warning'; text: string } // Achtung
  | { type: 'terms'; items: Array<{ term: string; text: string }> } // Begriffe mit Erklärung

export interface HandbookSection {
  // Kennung innerhalb des Kapitels, in allen Sprachen gleich (Sprungziel /handbook/<kapitel>#<abschnitt>)
  id: string
  title: string
  blocks: HandbookBlock[]
}

export interface HandbookChapter {
  id: HandbookChapterId
  title: string
  // Ein Satz, wofür das Kapitel da ist (Inhaltsverzeichnis und Suche)
  summary: string
  sections: HandbookSection[]
}
