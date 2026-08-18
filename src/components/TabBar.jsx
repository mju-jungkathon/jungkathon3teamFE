import { HomeIcon, HistoryIcon, ProfileIcon } from './Icons.jsx'

const TABS = [
  { id: 'home', label: '홈', Icon: HomeIcon },
  { id: 'history', label: '기록', Icon: HistoryIcon },
  { id: 'profile', label: '프로필', Icon: ProfileIcon },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tabbar">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tab ${active === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}