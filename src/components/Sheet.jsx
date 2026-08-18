export default function Sheet({ title, eyebrow, onClose, children }) {
  return (
    <div
      className="sheet-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" />
        <div className="sheet-header">
          <div>
            {eyebrow && <div className="label">{eyebrow}</div>}
            {title && <div className="title" style={{ fontSize: 20 }}>{title}</div>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}