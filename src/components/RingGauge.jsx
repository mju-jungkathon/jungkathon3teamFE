// RingGauge — AfterGrow의 시그니처 비주얼.
// 바깥 링(ink) = UV 노출, 안쪽 링(sale) = 심박수. 링 자체는 링 색으로 값을
// 구분하지 않고, 색은 "심박=sale, 나머지=ink"라는 시스템 규칙을 그대로 따른다.
// 쓰는 곳: 측정 결과 화면(160px) + 홈 최근 측정 요약(72px). 리스트/반복 요소엔 쓰지 않는다.

const C_OUTER = 2 * Math.PI * 62
const C_INNER = 2 * Math.PI * 45

const clamp = (n) => Math.min(1, Math.max(0, n))

export default function RingGauge({ size = 160, outerPct = 0, innerPct = 0, value, label }) {
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" role="img" aria-label={label || String(value ?? '')}>
      <circle cx="75" cy="75" r="62" fill="none" stroke="var(--hairline-soft)" strokeWidth="10" />
      <circle
        cx="75" cy="75" r="62" fill="none" stroke="var(--ink)" strokeWidth="10"
        transform="rotate(-90 75 75)"
        strokeDasharray={`${C_OUTER * clamp(outerPct)} ${C_OUTER}`}
        style={{ transition: 'stroke-dasharray .5s ease' }}
      />
      <circle cx="75" cy="75" r="45" fill="none" stroke="var(--hairline-soft)" strokeWidth="10" />
      <circle
        cx="75" cy="75" r="45" fill="none" stroke="var(--sale)" strokeWidth="10"
        transform="rotate(-90 75 75)"
        strokeDasharray={`${C_INNER * clamp(innerPct)} ${C_INNER}`}
        style={{ transition: 'stroke-dasharray .5s ease' }}
      />
      {value != null && (
        <text
          x="75" y="86" textAnchor="middle"
          fontFamily="var(--font-display-campaign)" fontSize="44" fill="var(--ink)"
        >
          {value}
        </text>
      )}
    </svg>
  )
}
