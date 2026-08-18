import { useEffect, useState } from 'react'
import Sheet from './Sheet.jsx'
import { PencilIcon } from './Icons.jsx'
import { GOAL_TYPES, GOAL_TYPE_TO_ENUM, GOAL_TYPE_FROM_ENUM } from '../data.js'
import { isZombieSession, weeklyStreak } from '../utils.js'
import { getProfile, updateGoal, updateIntegrations, getRunningSessions } from '../api/endpoints.js'

// 카메라/위치는 서버 값이 아니라 "지금 이 순간" 브라우저의 실제 상태를 봐야 한다(API 명세 §7.6) —
// 권한 대화상자를 새로 띄우지 않는 permissions.query만 쓴다(getUserMedia는 실제 기능 진입 시에만).
async function checkBrowserPermissions() {
  const out = {}
  try {
    out.cameraPermission = (await navigator.permissions.query({ name: 'camera' })).state === 'granted'
  } catch {
    out.cameraPermission = null // 브라우저가 permissions.query('camera')를 지원하지 않음 — 서버 값으로 폴백
  }
  try {
    out.locationPermission = (await navigator.permissions.query({ name: 'geolocation' })).state === 'granted'
  } catch {
    out.locationPermission = null
  }
  return out
}

function PermRow({ label, value }) {
  const cls = value == null ? 'mute' : value ? 'ok' : 'bad'
  const text = value == null ? '확인 불가' : value ? '허용됨' : '거부됨'
  return <div className="row">{label}<span className={`v ${cls}`}>{text}</span></div>
}

export default function Profile({ user, goal, onSaveGoal, onLogout }) {
  const [sheet, setSheet] = useState(null) // 'goal' | 'logout' | null
  const [draft, setDraft] = useState(goal)

  const [profile, setProfile] = useState(null)       // GET /users/me/profile
  const [profileErr, setProfileErr] = useState('')
  const [stats, setStats] = useState(null)            // 누적 러닝/거리/연속 주 — 세션 목록에서 직접 집계
  const [realPerm, setRealPerm] = useState(null)       // 브라우저에서 실제로 확인한 카메라/위치 권한
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  useEffect(() => {
    let cancelled = false

    getProfile()
      .then((p) => { if (!cancelled) setProfile(p) })
      .catch((err) => { if (!cancelled) setProfileErr(err.message || '프로필을 불러오지 못했어요') })

    getRunningSessions('365d')
      .then((d) => {
        const real = (d.records || []).filter((r) => !isZombieSession(r))
        if (cancelled) return
        setStats({
          count: real.length,
          distanceKm: real.reduce((a, r) => a + (r.distanceKm || 0), 0),
          streak: weeklyStreak(real),
        })
      })
      .catch(() => {})

    checkBrowserPermissions().then((real) => {
      if (cancelled) return
      setRealPerm(real)
      const toSync = {}
      if (real.cameraPermission != null) toSync.cameraPermission = real.cameraPermission
      if (real.locationPermission != null) toSync.locationPermission = real.locationPermission
      if (Object.keys(toSync).length) updateIntegrations(toSync).catch(() => {})
    })

    return () => { cancelled = true }
  }, [])

  const name = profile?.nickname?.trim() || user.nickname?.trim() || '김러너'
  const email = user.email?.trim() || 'runner.kim@aftergrow.kr'

  // 서버에 목표가 아직 없으면(goalType null) 온보딩 때 고른 로컬 goal로 폴백
  const displayGoal = profile?.goal?.goalType
    ? { type: GOAL_TYPE_FROM_ENUM[profile.goal.goalType] || goal.type, freq: profile.goal.weeklyRunGoal ?? goal.freq }
    : goal

  const watchLinked = profile?.integrations?.appleHealthLinked ?? false
  const cameraPermission = realPerm?.cameraPermission ?? profile?.integrations?.cameraPermission ?? null
  const locationPermission = realPerm?.locationPermission ?? profile?.integrations?.locationPermission ?? null

  const openGoal = () => { setDraft(displayGoal); setSaveErr(''); setSheet('goal') }

  const saveGoal = async (close) => {
    setSaving(true)
    setSaveErr('')
    try {
      const updated = await updateGoal({ goalType: GOAL_TYPE_TO_ENUM[draft.type], weeklyRunGoal: draft.freq })
      setProfile((p) => ({ ...p, goal: { goalType: updated.goalType, weeklyRunGoal: updated.weeklyRunGoal } }))
      onSaveGoal(draft)
      close()
    } catch (err) {
      setSaveErr(err.message || '목표 저장에 실패했어요')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="scroll" style={{ paddingBottom: 88 }}>
        <div className="soft" style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '28px 20px' }}>
          <div style={{ flex: 'none', position: 'relative', width: 76, height: 76 }}>
            <div
              className="display"
              style={{ width: 76, height: 76, borderRadius: 'var(--radius-full)', background: 'var(--ink)', color: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}
            >
              {name.charAt(0)}
            </div>
            <button
              className="press"
              aria-label="프로필 사진 수정"
              style={{ position: 'absolute', top: -2, right: -2, width: 28, height: 28, borderRadius: 'var(--radius-full)', border: '2px solid var(--soft-cloud)', background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
            >
              <PencilIcon size={13} />
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="display" style={{ fontSize: 34 }}>{name}</div>
            <div className="cap" style={{ color: 'var(--charcoal)', marginTop: 8 }}>{email}</div>
          </div>
        </div>

        {profileErr && <div className="body" style={{ padding: '12px 20px', color: 'var(--sale)' }}>{profileErr}</div>}

        <div className="stat-grid c3 bordered-b section">
          <div className="stat"><div className="k">누적 러닝</div><div className="n">{stats ? `${stats.count}회` : '-'}</div></div>
          <div className="stat"><div className="k">누적 거리</div><div className="n">{stats ? `${stats.distanceKm.toFixed(1)}km` : '-'}</div></div>
          <div className="stat"><div className="k">연속 주</div><div className="n">{stats ? `${stats.streak}주` : '-'}</div></div>
        </div>

        <div className="section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 12px' }}>
            <div className="h-lg">목표</div>
            <button
              onClick={openGoal}
              className="press"
              style={{ border: 'none', background: 'none', padding: 0, font: 'var(--type-caption-md)', color: 'var(--ink)', textDecoration: 'underline', cursor: 'pointer' }}
            >
              수정
            </button>
          </div>
          <div className="row">목표 유형<span className="v">{displayGoal.type}</span></div>
          <div className="row">주간 러닝 목표<span className="v">주 {displayGoal.freq}회</span></div>

          <div className="h-lg" style={{ padding: '24px 0 12px' }}>연동 상태</div>
          <div className="row">워치 연동<span className={`v ${watchLinked ? 'ok' : 'mute'}`}>{watchLinked ? '연결됨' : '연결 안 됨'}</span></div>
          <PermRow label="카메라 권한" value={cameraPermission} />
          <PermRow label="위치 권한" value={locationPermission} />

          <div className="h-lg" style={{ padding: '24px 0 12px' }}>알림</div>
          <div className="row">러닝 리마인더<span className="v mute">{profile?.notifications?.runningReminderTime ? `매일 ${profile.notifications.runningReminderTime}` : '설정 안 됨'}</span></div>
          <div className="row">UV 경보<span className="v mute">지수 6 이상</span></div>

          <div style={{ padding: '24px 0 28px' }}>
            <button className="btn lg full secondary" onClick={() => setSheet('logout')}>로그아웃</button>
          </div>
        </div>
      </div>

      {sheet === 'goal' && (
        <Sheet label="목표 수정" onClose={() => setSheet(null)}>
          {(close) => (
            <>
              <div className="sheet-title">목표 수정</div>

              <div className="cap" style={{ marginTop: 20 }}>목표 유형</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {GOAL_TYPES.map(([name]) => {
                  const on = draft.type === name
                  return (
                    <button
                      key={name}
                      className="press"
                      onClick={() => setDraft((d) => ({ ...d, type: name }))}
                      style={{
                        border: `1px solid ${on ? 'var(--ink)' : 'var(--hairline)'}`,
                        borderRadius: 'var(--radius-full)', padding: '10px 16px',
                        font: 'var(--type-button-sm)', cursor: 'pointer',
                        background: on ? 'var(--ink)' : 'var(--canvas)',
                        color: on ? 'var(--canvas)' : 'var(--charcoal)',
                      }}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>

              <div className="cap" style={{ marginTop: 22 }}>주간 러닝 목표</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <div className="display" style={{ fontSize: 40 }}>주 {draft.freq}회</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button className="step-btn" aria-label="줄이기" disabled={draft.freq <= 1} onClick={() => setDraft((d) => ({ ...d, freq: Math.max(1, d.freq - 1) }))}>-</button>
                  <button className="step-btn" aria-label="늘리기" disabled={draft.freq >= 7} onClick={() => setDraft((d) => ({ ...d, freq: Math.min(7, d.freq + 1) }))}>+</button>
                </div>
              </div>

              {saveErr && <div className="body" style={{ marginTop: 14, color: 'var(--sale)' }}>{saveErr}</div>}

              <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
                <button className="btn lg full secondary" onClick={close} disabled={saving}>취소</button>
                <button className="btn lg full" onClick={() => saveGoal(close)} disabled={saving}>{saving ? '저장 중…' : '저장'}</button>
              </div>
            </>
          )}
        </Sheet>
      )}

      {sheet === 'logout' && (
        <Sheet label="로그아웃" onClose={() => setSheet(null)}>
          {(close) => (
            <>
              <div className="sheet-title">로그아웃 하시겠어요?</div>
              <div className="body" style={{ marginTop: 10 }}>다시 로그인하려면 이메일과 비밀번호가 필요해요</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn lg full secondary" onClick={close}>취소</button>
                <button className="btn lg full" onClick={onLogout}>로그아웃</button>
              </div>
            </>
          )}
        </Sheet>
      )}
    </>
  )
}
