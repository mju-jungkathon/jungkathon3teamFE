# AfterGrow — 디자인 시스템

이 문서는 **`src/index.css`와 `src/components/*`에 실제로 들어 있는 값만** 적은 것이다.
새 화면을 만들거나 UI를 고칠 때는 여기 있는 토큰·패턴을 조합해서 쓰고, 여기 없는 값을
새로 만들지 않는다. 값이 바뀌면 코드와 이 문서를 **같이** 고친다.

## 출처

Claude Design 프로젝트 [AfterGrow 홈 대시보드 리디자인](https://claude.ai/design/p/85035b5b-7002-4bc4-8da8-dfe982dd8fa0)의
`AfterGrow v2.dc.html`을 React로 옮긴 결과다. 토큰 값은 그 파일이 참조하는
`nike-commerce-design-system` 디자인 시스템의 `tokens/*.css`에서 그대로 가져왔다.

> ⚠️ **v1(Exposure Ring, 다크 테마)은 폐기됐다.** 코랄레드(`#e4572e`)·앰버(`#f5a623`) 축과
> `--canvas:#15171b` 같은 v1 토큰은 더 이상 코드에 없다. 예전 스크린샷이나 대화를 근거로
> 값을 되살리지 말 것.

---

## 1. 색

### 베이스 램프 — 화면의 95%
| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--ink` | `#111111` | 본문 텍스트, 기본 CTA 배경, 그래프의 값 부분, 선택 상태 |
| `--canvas` | `#ffffff` | 페이지 바탕, ink 위 텍스트 |
| `--soft-cloud` | `#f5f5f5` | 유일한 보조 면(결과 블록, 시트 헤더 아바타 영역, secondary 버튼) |
| `--charcoal` | `#39393b` | 본문 보조 텍스트 |
| `--ash` | `#4b4b4d` | (보유, 현재 미사용) |
| `--mute` | `#707072` | 캡션·레이블 |
| `--stone` | `#9e9ea0` | 비활성 텍스트, ink 면 위의 보조 텍스트 |
| `--hairline` | `#cacacb` | 1px 구분선(진한 쪽), 입력·칩 테두리 |
| `--hairline-soft` | `#e5e5e5` | 1px 구분선(연한 쪽), 데이터 행 구분, 게이지 트랙 |

### 시그널 색 — 의미가 있을 때만
| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--sale` | `#d30005` | **심박수 수치**, 측정 실패, 권한 거부, 폼 에러, 일요일 요일 헤더 |
| `--success` | `#007d48` | 완료·양호·연결됨 (러닝 추천 시간대, 신호 품질, 액션 완료) |
| `--info` | `#1151ff` | 시스템에는 있으나 이 앱에서는 **아직 안 씀** |

카테고리 액센트(핑크/퍼플/틸)는 이 앱에 들어오지 않았다.

---

## 2. 타이포

폰트는 3계층이고 **중간이 없다.**

```
--font-display-campaign : 'Bebas Neue' → Pretendard(한글) → Helvetica/Arial
--font-display          : 'Inter' → Pretendard(한글) → Helvetica/Arial
--font-text             : 'Inter' → Pretendard(한글) → Helvetica/Arial
```

Bebas Neue에는 한글 글리프가 없어 한글 디스플레이 텍스트는 Pretendard로 폴백된다.
숫자·영문 헤드라인만 Bebas의 압축된 대문자 느낌이 살아난다 — 의도된 스택이다.

### 스케일
`--text-xl:32` · `--text-lg:24` · `--text-md:16` · `--text-sm:14` · `--text-xs:12`
`--weight-regular:400` · `--weight-medium:500`
`--leading-display:.9` · `--leading-tight:1.2` · `--leading-body:1.5` · `--leading-loose:1.75`

### 조합 토큰 (`font:` 축약형으로 통째로 쓴다)
| 토큰 | 실제 값 | 쓰임 |
|---|---|---|
| `--type-heading-lg` | 500 24/1.2 display | 섹션 제목 (`.h-lg`) |
| `--type-body-md` | 400 16/1.5 text | 본문 (`.body`, charcoal과 함께) |
| `--type-body-strong` | 500 16/1.5 text | 데이터 행의 값, 항목 제목 |
| `--type-button-lg` | 500 24/1.2 display | `.btn.lg` |
| `--type-button-md` | 500 16/1.5 text | `.btn` 기본, 탭 |
| `--type-button-sm` | 500 14/1.5 text | 칩 |
| `--type-caption-md` | 500 14/1.5 text | 레이블 (`.cap`) |
| `--type-caption-sm` | 500 12/1.5 text | 보조 설명, 탭바 (`.cap-sm`) |

### 디스플레이 티어 (`.display` = campaign 폰트 + line-height .9)
크기는 토큰이 아니라 **자리마다 인라인으로** 지정한다. 코드에 실제로 쓰인 값:

| px | 자리 |
|---|---|
| 76 | 러닝 중 경과 시간 |
| 64 | 홈 `TODAY'S UV 6` |
| 56 | 이번 주 완료 횟수 |
| 54 / 52 | 로그인 히어로 타이틀 / `READY TO RUN`, 온보딩 인사 |
| 46 / 44 | 쿨다운 타이머 / 화면 타이틀(`심박수를 확인할까요`), 워치 BPM 수치 |
| 40 / 38 | 기록 상세 수치, 목표 횟수 / 회복 가이드 수치 |
| 34 | 홈 최근 측정 BPM, 프로필 이름·이니셜 |
| 30 / 28 / 26 | 통계 수치 / 시트 타이틀 / 요약 통계 |
| 24 / 22 | 헤더 워드마크(`.wordmark`) / 러닝 오버레이 헤더, 로그인 로고 |
| 17 / 15 | 달력 날짜 / UV 예보 막대 위 숫자 |

---

## 3. 간격 · 모양 · 입체

**간격** (8px 베이스): `--space-xxs:2` `xs:4` `sm:8` `md:12` `lg:18` `xl:24` `xxl:30` `section:48`
화면 좌우 여백은 예외 없이 **20px** (`.section`).

**반경** — 컨테이너는 전부 각지고, 알약과 원만 둥글다.
| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--radius-none` | `0` | 카드·이미지·블록·시트 — **전부** |
| `--radius-input` | `24px` | 텍스트 입력 |
| `--radius-button` | `30px` | 모든 CTA, 배지 |
| `--radius-full` | `9999px` | 아이콘 버튼, 아바타, 점, 스텝퍼, 체크 |

**입체** — 드롭섀도가 하나도 없다.
- `--elevation-divider`: `1px solid var(--hairline)`
- `--elevation-inset-bottom`: `inset 0 -1px 0 var(--hairline-soft)` — 헤더 하단선
- 탭바 상단선은 `inset 0 1px 0 var(--hairline-soft)`

**모션** — 누름(tap collapse)이 전부다.
`--transition-press: transform 120ms ease-out, opacity 120ms ease-out`
`:active`에서 `opacity:.5` + `scale(.96~.99)`. 호버 상태는 정의하지 않는다.
시트만 예외로 `agFade` / `agSheetUp`(0.26s) / `agSheetDown`(0.24s) / `agRise`(0.3s)를 쓴다.

---

## 4. 컴포넌트 패턴

### 버튼 `.btn`
| 클래스 | 결과 |
|---|---|
| `.btn` | ink 배경 / canvas 텍스트, 30px 알약, min-height **48**, padding 16/32 |
| `.btn.lg` | 폰트 `--type-button-lg`, min-height **56** — 하단 도크 CTA는 항상 이것 |
| `.btn.sm` | padding 8/20, min-height 40 |
| `.btn.secondary` | soft-cloud 배경 / ink 텍스트 (테두리도 soft-cloud) |
| `.btn.full` | `width:100%` |
| `:disabled` | `opacity:.4`, 커서 not-allowed |

3번째 버튼 모양은 없다. 텍스트 링크가 필요하면 `text-decoration:underline` + ink.

### 배지 `.badge` / `.badge.inverse`
30px 알약, padding 4/12, `--type-caption-sm`. 기본은 흰 배경+hairline 테두리(`선택 사항`),
inverse는 ink 배경(`중강도`).

### 아이콘 버튼 `.icon-btn`
40×40 원, soft-cloud 배경(`.plain`이면 투명), 안의 SVG는 18px.
아이콘은 Lucide 스타일 인라인 SVG(`Icons.jsx`, stroke 2, round cap) — CDN 의존 없음.

### 데이터 행 `.row`
`space-between` + `padding:16px 0` + `border-top:1px solid var(--hairline-soft)`.
값은 `.v`(body-strong), 상태값은 `.v.ok`(success) / `.v.bad`(sale) / `.v.mute`(mute).
**카드가 아니라 선으로 묶는다** — 이 앱에는 테두리 카드가 없다.

### 통계 그리드 `.stat-grid.c2 / .c3`
`.stat`은 `.k`(caption-sm mute 레이블) + `.n`(display 30px 수치). 변형: `.n.xl`(40px),
`.n.hr`(sale — 심박수 전용), `.n .u`(단위, caption-md mute).
그룹 경계는 `.bordered-y` / `.bordered-b`.

### 선택 타일 `.pick`
hairline 테두리 + 좌측 정렬 텍스트(`.pt` 제목, `.pd` 설명). 선택되면 `.on`으로
ink 배경 반전(설명은 stone). 측정 방식 선택, 온보딩 목표 선택에 쓴다.

### 바텀시트 `Sheet.jsx`
`.sheet-backdrop`(rgba(17,17,17,.4), z-45) + `.sheet`(canvas, 각진 모서리, max-height 92%).
닫기는 내려가는 애니메이션 **230ms 후** `onClose`를 부른다. children에 `close` 콜백을 넘긴다.
`padded={false}`로 헤더/지도를 화면 끝까지 붙일 수 있다(기록 상세).

### 링 게이지 `RingGauge.jsx`
이중 링. 바깥 r=62 `--ink`(UV 노출), 안쪽 r=45 `--sale`(심박), 트랙은 `--hairline-soft`,
stroke 10. 가운데 숫자는 campaign 폰트 44px.
**쓰는 곳은 세 군데뿐**: 워치 결과(160), rPPG 결과(160), 홈 최근 측정 요약(72, 숫자 없음).

### 경로 지도 `RunMap.jsx`
soft-cloud 바탕 + hairline 격자 + ink 경로. 러닝 중에는 `offset`으로 그려지고
`animateMotion`으로 점이 돈다. 기록 상세에서는 완주 경로 + 시작점만 보여준다.
**실제 GPS/지도 제공자는 아직 연동 전** — `path`를 실좌표로 바꾸면 그대로 동작한다.

### 화면 크롬
- `.hdr` — 56px, 좌측 `.wordmark`(campaign 24px, letter-spacing .04em), 하단 인셋 라인
- `.tabbar` — 72px, 3탭, 활성 탭은 ink + `inset 0 2px 0` 상단 밑줄
- `.cta-dock` — 하단 고정 CTA. 흰색 그라디언트 페이드로 스크롤 콘텐츠 위에 얹는다.
  `.above-tabs`(홈, bottom:72) / `.at-bottom`(러닝 오버레이)
- 러닝 오버레이 — `position:absolute; inset:0; z-index:20`, 자체 헤더 + CTA 도크

---

## 5. 화면 구조

```
Auth (미로그인)            히어로 이미지 + 로그인/회원가입 탭 + 약관 시트
 └ Onboarding (가입 직후)  목표 유형 4개 + 주간 횟수 → 저장 후 홈
Home                       UV 예보 막대 → 이번 주 목표 → 요약 통계 → 최근 측정
History                    월 이동 + 월간 요약 + 달력(점=기록) → 날짜 탭 시 상세 시트
Profile                    프로필 → 누적 통계 → 목표/연동/알림 행 → 목표 수정·로그아웃 시트
RunOverlay (전체화면)      start → tracking → vitals → scan → solution
```

러닝 단계 전환은 전부 **하단 도크 CTA 하나**로만 일어난다(`RunOverlay.jsx`의 `cta()`).
1초 틱 하나(`App.jsx`의 `tick()`)가 경과 시간·rPPG 측정·쿨다운 타이머를 함께 굴린다.

---

## 6. 왜 이렇게 디자인했는가

- **데이터가 주인공이고 색은 신호다.** 화면 대부분은 흑백이고, 유채색은 의미가 있을 때만
  나온다 — 심박수와 실패는 `--sale`, 완료·양호는 `--success`. 그래서 화면을 훑을 때
  "빨간 숫자 = 심박, 초록 = 정상"이 즉시 읽힌다. UV는 색이 아니라 **막대 높이와 명도**로
  표현한다(지금 시간대만 ink, 지수 6 이상은 charcoal, 나머지는 hairline).
- **카드를 없애고 선으로 묶는다.** 테두리·그림자·둥근 모서리로 정보를 감싸면 390px 폭에서
  중첩된 상자만 남는다. 헤어라인 한 줄이면 충분하고, 그만큼 수치를 크게 쓸 수 있다.
- **타이포 점프가 위계다.** 76~40px 캠페인 숫자와 12~16px UI 텍스트 사이에 중간 단계를
  두지 않는다. 러닝 중에 눈에 들어와야 하는 건 시간·거리·페이스 세 개뿐이다.
- **CTA는 언제나 화면 맨 아래 하나.** 러닝 플로우는 한 손으로, 뛰다 멈춰서 누른다는 전제다.
  단계별로 라벨만 바뀌고 위치는 고정이므로 다음 동작을 찾을 필요가 없다.
- **링 게이지는 결과에만.** UV와 심박을 한 번에 보여주는 유일한 상징이라 강한 대신,
  여러 곳에 반복하면 즉시 장식이 된다. 결과 화면 2곳 + 홈 요약 1곳으로 제한한다.
- **폰 목업 프레임은 데스크톱 프레젠테이션용이다.** 심사·시연을 노트북으로 볼 때 앱처럼
  보이게 하려는 장치이고, 600px 미만 실기기에서는 미디어쿼리로 벗겨져 화면을 꽉 채운다.
  프레임은 디자인의 일부가 아니라 무대다.

---

## 7. 절대 하지 않는 것

- **드롭섀도를 넣지 않는다.** 입체는 헤어라인과 인셋 라인 두 가지뿐이다.
- **컨테이너에 반경을 주지 않는다.** 둥근 건 CTA(30px), 입력(24px), 원형 요소뿐.
  카드/이미지/블록/시트는 전부 각진 0px.
- **`--sale`을 심박·실패·에러 외에 쓰지 않는다.** 강조가 필요하다고 빨강을 꺼내지 말 것.
- **`--success`를 상태 표시 외에 쓰지 않는다.** 초록 배경, 초록 버튼은 없다.
- **`--info`나 카테고리 액센트 색을 새로 도입하지 않는다.** 팔레트는 위 표가 전부다.
- **그라디언트·텍스처·블러를 쓰지 않는다.** 유일한 예외는 하단 CTA 도크의 흰색 페이드다.
- **링 게이지를 목록·반복 요소에 넣지 않는다.** 한 화면에 최대 1개.
- **버튼 모양을 새로 만들지 않는다.** primary / secondary 두 가지와 텍스트 링크가 전부다.
- **호버 스타일을 추가하지 않는다.** 이 시스템은 누름(press) 피드백만 정의한다.
- **이모지를 쓰지 않는다.** 체크 표시는 `✓` 문자 또는 Lucide 아이콘으로 한다.
- **좌우 여백 20px을 화면마다 다르게 두지 않는다.**
- **다크 테마를 만들지 않는다.** 라이트 단일 테마다.
