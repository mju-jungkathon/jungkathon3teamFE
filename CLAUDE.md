# AfterGrow 프론트엔드

러닝 후 UV 노출·심박수 기반 회복 가이드 앱. 해커톤 제출용 웹(PWA) 버전.

## 지금 이 시점의 맥락 (중요)

디자인은 **Claude Design에서 완료되어 이 폴더로 핸드오프됐다.** 이 폴더에는 지금
`DESIGN.md`가 **없다** — 의도적으로 없는 것이다. 순서는 다음과 같다.

1. **`DESIGN.md`가 아직 없으면, 다른 작업을 시작하기 전에 먼저 만든다.** 핸드오프된
   실제 코드(`index.css`의 `:root` 토큰, 실제 컴포넌트 구조·스타일)를 읽고 역으로
   문서화하는 방식이다. 절대 이전 대화나 추측으로 값을 채우지 말고, **지금 코드에
   실제로 있는 값만** 반영한다.
   - 색상·타이포·간격·반경 토큰은 코드에서 그대로 추출
   - 컴포넌트 패턴(카드/버튼/배지 등)은 실제 CSS 클래스를 근거로 정리
   - "왜 이렇게 디자인했는가"와 "절대 하지 않는 것" 섹션은 코드만 봐서는 알 수 없으니,
     **작성 전에 나에게 몇 가지 확인 질문을 해서** 의도를 파악한 뒤 채운다
     (예: "이 앰버 색은 UV 전용으로 제한할까요, 다른 강조에도 써도 될까요?")
   - 작성 후 `DESIGN.md`로 저장하고 나에게 요약해서 보여준다
2. `DESIGN.md`가 이미 있으면(두 번째 세션부터는 있을 것이다), **그걸 소스 오브
   트루스로 따른다.** 새로 지어내지 않는다.
3. `DESIGN.md` 확정 후에야 아래 "API 연동" 섹션으로 넘어간다.

- **UI 비주얼 자체는 건드리지 않는다.** 이 파일이 다루는 건 완성된 UI에 실제
  동작(데이터·API·상태)을 배선하는 것이다.
- 화면 구조는 핸드오프된 실제 컴포넌트 트리를 기준으로 삼는다. 아래 "프로젝트 구조"는
  참고용이며 실제와 다르면 실제 구조를 우선한다.

## 스택

- React 18 + Vite 5 (순수 웹, React Native 아님)
- 상태관리: `useState`/`useContext` 우선, 복잡해지면 그때 라이브러리 검토
- 스타일: CSS 변수 토큰 기반 (`DESIGN.md` 참고). Tailwind 아님
- API: `axios`
- PWA: `vite-plugin-pwa`

## 명령어

```bash
npm run dev              # 개발 서버 (localhost:5173)
npm run dev -- --host    # 같은 와이파이의 폰에서 접속 (PWA 설치 테스트용)
npm run build             # 프로덕션 빌드 (서비스워커·매니페스트 포함)
npm run preview           # 빌드 결과 미리보기 — PWA는 반드시 이걸로 확인 (dev 서버는 SW 비활성)
```

---

## API 연동 — 실제 백엔드 명세 기준

**전체 명세는 `docs/API.md`를 반드시 먼저 읽을 것.** 여기는 실수하기 쉬운 지점만 요약한다.

### Base
- Base URL: `.env`의 `VITE_API_BASE_URL` (로컬 `http://localhost:8080`)
- 인증: `Authorization: Bearer {accessToken}` 헤더. `/auth/signup`, `/auth/login`, `/auth/refresh`,
  `GET /actuator/health`만 인증 불필요 — **`/auth/logout`도 인증 필요**함에 주의
- 응답 포맷: `{ success, data, error: {code, message} | null }` — 항상 이 껍데기로 옴

### 에러 코드 → UI 매핑
```yaml
E4001: 400 요청 값 검증 실패        # 폼 인라인 에러로 표시
E4010: 401 토큰 없음/만료/무효화됨   # refresh 시도 → 실패하면 로그인 화면으로
E4011: 401 로그인 이메일/비번 불일치 # 로그인 폼 에러로 표시 ("이메일 또는 비밀번호를 확인해주세요")
E4030: 403 남의 리소스 접근         # 404처럼 처리(존재 비노출이 의도). "찾을 수 없어요" 문구
E4040: 404 리소스 없음
E4090: 409 이미 진행 중인 러닝 세션  # "이미 진행 중인 러닝이 있어요" + 이어서 보기 유도
E4091: 409 이메일 중복              # 회원가입 폼 에러
E5000: 500 서버 오류                # 공통 에러 토스트
E5010: 502 애플 헬스 조회 실패      # 워치 연동 화면에서만
```

### 절대 놓치면 안 되는 동작 방식 (스펙에만 있고 코드 직관과 어긋나는 부분)

1. **rPPG는 2단계 제출 흐름이다.** `POST /heart-rate-measurements/rppg/start`로 `rppgSessionId`를
   먼저 발급받고(이때 DB엔 아무것도 안 쓰임), 12초 측정 후 `POST .../rppg/{rppgSessionId}/result`로
   결과를 제출해야 실제 레코드가 생긴다. **`rppgSessionId`는 1회용**이라 재제출 시 `404 E4040`.
2. **`signalQuality: "POOR"`도 에러가 아니라 `201`이다.** 이 경우 `avgBpm`/`hrvMs`는 `null`로 오고
   `syncStatus: "FAILED"`가 된다. try/catch가 아니라 응답 바디의 `syncStatus`로 재측정 유도 UI를
   분기할 것.
3. **러닝 종료(`.../end`), 회복 가이드 생성(`.../recovery-guide`)은 idempotent다.** 중복 클릭이나
   화면 재진입으로 다시 호출해도 에러 없이 기존 결과를 그대로 돌려준다 — 즉 "이미 처리됨" 에러
   핸들링을 별도로 만들 필요 없음. 그냥 다시 불러도 안전.
4. **회복 가이드(5.1)를 먼저 안 만들고 세션 완료(5.3)를 부르면 `404`다.** 화면 7 진입 시
   반드시 `POST .../recovery-guide` → `POST .../complete` 순서를 지킬 것.
5. **`GET .../live` 폴링에 `distanceKm`/`intensity`를 실어 보내면 서버 스냅샷이 갱신된다.**
   클라이언트가 로컬로 계산한 GPS 거리를 주기적으로 같이 보내는 용도 — 안 보내도 동작은 하지만
   서버 쪽 값이 갱신 안 됨.
6. **심박수 측정 방식 선택(4.1)은 값 저장이 안 된다.** `nextStep`만 보고 화면 분기용으로 쓸 것.
7. **애플 헬스(4.2, 4.3)는 서버가 HealthKit을 읽는 게 아니라 앱이 읽은 값을 올리는 구조다.**
   즉 프론트가 실제로 HealthKit에 접근할 방법이 없으면(웹이라 원천적으로 불가) 이 두 엔드포인트는
   실사용이 불가능하다 — **워치 연동 화면은 이번 스프린트에서 목업으로 유지**하고 굳이 이 API를
   호출하려 하지 말 것. (자세한 이유는 아래 "웹의 구조적 한계" 참고)
8. **`range` 쿼리 파라미터는 `"30d"` 형식만 허용**한다(주/월 단위 없음). 잘못 보내면 `E4001`.

### 화면 진입 시 호출 순서 (재확인용)
```
로그인          → POST /auth/login → 토큰 저장 → GET /home
러닝 준비 화면   → GET /running-sessions/prepare?lat&lng
                 → (선택) POST /stretching-sessions
러닝 시작        → POST /running-sessions
러닝 진행 중     → GET /running-sessions/{id}/live (주기 폴링, distanceKm 실어보내기)
러닝 종료        → POST /running-sessions/{id}/end
방식 선택 화면   → POST /running-sessions/{id}/heart-rate/select-source
  ├─ WATCH  →  POST /integrations/apple-health/heart-rate  (실사용 불가, 목업 유지)
  └─ RPPG   →  GET  /heart-rate-measurements/rppg/guide
              → POST /heart-rate-measurements/rppg/start
              → (12초 측정)
              → POST /heart-rate-measurements/rppg/{rppgSessionId}/result
회복 가이드     → POST /running-sessions/{id}/recovery-guide
              → POST /recovery-guides/{id}/cooldown-timer/start
              → POST /running-sessions/{id}/complete
기록 화면       → GET /heart-rate-measurements?range=30d
              → (실패 기록) POST /heart-rate-measurements/{id}/retry
프로필 화면     → GET /users/me/profile
              → PATCH /users/me/goal / PATCH /users/me/notifications
```

---

## 웹의 구조적 한계 (설계 시 전제로 깔고 갈 것)

- **Apple Health / Samsung Health는 웹에서 접근 불가.** HealthKit은 온디바이스 전용 API라 브라우저가
  못 읽는다. `select-source`에서 `WATCH`를 고르면 다음 화면은 실제 데이터 대신 **직접 입력 폼 또는
  목업**으로 대체한다. (백엔드 API 자체는 존재하지만 프론트가 값을 채울 방법이 없다는 뜻)
- **rPPG 플래시 제어는 안드로이드 Chrome/삼성 인터넷만 지원, iOS Safari는 미지원.** 미지원 브라우저는
  플래시 없이 측정을 시도하거나 "밝은 곳에서 측정해주세요" 안내로 대체.
- **GPS는 화면이 켜진 포그라운드 상태에서만 안정적으로 동작한다.** 화면이 잠기거나 앱이
  백그라운드로 가면 위치 갱신이 멈출 수 있음 — 데모/부스 시연(화면 유지)에는 문제없음.
- **`getUserMedia`/`geolocation` 둘 다 HTTPS 또는 localhost 필수.**

---

## PWA (설치 가능한 웹앱)

부스 시연·심사 모두 "링크 하나로 접속"이 기본이지만, 홈 화면에 설치해두면 주소창 없이
네이티브 앱처럼 보여서 데모 임팩트가 커진다. 아래를 반드시 갖출 것.

### 체크리스트
- [ ] `vite-plugin-pwa` 설치 및 `vite.config.js`에 등록
- [ ] `manifest`: `name`, `short_name`(AfterGrow), `theme_color`/`background_color`는
      `DESIGN.md`의 `--canvas`(`#ffffff`)와 일치시킬 것
- [ ] 아이콘 192×192, 512×512, `maskable` 버전 포함 (`RingGauge` 모티프 기반으로 제작 권장)
- [ ] `display: "standalone"` — 설치 시 브라우저 주소창 제거
- [ ] iOS 대응: `apple-touch-icon`, `apple-mobile-web-app-capable`,
      `apple-mobile-web-app-status-bar-style` 메타 태그 (iOS는 manifest만으론 부족)
- [ ] 서비스워커는 앱 셸(정적 자산)만 프리캐시. **API 응답을 캐싱하지 말 것** — 실시간 데이터
      (러닝 폴링, 심박수)가 오래된 캐시로 보이면 안 됨
- [ ] `npm run preview`로 실제 설치 테스트 (dev 서버는 서비스워커 비활성화됨)
- [ ] 오프라인 시 API 실패에 대한 최소한의 에러 UI (완전한 오프라인 지원은 스코프 아님)

### 하지 않는 것 (스코프 아님)
- 백그라운드 동기화, 푸시 알림 (iOS PWA는 제약 많고 일정상 불필요)
- API 응답의 오프라인 캐싱/큐잉

---

## 프로젝트 구조

> Claude Design 핸드오프 이후 실제 구조로 갱신 필요. 아래는 핸드오프 전 기준(참고용).

```
src/
├── App.jsx
├── index.css              디자인 토큰 (DESIGN.md와 항상 동기화 유지)
├── api/                    (신규) axios 클라이언트, 토큰 저장, 엔드포인트별 함수
│   ├── client.js
│   ├── tokenStore.js
│   └── {domain}.js         auth.js, running.js, heartRate.js, recovery.js, profile.js
└── components/
    ├── RingGauge.jsx        시그니처 이중 링 게이지 (UV + 심박)
    └── ...                  화면 컴포넌트들
docs/
├── API.md                  ⭐ 백엔드 전체 명세 원본 — 항상 최신 유지
```

## 환경변수

```
# .env.local (커밋 금지)
VITE_API_BASE_URL=http://localhost:8080

# .env.example (커밋 O)
VITE_API_BASE_URL=
```

## 현재 상태

- 백엔드 API 25개 엔드포인트 전부 구현 완료 (`docs/API.md` 참고)
- 프론트 디자인: Claude Design `AfterGrow v2` 임포트 완료 (v1 다크 테마는 폐기)
- `DESIGN.md`: 작성 완료 — 디자인 관련 판단은 여기를 소스 오브 트루스로 삼을 것
- API 연동: `src/api/` 클라이언트 세팅 완료 (`client.js` 공통 껍데기·토큰·refresh 재시도,
  `endpoints.js` 25개 함수). 화면 컴포넌트 배선은 미착수 — 다음 작업
- PWA: 완료 (`vite-plugin-pwa`, 매니페스트, 아이콘, iOS 메타 태그)

## 코드 컨벤션

- 컴포넌트는 함수형 + 기본 내보내기(default export)
- 파일명 PascalCase, API 함수 파일은 camelCase
- 커밋 메시지: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`
- 브랜치: `feature/*` → `main`
- 앱 이름 표기는 **AfterGrow** (afterglow 아님)
