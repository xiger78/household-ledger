# Ledger (household-ledger)

엑셀 가계부 파일을 기반으로 한 **Android 네이티브 앱**입니다. (Expo + React Native)

프로젝트 경로: `~/work/household-ledger`

## 기능

- 월별 수입/지출 입력 (구분, 결제수단, 금액, 내용, 비고)
- 달력 뷰 (평일 勤 / 휴일 休, 일별 지출)
- 대시보드 (월별 요약, 차트, 결제수단별 통계)
- 엑셀 가져오기/보내기 (기존 `2026년달력` 형식 호환)
- **영수증 스캔** — 카메라로 촬영 시 OCR로 금액·날짜·가게명 자동 인식 후 지출 등록
- 저축 계획 설정 (월급, 상여, 고정비, 월세)

## 사전 요구사항

- Node.js 18+ (권장: `~/.nodebrew/node/v20.18.0`)
- JDK 17+ (`~/.jdks/jdk-17.0.19+10`)
- Android SDK (`~/Library/Android/sdk`)

## 실행 방법

### 1. 의존성 설치

```bash
export PATH="$HOME/.nodebrew/node/v20.18.0/bin:$PATH"
npm install
```

### 2. Android 에뮬레이터/기기에서 실행

```bash
export PATH="$HOME/.nodebrew/node/v20.18.0/bin:$PATH"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export JAVA_HOME="$HOME/.jdks/jdk-17.0.19+10/Contents/Home"

npm run android
```

### 3. APK 빌드 (디버그)

```bash
chmod +x scripts/android-build.sh
./scripts/android-build.sh
```

생성 위치: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Expo 개발 서버만 실행

```bash
npm start
```

## 엑셀 연동

| 시트 | 설명 |
|------|------|
| `지출기록_N월` | 월별 수입/지출 |
| `2026년달력` | 달력/예상지출 |
| `참조` | 결제수단, 평일/휴일 예상지출 |
| `2026년휴일` | 공휴일 |
| `2026저축계획` | 월급, 고정비 등 |

앱 **설정** 탭에서 엑셀 파일을 가져오거나보낼 수 있습니다.

## 프로젝트 구조

```
App.tsx                 # 메인 앱 (탭 네비게이션)
src/
  components/           # UI 컴포넌트
  store/database.ts     # AsyncStorage 데이터 저장
  utils/excel.ts        # 엑셀 가져오기/보내기
  types/                # 타입 정의
android/                # Android 네이티브 프로젝트
docs/screenshots/       # README용 화면 캡처
```

## 영수증 스캔 사용법

1. **내역** 또는 **달력** 탭에서 📷 버튼 탭
2. 카메라로 영수증 촬영 (또는 갤러리에서 선택)
3. OCR이 금액·날짜·가게명·결제수단을 자동 인식
4. **자동 등록** 또는 **수정 후 저장** 선택

일본어/한국어 영수증을 지원합니다 (ML Kit OCR).

## 결제수단

현금, 카드, 페이페이, 라쿠텐페이, 계좌이체
