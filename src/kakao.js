// 카카오맵 JS SDK를 1회만 동적 로드한다. 여러 곳에서 불러도 스크립트 태그는 하나.
let kakaoPromise = null

export function loadKakao() {
  if (kakaoPromise) return kakaoPromise
  kakaoPromise = new Promise((resolve, reject) => {
    if (window.kakao?.maps) return resolve(window.kakao)
    const key = import.meta.env.VITE_KAKAO_JS_KEY
    if (!key) return reject(new Error('VITE_KAKAO_JS_KEY가 설정되지 않았어요'))
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`
    script.onerror = () => reject(new Error('카카오맵 SDK 로드 실패'))
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao))
    document.head.appendChild(script)
  })
  return kakaoPromise
}

// 좌표 → 행정동 라벨("서울특별시 서대문구" 형식). 실패하면 null.
export async function reverseGeocode(lat, lng) {
  const kakao = await loadKakao()
  const geocoder = new kakao.maps.services.Geocoder()
  return new Promise((resolve) => {
    geocoder.coord2RegionCode(lng, lat, (result, status) => {
      if (status !== kakao.maps.services.Status.OK || !result.length) return resolve(null)
      const region = result.find((r) => r.region_type === 'H') ?? result[0]
      resolve([region.region_1depth_name, region.region_2depth_name].filter(Boolean).join(' '))
    })
  })
}
