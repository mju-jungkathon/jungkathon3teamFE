import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import Sheet from './Sheet.jsx'
import ImportWatchRun from './ImportWatchRun.jsx'
import ManualRunForm from './ManualRunForm.jsx'
import { ChevronLeft, XIcon } from '../constants/Icons.jsx'
import { GREEN_900 } from '../constants/colors.ts'

const TITLE = { choice: '기록 추가하기', watch: '애플워치에서 가져오기', manual: '직접 입력하기' }

// 기록 탭 "＋ 기록 추가하기"의 진입 Sheet. History.jsx가 selected state로 목록↔상세를
// 한 Sheet 안에서 전환하는 것과 같은 패턴 — 여기서도 Sheet를 겹쳐 열지 않고 step만 바꾼다.
export default function AddRecord({ onClose, onImported }) {
  const [step, setStep] = useState('choice') // choice | watch | manual
  const isNative = Capacitor.isNativePlatform()

  return (
    <Sheet padded={false} label="기록 추가하기" onClose={onClose}>
      {(close) => (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', boxShadow: 'var(--elevation-inset-bottom)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {step !== 'choice' && (
                <button className="icon-btn plain" onClick={() => setStep('choice')} aria-label="뒤로" style={{ marginLeft: -8, marginRight: 6 }}>
                  <ChevronLeft size={18} />
                </button>
              )}
              <div className="sheet-title" style={{ color: GREEN_900 }}>{TITLE[step]}</div>
            </div>
            <button className="icon-btn" onClick={close} aria-label="닫기"><XIcon size={18} /></button>
          </div>

          {step === 'choice' && (
            <div style={{ padding: 20, display: 'grid', gap: 10, animation: 'agRise .3s ease both' }}>
              <button
                className="pick"
                disabled={!isNative}
                onClick={() => setStep('watch')}
                style={{ opacity: isNative ? 1 : .4, cursor: isNative ? 'pointer' : 'not-allowed' }}
              >
                <span className="pt">애플워치에서 가져오기</span>
                <span className="pd">{isNative ? '최근 7일 워크아웃 목록에서 선택' : 'iOS 앱에서만 가능해요'}</span>
              </button>
              <button className="pick" onClick={() => setStep('manual')}>
                <span className="pt">직접 입력하기</span>
                <span className="pd">날짜·거리·시간을 입력해서 등록</span>
              </button>
            </div>
          )}

          {step === 'watch' && (
            <ImportWatchRun onImported={(dateISO) => { onImported(dateISO); close() }} />
          )}

          {step === 'manual' && (
            <ManualRunForm onImported={(dateISO) => { onImported(dateISO); close() }} />
          )}
        </>
      )}
    </Sheet>
  )
}
