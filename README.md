# AC/DC Frontend

AC/DC 역량평가 시뮬레이터의 웹 프론트엔드입니다. 참가자가 **서류함**과 **역할수행** 과제를 수행하고, AI 채점 결과를 확인합니다.
Vue 3 + Vite + Vue Router로 만들었고, 백엔드(Spring)의 REST API만 호출합니다(AI 서버는 직접 호출하지 않습니다).

## 화면

| 경로 | 화면 | 로그인 |
| --- | --- | --- |
| `/login`, `/signup` | 이메일/비밀번호 로그인·가입, Google 로그인 | 불필요 |
| `/oauth-success` | Google 로그인 후 1회용 `code`를 토큰으로 교환 | 불필요 |
| `/home` | 서류함·역할수행 진입(시나리오 선택), 내 기록 | 필요 |
| `/inbasket/:id` | 서류함: 상황·안건·자료 열람, 답안 작성(자동 저장), 타이머, 제출 | 필요 |
| `/roleplay/:id` | 역할수행: 카메라·마이크 확인 후 영상통화 형식 면담(좌: 자료, 우: 상대역 아바타 큰 화면 + 내 얼굴 작은 화면), 음성 인식 또는 텍스트 입력, 타이머, 제출 | 필요 |
| `/result/:id` | 역량별 점수·근거·피드백, 대화 기록 또는 제출 답안 | 필요 |

로그인하지 않고 필요 경로에 들어가면 `/login`으로, 로그인한 상태로 `/login`·`/signup`에 들어가면 `/home`으로 이동합니다(`src/router.js`).

## 실행

```bash
npm install
cp .env.example .env     # VITE_BACKEND_BASE_URL 확인
npm run dev              # http://localhost:5173
npm run build            # dist/ 생성
```

백엔드(8080)가 떠 있어야 합니다. 루트의 `make dev-deps`, `make dev-backend`, `make dev-ai`로 띄우거나 `make up`으로 전체를 Docker로 실행합니다.

### 환경변수

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `VITE_BACKEND_BASE_URL` | 필수 | 브라우저가 접근하는 백엔드 주소. 예: `http://localhost:8080` |
| `VITE_API_BASE_URL` | 선택 | API 호출 기준 주소. 기본값은 `VITE_BACKEND_BASE_URL` |
| `VITE_MEDIAPIPE_WASM_URL` | 선택 | MediaPipe wasm 주소. 기본값은 jsDelivr CDN(`tasks-vision@0.10.18`) |
| `VITE_DEMO_SKIP` | 개발·데모 전용 | `true`면 과제 숙지 화면에 건너뛰기 버튼이 보인다. 운영에서는 설정하지 않는다 |
| `VITE_FACE_LANDMARKER_MODEL_URL` | 선택 | 얼굴 랜드마크 모델 주소. 기본값은 Google 공개 저장소 |

Vite는 **빌드 시점**에 값을 번들에 넣습니다. 값을 바꾸면 다시 빌드해야 합니다.

### Docker

`Dockerfile`이 `npm run build` 결과를 nginx로 서빙합니다. 새로고침한 `/home` 같은 경로도 `index.html`로 보냅니다(`nginx.conf`).

```bash
docker build --build-arg VITE_BACKEND_BASE_URL=http://localhost:8080 -t acdc-frontend .
docker run -p 5173:80 acdc-frontend
```

루트 `docker-compose.yml`은 이 build arg를 자동으로 넘깁니다.

## 구조

```
src/
├── main.js, App.vue, router.js, style.css
├── config/env.js            # 환경변수 읽기(VITE_BACKEND_BASE_URL 필수)
├── api/
│   ├── client.js            # 공통 요청: {success,code,message,data} 봉투 해제, 401이면 reissue 1회 후 재시도, 토큰 저장
│   ├── auth.js              # 가입·로그인·Google·재발급·로그아웃·me
│   └── acdc.js              # 시나리오 목록, 세션 생성·조회·목록, 답안 저장, 발화·표정·음성 특징 전송, 제출
├── components/CounterpartAvatar.vue  # 상대역 SVG 아바타(눈 깜빡임, 말할 때 입 움직임, 생각 중 표시)
├── composables/
│   ├── useCountdown.js      # 세션 startedAt + 제한시간으로 남은 시간 계산
│   ├── useMediaCapture.js   # 카메라·마이크 스트림 획득/정리, 거부·장치 없음 사유(한국어)
│   ├── useFaceEmotion.js    # MediaPipe로 얼굴을 잘라 224x224 텐서로 만들어 3초마다 /emotions 전송
│   └── useAudioFeatures.js  # AudioWorklet 1초 창 음성 특징을 5초마다 배치 전송
└── pages/                   # 위 화면 표의 컴포넌트
```

스타일은 Tailwind를 `index.html`의 CDN으로 불러오고(`tailwind.config.js`), 일부 커스텀 CSS는 `src/style.css`에 있습니다.

## 백엔드 연동

모든 응답은 `{success, code, message, data}` 봉투입니다. 인증이 필요한 요청에는 `Authorization: Bearer <accessToken>`을 붙입니다.

| 용도 | API |
| --- | --- |
| 가입·로그인 | `POST /api/v1/auth/signup`, `POST /api/v1/auth/login` |
| Google 로그인 | 브라우저를 `/api/oauth2/authorization/google`로 이동 → 백엔드가 `/oauth-success?code=…`로 되돌림 → `POST /api/v1/auth/oauth/token` |
| 재발급·로그아웃·내 정보 | `POST /api/v1/auth/reissue`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me` |
| 시나리오·세션 | `GET /api/scenarios`, `POST /api/sessions`, `GET /api/sessions`(내 기록), `GET /api/sessions/{id}` |
| 서류함 | `PUT /api/sessions/{id}/answer` → `POST /api/sessions/{id}/submit` |
| 역할수행 | `POST /api/sessions/{id}/turns`(발화 → AI 응답), `POST /api/sessions/{id}/emotions`, `POST /api/sessions/{id}/audio-features` → `POST /api/sessions/{id}/submit` |

토큰은 `localStorage`(`accessToken`, `refreshToken`, `authUser`)에 저장합니다. API 계약 전체는 `backend/README.md`와 Notion 문서를 참고하세요.

## 역할수행 음성 입력

브라우저의 Web Speech API(`SpeechRecognition`, `ko-KR`)로 음성을 텍스트로 바꿉니다. 인식 결과는 입력창에 채워지고, 수정한 뒤 전송합니다.

- Chrome, Edge 등 지원 브라우저에서 마이크 권한을 허용해야 합니다. 인식은 브라우저(제공 업체) 서버를 거칩니다.
- 지원하지 않는 브라우저에서는 마이크 버튼이 숨겨지고 텍스트 입력만 쓸 수 있습니다.
- 서버의 `/stt/structure`는 사용하지 않습니다.

## 역할수행 영상통화와 수집 데이터

- 면담을 시작하기 전에 **카메라·마이크 확인** 화면을 거칩니다. 권한을 거부했거나 장치가 없으면 오류 사유만 보여주고 면담을 시작할 수 없습니다(이어하기 세션도 동일).
- 큰 화면은 상대역 SVG 아바타이고, AI 응답이 표시되는 동안 입이 움직입니다. 작은 화면(우하단)은 내 얼굴(좌우 반전)과 마이크 레벨입니다.
- **표정**: 3초마다 한 프레임에서 얼굴을 찾아(MediaPipe Face Landmarker) 224×224로 잘라 정규화한 수치 텐서를 `POST /api/sessions/{id}/emotions`로 보냅니다. 영상·이미지 파일은 보내지 않습니다. 얼굴이 없으면 `faceDetected:false`만 보냅니다. 표정 모델이 서버에 없는 등으로 3회 연속 실패하면 전송을 멈추고 "표정 분석 사용 불가"만 표시하며 대화는 계속됩니다.
- **음성**: 마이크 오디오를 1초 단위로 요약한 수치(`rms`, `zeroCrossingRate`, `speaking`, `speechDurationMs`, `silenceDurationMs`, `peakAmplitude`)를 5초마다 `POST /api/sessions/{id}/audio-features`로 보냅니다. 실패하면 최대 300개까지 보관해 다시 보내고, 제출 직전에 남은 것을 모두 보냅니다. 오디오 자체는 보내지 않습니다.
- 제출·시간 종료·화면 이탈 시 카메라, 마이크, MediaPipe, AudioContext를 모두 정리합니다.

## 알려진 제약

- 시나리오 JSON의 텍스트(상황·자료·안건)만 보여주며, 원본 PDF 뷰어는 연결하지 않았습니다.
- 표정 분석은 AI 서버에 ONNX 모델 파일이 있어야 결과가 나옵니다(없으면 위의 "사용 불가" 동작).
- 역할수행의 오프닝 대사는 화면에만 표시하고 서버 대화 기록에는 저장하지 않습니다.
- FT의 점수 확정 화면은 없습니다(`PUT /api/sessions/{id}/evaluations` API만 있습니다).
