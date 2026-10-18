// Handbuch in der gewählten Sprache; Deutsch ist der Standard
import { useTranslation } from 'react-i18next'
import type { HandbookChapter } from '../../types/handbook'
import { handbookDe } from './de'
import { handbookEn } from './en'

export function useHandbook(): HandbookChapter[] {
  const { i18n } = useTranslation()
  return i18n.language === 'en' ? handbookEn : handbookDe
}
