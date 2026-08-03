export default function Profile() {
  return (
    <section className="page">
      <div className="label">프로필</div>
      <div className="title">김러너님</div>
      <div className="sub">목표와 연동 상태를 관리해요</div>

      <div className="box">
        <div className="t">목표</div>
        <div className="profile-row"><span>목표 유형</span><span className="v">체력 증진</span></div>
        <div className="profile-row"><span>주간 러닝 목표</span><span className="v">주 5회</span></div>
        <button className="btn block">목표 수정하기</button>
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

      <button className="btn block" style={{ marginTop: 16 }}>로그아웃</button>
    </section>
  )
}
