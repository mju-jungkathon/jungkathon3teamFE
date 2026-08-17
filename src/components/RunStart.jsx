import { ROUTINE } from '../data.js'

export default function RunStart({ run, onOpenSheet }) {
  const allDone = run.done.length === ROUTINE.length
  const { prepare } = run

  return (
    <div>
      <img
        src="https://picsum.photos/seed/aftergrow-runner-warmup/780/600"
        alt="러닝 준비"
        style={{ display: 'block', width: '100%', aspectRatio: '16/10', objectFit: 'cover', background: 'var(--soft-cloud)' }}
      />
      <div style={{ padding: 20 }}>
        <div className="display" style={{ fontSize: 52, marginBottom: 18 }}>READY TO RUN</div>

        <div className="stat-grid c2 bordered-b">
          <div style={{ paddingBottom: 16 }}>
            <div className="cap-sm">현재 위치</div>
            <div style={{ font: 'var(--type-body-strong)', marginTop: 4 }}>{prepare?.locationLabel ?? '위치 확인 중…'}</div>
          </div>
          <div style={{ paddingBottom: 16 }}>
            <div className="cap-sm">UV 지수</div>
            <div style={{ font: 'var(--type-body-strong)', marginTop: 4 }}>
              {prepare ? `${prepare.uvIndex} · ${prepare.uvLevel}` : '측정 중…'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
          <div className="h-lg">출발 전 스트레칭</div>
          <span className="badge">선택 사항</span>
        </div>
        <div className="body" style={{ marginTop: 8 }}>
          발목·종아리 위주 3분 루틴{allDone && ' · 완료했어요'}
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="btn full secondary" onClick={onOpenSheet}>
            {allDone ? '스트레칭 다시 보기' : '스트레칭 시작하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
