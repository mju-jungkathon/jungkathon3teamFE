import { useState, useRef, useEffect } from 'react'

const CLOSE_MS = 230

// 바텀시트. 닫기는 내려가는 애니메이션이 끝난 뒤 onClose를 부른다.
// children이 함수면 close 콜백을 넘겨준다: <Sheet onClose={..}>{(close) => ...}</Sheet>
export default function Sheet({ onClose, padded = true, label, children }) {
  const [closing, setClosing] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const close = () => {
    if (closing) return
    setClosing(true)
    timer.current = setTimeout(onClose, CLOSE_MS)
  }

  return (
    <div
      className="sheet-backdrop"
      onClick={close}
      role="presentation"
      style={{ animation: closing ? 'agFadeOut .22s ease both' : 'agFade .18s ease both' }}
    >
      <div
        className={`sheet ${padded ? 'pad' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: closing
            ? 'agSheetDown .24s cubic-bezier(.4,0,.9,.4) both'
            : 'agSheetUp .26s cubic-bezier(.22,.9,.28,1) both',
        }}
      >
        {typeof children === 'function' ? children(close) : children}
      </div>
    </div>
  )
}
