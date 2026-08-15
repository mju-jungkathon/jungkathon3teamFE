import { HouseIcon, CalendarIcon, UserIcon } from './Icons.jsx'

const TABS = [
  { id: 'home', label: '홈', Icon: HouseIcon },
  { id: 'history', label: '기록', Icon: CalendarIcon },
  { id: 'profile', label: '프로필', Icon: UserIcon },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tabbar">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tab ${active === id ? 'on' : ''}`}
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
        >
          <Icon size={20} />
          {label}
        </button>
      ))}
    </nav>
  )
}
