// Globaler Bestätigungsdialog. Wird über useUi().confirm(...) ausgeloest.
import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'
import { useUi } from '../stores/ui'

export function ConfirmHost() {
  const { t } = useTranslation()
  const { confirmState, resolveConfirm } = useUi()

  return (
    <Modal
      open={confirmState.open}
      onClose={() => resolveConfirm(false)}
      title={t('common.confirm')}
      width={420}
      footer={
        <>
          <button className="btn btn-secondary" onClick={() => resolveConfirm(false)}>
            {t('common.cancel')}
          </button>
          <button
            className={`btn ${confirmState.danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => resolveConfirm(true)}
          >
            {confirmState.confirmLabel || t('common.confirm')}
          </button>
        </>
      }
    >
      <p className="confirm-text">{confirmState.message}</p>
      {/* Warnungen hervorgehoben, sachliche Hinweise dezent */}
      {!!confirmState.warnings?.length && (
        <ul className="confirm-list confirm-warnings">
          {confirmState.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      {!!confirmState.notes?.length && (
        <ul className="confirm-list confirm-notes">
          {confirmState.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
