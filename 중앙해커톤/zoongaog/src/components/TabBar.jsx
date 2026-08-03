const TABS = [
  { id: 'home', label: '홈' },
  { id: 'tracking', label: '트래킹' },
  { id: 'vitals', label: '심박확인' },
  { id: 'solution', label: '솔루션' },
  { id: 'report', label: '리포트' },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span className="tab-box"></span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
