// rPPG 신호처리 — 카메라 밝기값 배열에서 BPM/HRV를 계산한다.
// 알고리즘 출처: docs/rPPG 구현 가이드(React Native + Expo 사용 시) 5장 — 순수 JS라 웹에서도 그대로 재사용 가능.

function detrend(signal, windowSize = 15) {
  return signal.map((v, i) => {
    const window = signal.slice(Math.max(0, i - windowSize), i + 1)
    return v - window.reduce((a, b) => a + b, 0) / window.length
  })
}

function smooth(signal, windowSize = 3) {
  return signal.map((_, i) => {
    const window = signal.slice(Math.max(0, i - windowSize), i + 1)
    return window.reduce((a, b) => a + b, 0) / window.length
  })
}

function findPeaks(signal, minDistance) {
  const peaks = []
  for (let i = 1; i < signal.length - 1; i++) {
    if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1]) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) peaks.push(i)
    }
  }
  return peaks
}

function stddev(values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

const POOR_FALLBACK = { avgBpm: 70, maxBpm: 70, hrvMs: null, signalQuality: 'POOR' }

/**
 * @param rawSignal 프레임마다 뽑은 밝기값(R 채널 평균) 배열
 * @param fps 샘플링 속도
 * @returns { avgBpm, maxBpm, hrvMs, signalQuality } — avgBpm/maxBpm은 항상 양수(백엔드가 필수값으로 요구),
 *   신뢰할 수 없으면 signalQuality:'POOR'로 표시하고 서버가 저장 시 폐기한다.
 */
// ponytail: 신뢰도 임계값(피크 6개 이상, 40~220bpm)은 대략치 — 실측 데이터로 조정 필요.
export function computeBpmResult(rawSignal, fps) {
  if (rawSignal.length < fps * 4) return POOR_FALLBACK

  const smoothed = smooth(detrend(rawSignal))
  const minDistance = Math.floor((fps * 60) / 200)
  const peaks = findPeaks(smoothed, minDistance)
  if (peaks.length < 2) return POOR_FALLBACK

  const intervalsMs = peaks.slice(1).map((p, i) => ((p - peaks[i]) / fps) * 1000)
  const avgBpm = Math.round(60000 / (intervalsMs.reduce((a, b) => a + b, 0) / intervalsMs.length))
  const maxBpm = Math.round(60000 / Math.min(...intervalsMs))
  const hrvMs = intervalsMs.length > 1 ? Math.round(stddev(intervalsMs)) : null
  const plausible = avgBpm >= 40 && avgBpm <= 220
  if (!plausible) return { ...POOR_FALLBACK, hrvMs }

  return { avgBpm, maxBpm, hrvMs, signalQuality: peaks.length >= 6 ? 'GOOD' : 'POOR' }
}
