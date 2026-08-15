// nike-commerce DS는 Lucide Static을 CDN <img>로 마스킹해 쓰지만,
// 오프라인/PWA에서 깨지지 않도록 같은 Lucide 글리프를 인라인 SVG로 옮겼다.
const common = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
}

function Svg({ size = 20, children, ...rest }) {
  return <svg width={size} height={size} {...common} {...rest} aria-hidden="true">{children}</svg>
}

export const HouseIcon = (p) => (
  <Svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.8V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.8" /><path d="M9.5 21v-6h5v6" /></Svg>
)
export const CalendarIcon = (p) => (
  <Svg {...p}><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M8 2.5v4M16 2.5v4M3 10.5h18" /></Svg>
)
export const UserIcon = (p) => (
  <Svg {...p}><circle cx="12" cy="8" r="3.6" /><path d="M4.6 20c1.3-3.7 4.1-5.6 7.4-5.6s6.1 1.9 7.4 5.6" /></Svg>
)
export const XIcon = (p) => (<Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>)
export const ChevronLeft = (p) => (<Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>)
export const ChevronRight = (p) => (<Svg {...p}><path d="M9 18l6-6-6-6" /></Svg>)
export const PencilIcon = (p) => (
  <Svg {...p}><path d="M12 20h9" /><path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7.5 18.5 3.5 19.5l1-4z" /></Svg>
)
