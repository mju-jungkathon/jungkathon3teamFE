import { useState } from 'react'
import Sheet from './Sheet.jsx'
import { CheckIcon } from './Icons.jsx'

const ROUTINE = [
  { id: 1, title: '발목 돌리기', desc: '양방향 각 15회씩 · 30초' },
  { id: 2, title: '종아리 스트레칭', desc: '벽 짚고 좌우 각 45초' },
  { id: 3, title: '가벼운 제자리 걷기', desc: '천천히 1분, 심박수를 서서히 올려요' },
]

export default function RunStart({ onStart }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState([])

  const toggleStep = (id) => {
    setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))
  }

  const allDone = done.length === ROUTINE.length

  return (
    <section className="page">
      <div className="label">러닝</div>
      <div className="title">오늘도 뛸 준비 됐나요</div>
      <div className="sub">현재 위치 기준 UV 지수 6 · 러닝하기 좋은 시간대예요</div>

      <div className="box-dash">
        <div className="t">
          출발 전 스트레칭
          <span className="badge">선택 사항</span>
        </div>
        <div className="d">발목·종아리 위주 3분 루틴{allDone && ' · 완료했어요'}</div>
        <button className="btn block" onClick={() => setOpen(true)}>
          {allDone ? '스트레칭 다시 보기' : '스트레칭 시작하기'}
        </button>
      </div>

      <div className="box">
        <div className="line-item"><span>현재 위치</span><span className="v">서울 성동구</span></div>
        <div className="line-item"><span>UV 지수</span><span className="v">6 · 보통</span></div>
      </div>

      <button className="btn block primary" onClick={onStart}>러닝 시작하기</button>

      {open && (
        <Sheet eyebrow="스트레칭" title="출발 전 3분 루틴" onClose={() => setOpen(false)}>
          <div className="sub">항목을 눌러 완료 표시를 해보세요</div>
          <div className="steps">
            {ROUTINE.map((step, i) => {
              const isDone = done.includes(step.id)
              return (
                <div
                  key={step.id}
                  className={`step-row ${isDone ? 'done' : ''}`}
                  onClick={() => toggleStep(step.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="no">{isDone ? <CheckIcon /> : i + 1}</span>
                  <div>
                    <div className="st">{step.title}</div>
                    <div className="sd">{step.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <button className="btn block primary" onClick={() => setOpen(false)}>
            {allDone ? '완료하고 닫기' : '나중에 하고 닫기'}
          </button>
        </Sheet>
      )}
    </section>
  )
}