import { useState } from 'react'
import Sheet from './Sheet.jsx'

const GOAL_TYPES = ['체력 증진', '체중 감량', '완주 훈련', '스트레스 해소']
const FREQ_MIN = 1
const FREQ_MAX = 7

export default function Profile({ onLogout }) {
  const [goalType, setGoalType] = useState('체력 증진')
  const [weeklyGoal, setWeeklyGoal] = useState(5)
  const [goalOpen, setGoalOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  // draft values edited inside the sheet, committed on save
  const [draftType, setDraftType] = useState(goalType)
  const [draftFreq, setDraftFreq] = useState(weeklyGoal)

  const openGoalSheet = () => {
    setDraftType(goalType)
    setDraftFreq(weeklyGoal)
    setGoalOpen(true)
  }

  const saveGoal = () => {
    setGoalType(draftType)
    setWeeklyGoal(draftFreq)
    setGoalOpen(false)
  }

  return (
    <section className="page">
      <div className="label">프로필</div>
      <div className="title">김러너님</div>
      <div className="sub">목표와 연동 상태를 관리해요</div>

      <div className="box">
        <div className="t">목표</div>
        <div className="profile-row"><span>목표 유형</span><span className="v">{goalType}</span></div>
        <div className="profile-row"><span>주간 러닝 목표</span><span className="v">주 {weeklyGoal}회</span></div>
        <button className="btn block" onClick={openGoalSheet}>목표 수정하기</button>
      </div>

      <div className="divider"><span className="label">연동 상태</span><div className="ln"></div></div>
      <div className="box">
        <div className="profile-row"><span>워치 연동</span><span className="v">연결됨</span></div>
        <div className="profile-row"><span>카메라 권한</span><span className="v">허용됨</span></div>
        <div className="profile-row"><span>위치 권한</span><span className="v">허용됨</span></div>
      </div>

      <div className="divider"><span className="label">알림</span><div className="ln"></div></div>
      <div className="box">
        <div className="profile-row"><span>러닝 리마인더</span><span className="v">매일 오전 7시</span></div>
        <div className="profile-row"><span>주간 리포트 알림</span><span className="v">일요일 저녁</span></div>
      </div>

      <button className="btn block danger" style={{ marginTop: 16 }} onClick={() => setLogoutOpen(true)}>
        로그아웃
      </button>

      {goalOpen && (
        <Sheet eyebrow="목표" title="목표 수정하기" onClose={() => setGoalOpen(false)}>
          <div className="field" style={{ marginTop: 4 }}>
            <label>목표 유형</label>
            <div className="chip-row">
              {GOAL_TYPES.map((g) => (
                <div
                  key={g}
                  className={`chip ${draftType === g ? 'on' : ''}`}
                  onClick={() => setDraftType(g)}
                >
                  {g}
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <label>주간 러닝 목표</label>
            <div className="stepper">
              <span className="sub" style={{ margin: 0 }}>일주일에 몇 번 뛸까요</span>
              <div className="ctrl">
                <button
                  onClick={() => setDraftFreq((f) => Math.max(FREQ_MIN, f - 1))}
                  disabled={draftFreq <= FREQ_MIN}
                  aria-label="줄이기"
                >−</button>
                <span className="val">주 {draftFreq}회</span>
                <button
                  onClick={() => setDraftFreq((f) => Math.min(FREQ_MAX, f + 1))}
                  disabled={draftFreq >= FREQ_MAX}
                  aria-label="늘리기"
                >+</button>
              </div>
            </div>
          </div>

          <div className="sheet-actions">
            <button className="btn" onClick={() => setGoalOpen(false)}>취소</button>
            <button className="btn primary" onClick={saveGoal}>저장하기</button>
          </div>
        </Sheet>
      )}

      {logoutOpen && (
        <Sheet title="로그아웃 하시겠어요?" onClose={() => setLogoutOpen(false)}>
          <div className="sub">다시 로그인하려면 이메일과 비밀번호가 필요해요</div>
          <div className="sheet-actions">
            <button className="btn" onClick={() => setLogoutOpen(false)}>취소</button>
            <button className="btn danger" onClick={onLogout}>로그아웃</button>
          </div>
        </Sheet>
      )}
    </section>
  )
}