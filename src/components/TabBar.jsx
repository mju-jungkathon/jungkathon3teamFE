const TABS = [
  { id: 'home', label: '홈' },
  { id: 'run', label: '러닝' },
  { id: 'history', label: '기록' },
  { id: 'profile', label: '프로필' },
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
