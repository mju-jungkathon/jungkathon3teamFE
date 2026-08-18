import React, { useEffect, useState } from 'react';
import { userApi } from '../api/userApi';
import { authApi } from '../api/authApi';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getProfile()
      .then((data) => setProfile(data))
      .catch((err) => console.error("프로필 조회 실패:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleGoalUpdate = async () => {
    try {
      const updated = await userApi.updateGoal({
        goalType: "체력 증진",
        weeklyRunGoal: 5
      });
      setProfile((prev) => ({ ...prev, goal: updated }));
      alert("목표가 수정되었습니다.");
    } catch (err) {
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    window.location.href = '/login';
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <div>
      <h2>{profile?.nickname} 님의 프로필</h2>
      <div>
        <h3>러닝 목표</h3>
        <p>유형: {profile?.goal?.goalType}</p>
        <p>주간 목표: {profile?.goal?.weeklyRunGoal}회</p>
        <button onClick={handleGoalUpdate}>목표 변경 (5회로 설정)</button>
      </div>

      <div>
        <h3>알림 설정</h3>
        <p>리마인더: {profile?.notifications?.runningReminderTime}</p>
        <p>리포트: {profile?.notifications?.weeklyReportDay} {profile?.notifications?.weeklyReportTime}</p>
      </div>

      <button onClick={handleLogout}>로그아웃</button>
    </div>
  );
}