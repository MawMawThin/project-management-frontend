import type { ReactNode } from 'react'
import type { PriorityLevel } from '../../types'
import { labelPriority, pillClassFromLabel } from '../../utils/labels'

export function PriorityPill({ value }: { value: PriorityLevel }) {
  const label = labelPriority(value)
  const cls =
    value === 'HIGH' ? 'pill-high' : value === 'MEDIUM' ? 'pill-medium' : 'pill-low'
  return <span className={`pill ${cls}`}>{label}</span>
}

export function StatusPill({ value }: { value: string }) {
  return <span className={`pill pill-${pillClassFromLabel(value)}`}>{value}</span>
}

export function Modal({
  title,
  onClose,
  children,
  wide,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
  footer?: ReactNode
}) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`modal${wide ? ' wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  )
}

export function LoadingState({ text = 'Loading…' }: { text?: string }) {
  return <div className="empty">{text}</div>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="empty">
      <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{message}</div>
      {onRetry ? (
        <button type="button" className="btn btn-sm" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  )
}
