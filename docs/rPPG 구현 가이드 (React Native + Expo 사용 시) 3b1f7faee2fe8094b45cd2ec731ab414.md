# rPPG 구현 가이드 (React Native + Expo 사용 시)

카메라 + 플래시 기반 접촉식 심박수(BPM) 측정

이 문서는 앱의 여러 기능 중 **rPPG(심박수 측정) 기능만**을 다룹니다. 러닝 트래킹, 지도, 백그라운드 위치 추적 등 다른 기능은 포함하지 않습니다.

---

## 목차

1. 문서 개요
2. 프로젝트 설정 (카메라 권한)
3. 카메라 + 플래시 제어
4. 실시간 프레임 캡처 (밝기값 추출)
5. 신호처리 & BPM 계산
6. 측정 화면 컴포넌트
7. 백엔드 API 연동
8. 마무리

---

## 1. 문서 개요

rPPG 측정은 손가락을 후면 카메라 + 플래시에 완전히 밀착시켜, 혈류에 의한 미세한 밝기 변화를 프레임 단위로 읽어내는 방식입니다.

```
손가락 밀착 (카메라+플래시 덮음)
        │
        ▼
카메라 프레임을 초당 15~30회 캡처
        │
        ▼
프레임마다 밝기값(R 채널 평균) 추출
        │
        ▼
신호처리 (detrend → smooth → findPeaks)
        │
        ▼
BPM 계산 → 백엔드로 전송
```

React Native에서는 웹(Capacitor)과 달리 iOS에서도 플래시 제어가 표준 API로 정상 동작하고, 프레임 단위 실시간 분석을 위해 `react-native-vision-camera`를 사용합니다.

---

## 2. 프로젝트 설정 (카메라 권한)

```bash
npx expo install react-native-vision-camera react-native-worklets-core
```

**app.json**

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-vision-camera",
        {
          "cameraPermissionText": "심박수 측정을 위해 카메라 접근이 필요합니다."
        }
      ]
    ]
  }
}
```

**코드 설명**

- **react-native-vision-camera**: 카메라 프레임을 실시간으로 가로채 픽셀 데이터를 분석할 수 있게 해주는 라이브러리입니다. rPPG처럼 초당 수십 프레임을 분석해야 하는 작업에는 사실상 표준으로 쓰입니다.
- **cameraPermissionText**: iOS에서 카메라 권한을 요청할 때 사용자에게 보여줄 설명 문구입니다. 이 문구가 없으면 iOS 빌드 자체가 거부되거나 크래시합니다.

---

## 3. 카메라 + 플래시 제어

**[코드 3-1] useTorchCamera.ts**

```tsx
import { useState, useCallback } from "react";
import { Camera } from "react-native-vision-camera";

export function useTorchCamera() {
  const [hasPermission, setHasPermission] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const requestPermission = useCallback(async () => {
    const status = await Camera.requestCameraPermission();
    const granted = status === "granted";
    setHasPermission(granted);
    return granted;
  }, []);

  const startTorch = useCallback(() => setTorchOn(true), []);
  const stopTorch = useCallback(() => setTorchOn(false), []);

  return { hasPermission, requestPermission, torchOn, startTorch, stopTorch };
}
```

**코드 설명**

- **Camera.requestCameraPermission()**: vision-camera가 제공하는 권한 요청 함수입니다. 반드시 측정 화면 진입 시 먼저 호출해야 합니다.
- **torchOn**: 이 상태값을 아래 화면 컴포넌트에서 `<Camera torch={torchOn ? "on" : "off"} />`처럼 prop으로 바로 넘기면 플래시가 켜지고 꺼집니다. Capacitor 때처럼 웹/앱을 분기하는 별도 모듈이 필요 없습니다 — vision-camera 하나로 iOS/Android 모두 동일하게 동작합니다.

---

## 4. 실시간 프레임 캡처 (밝기값 추출)

**[코드 4-1] useBrightnessSampler.ts**

```tsx
import { useFrameProcessor } from "react-native-vision-camera";
import { runOnJS } from "react-native-worklets-core";

export function useBrightnessSampler(onSample: (value: number) => void) {
  return useFrameProcessor((frame) => {
    "worklet";
    // 프레임 중앙 영역의 R 채널 평균 밝기를 계산합니다.
    // 픽셀 버퍼 접근은 vision-camera의 프레임 프로세서 플러그인을 통해 이루어지며,
    // 아래는 개념적인 흐름입니다 (실제 픽셀 연산은 네이티브 플러그인이 담당).
    const brightness = getAverageBrightness(frame); // 네이티브 플러그인 함수
    runOnJS(onSample)(brightness);
  }, [onSample]);
}
```

**코드 설명**

- **"worklet"**: 이 코드가 JS 메인 스레드가 아니라 별도의 고성능 스레드에서 실행된다는 표시입니다. 카메라가 매 프레임(초당 15~30회) 이 콜백을 호출해도 UI가 버벅이지 않습니다.
- **getAverageBrightness(frame)**: 프레임의 픽셀 데이터에서 R 채널 평균을 구하는 부분으로, 실제로는 vision-camera의 Frame Processor Plugin(네이티브 코드, Swift/Kotlin)으로 구현해야 합니다. 이 픽셀 연산 자체는 JS만으로는 처리 속도가 부족해서 네이티브 플러그인으로 위임하는 것이 일반적입니다.
- **runOnJS(onSample)(brightness)**: worklet(별도 스레드)에서 계산한 값을 다시 일반 JS 코드(React state 업데이트 등)로 넘길 때 사용합니다. 이 브릿지를 거치지 않으면 React 컴포넌트가 값 변화를 인식하지 못합니다.

> 웹(Capacitor) 버전에서는 `canvas.getImageData()`로 브라우저가 픽셀 데이터를 바로 내줬지만, React Native에는 이런 브라우저 API가 없어서 네이티브 플러그인을 거쳐야 한다는 점이 가장 큰 구조적 차이입니다.
> 

---

## 5. 신호처리 & BPM 계산

이 부분은 **플랫폼과 무관한 순수 TypeScript 함수**라서 웹(Capacitor) 버전에서 쓰던 코드를 파일 그대로 복사해서 재사용합니다.

**[코드 5-1] bpmProcessor.ts**

```tsx
/** 이동평균으로 저주파(조명 변화, 손떨림 등) 제거 */
function detrend(signal: number[], windowSize = 15): number[] {
  const result: number[] = [];
  for (let i = 0; i < signal.length; i++) {
    const start = Math.max(0, i - windowSize);
    const window = signal.slice(start, i + 1);
    const avg = window.reduce((a, b) => a + b, 0) / window.length;
    result.push(signal[i] - avg);
  }
  return result;
}

/** 간단한 이동평균 저역통과 필터 (고주파 노이즈 제거) */
function smooth(signal: number[], windowSize = 3): number[] {
  const result: number[] = [];
  for (let i = 0; i < signal.length; i++) {
    const start = Math.max(0, i - windowSize);
    const window = signal.slice(start, i + 1);
    result.push(window.reduce((a, b) => a + b, 0) / window.length);
  }
  return result;
}

/** 피크(극대점) 검출 */
function findPeaks(signal: number[], minDistance: number): number[] {
  const peaks: number[] = [];
  for (let i = 1; i < signal.length - 1; i++) {
    if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1]) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
        peaks.push(i);
      }
    }
  }
  return peaks;
}

/**
 * @param rawSignal 원시 밝기값 배열
 * @param fps 샘플링 프레임레이트 (예: 20)
 * @returns BPM 또는 null (신호 불충분 시)
 */
export function computeBPM(rawSignal: number[], fps: number): number | null {
  if (rawSignal.length < fps * 4) return null; // 최소 4초 분량 필요

  const detrended = detrend(rawSignal);
  const smoothed = smooth(detrended);

  // 심박수 40~200bpm 범위 → 최소 피크 간격 계산 (200bpm 기준)
  const minDistance = Math.floor((fps * 60) / 200);
  const peaks = findPeaks(smoothed, minDistance);

  if (peaks.length < 3) return null;

  const intervals = peaks.slice(1).map((p, i) => p - peaks[i]);
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = (fps * 60) / avgInterval;

  if (bpm < 40 || bpm > 220) return null; // 생리학적으로 불가능한 값 필터링
  return Math.round(bpm);
}
```

**코드 설명**

- **detrend()**: 원본 신호에는 심박에 의한 미세한 변화 외에, 손가락 밀착도 변화나 플래시 밝기 안정화 같은 느린(저주파) 변화도 섞여 있습니다. 각 지점에서 직전 구간의 이동평균을 빼면 이 저주파 성분이 제거되고 심박에 의한 빠른 진동만 남습니다.
- **smooth()**: 반대로 카메라 센서의 미세한 노이즈(고주파)를 줄이기 위해 짧은 창으로 다시 평균을 냅니다. detrend + smooth를 합치면 결과적으로 심박수 범위(0.67~3.3Hz)만 남기는 대역통과 필터 역할을 합니다.
- **findPeaks()**: 전처리된 신호에서 극대점을 피크로 판단합니다. `minDistance`로 너무 가까운 피크의 중복 검출을 막습니다 (아무리 빨라도 200bpm을 넘기 어렵다는 생리학적 가정 이용).
- **computeBPM()**: 피크 간 평균 간격을 시간(초)으로 환산해 분당 박동수로 바꾸고, 40~220bpm 범위를 벗어나면 신뢰할 수 없다고 보고 `null`을 반환합니다.

---

## 6. 측정 화면 컴포넌트

**[코드 6-1] MeasurementScreen.tsx**

```tsx
import { useRef, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import { useTorchCamera } from "../camera/useTorchCamera";
import { useBrightnessSampler } from "../camera/useBrightnessSampler";
import { computeBPM } from "../signal/bpmProcessor";
import { submitMeasurement } from "../api/measurementApi";

const FPS = 20;
const MEASURE_SECONDS = 12;

export default function MeasurementScreen({ sessionId }: { sessionId: string }) {
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission, torchOn, startTorch, stopTorch } = useTorchCamera();
  const signalRef = useRef<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSample = (value: number) => {
    signalRef.current.push(value);
    if (signalRef.current.length >= FPS * MEASURE_SECONDS) {
      const result = computeBPM(signalRef.current, FPS);
      setBpm(result);
      setMeasuring(false);
      stopTorch();
      if (result) {
        submitMeasurement({ bpm: result, sessionId }).catch(console.error);
      } else {
        setError("신호가 불안정합니다. 손가락 위치를 조정하고 다시 시도하세요.");
      }
    }
  };

  const frameProcessor = useBrightnessSampler(onSample);

  const handleStart = async () => {
    const granted = hasPermission || (await requestPermission());
    if (!granted) {
      setError("카메라 권한이 필요합니다.");
      return;
    }
    signalRef.current = [];
    setBpm(null);
    setError(null);
    startTorch();
    setMeasuring(true);
  };

  if (!device) return <Text>카메라를 찾을 수 없습니다.</Text>;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={measuring}
        torch={torchOn ? "on" : "off"}
        frameProcessor={frameProcessor}
      />
      <View style={styles.overlay}>
        {error && <Text style={styles.error}>{error}</Text>}
        <Button
          title={measuring ? "측정 중... 손가락을 밀착하세요" : "측정 시작"}
          onPress={handleStart}
          disabled={measuring}
        />
        {bpm && <Text style={styles.result}>측정 결과: {bpm} BPM</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { position: "absolute", bottom: 40, left: 0, right: 0, alignItems: "center" },
  error: { color: "red", marginBottom: 8 },
  result: { fontSize: 20, marginTop: 8 },
});
```

**코드 설명**

- **useCameraDevice("back")**: vision-camera에서 후면 카메라 장치를 가져옵니다. 손가락을 밀착시켜야 하므로 반드시 후면(플래시가 있는 쪽)을 사용합니다.
- **torch={torchOn ? "on" : "off"}**: `Camera` 컴포넌트의 prop 하나로 플래시가 제어됩니다. iOS/Android 모두 동일하게 동작해서, Capacitor 때 필요했던 플랫폼별 분기 코드가 사라졌습니다.
- **isActive={measuring}**: 측정 중이 아닐 때는 카메라 세션을 비활성화해서 배터리를 아낍니다.
- **frameProcessor**: 4장에서 만든 밝기값 샘플러를 그대로 연결합니다. 카메라가 활성화된 동안 자동으로 프레임마다 호출됩니다.
- **onSample 내부 종료 조건**: 지정된 시간(12초)만큼 샘플이 쌓이면 `computeBPM`을 호출하고, 성공하면 백엔드로 전송, 실패하면 재측정을 안내합니다.

---

## 7. 백엔드 API 연동

**[코드 7-1] measurementApi.ts**

```tsx
const API_BASE_URL = __DEV__
  ? "http://10.0.2.2:8080"       // Android 에뮬레이터에서 PC 로컬 서버 접근용 별칭
  : "https://your-backend.awsapprunner.com";

interface SubmitResult {
  bpm: number;
  sessionId: string;
}

export async function submitMeasurement({ bpm, sessionId }: SubmitResult) {
  const response = await fetch(`${API_BASE_URL}/api/measurements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bpm,
      sessionId,
      measuredAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`측정 결과 전송 실패: ${response.status}`);
  }
  return response.json();
}
```

**코드 설명**

- **`__DEV__`**: Expo/React Native가 기본 제공하는 전역 변수로, 개발 모드인지 프로덕션 빌드인지 자동으로 구분해줍니다.
- **10.0.2.2**: Android 에뮬레이터 안에서 이 주소로 요청하면 실제로는 개발 PC의 `localhost`로 연결됩니다. 실기기 테스트 시에는 같은 Wi-Fi 상의 PC 실제 IP로 바꿔야 합니다.
- 백엔드가 기대하는 `bpm`, `sessionId`, `measuredAt` 필드명이 백엔드 가이드의 `MeasurementRequest` DTO와 정확히 일치해야 정상적으로 저장됩니다.

---

## 8. 마무리

```
src/
├── camera/
│   ├── useTorchCamera.ts        // 카메라 권한 + 플래시 제어
│   └── useBrightnessSampler.ts  // 프레임에서 밝기값 추출
├── signal/
│   └── bpmProcessor.ts          // 신호처리 & BPM 계산 (웹 버전과 동일 로직)
├── screens/
│   └── MeasurementScreen.tsx    // 측정 화면
└── api/
    └── measurementApi.ts        // 백엔드 API 연동
```

**핵심 정리**

1. 신호처리 로직(`bpmProcessor.ts`)은 순수 TypeScript라 플랫폼이 바뀌어도 **완전히 동일하게 재사용**됩니다.
2. 플래시 제어는 `react-native-vision-camera`의 `torch` prop 하나로 iOS/Android 모두 동일하게 동작합니다 — 별도의 플랫폼 분기 코드가 필요 없습니다.
3. 실시간 프레임 분석은 expo-camera가 아니라 **react-native-vision-camera의 Frame Processor**를 사용해야 성능이 충분합니다.
4. 픽셀 밝기값을 뽑아내는 부분은 네이티브 플러그인(Swift/Kotlin)이 필요한 영역이라, 실제 구현 시점에는 vision-camera의 최신 프레임 프로세서 플러그인 문서를 확인하는 것을 권장합니다.