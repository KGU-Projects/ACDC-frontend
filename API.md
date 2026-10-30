BaseUrl: cameron-hereditary-suppositively.ngrok-free.dev

프론트엔드 연동용 API 명세입니다. REST는 세션 생성, 면접 시작, 상태 변경, 결과 조회처럼 명령/조회 성격의 요청을 담당하고, WebSocket은 질문 생성 완료, 다음 질문, 실시간 표정 분석처럼 비동기 이벤트를 담당합니다.

## 기본 정보

- REST 기본 경로: `/api`
- WebSocket 연결 경로: `/api/ws-interview`
- STOMP 서버 수신 prefix: `/app`
- STOMP 구독 prefix: `/topic`
- 인증: 별도 표시가 없는 REST 요청은 `Authorization: Bearer {accessToken}` 헤더가 필요합니다.
- WebSocket 핸드셰이크도 현재 인증 대상입니다. 브라우저 SockJS 클라이언트에서 핸드셰이크 요청에 `Authorization` 헤더를 실을 수 없다면, 프론트엔드/백엔드가 토큰 전달 방식을 별도로 합의해야 합니다.
- 공통 응답 형식:

```json
{
  "success": true,
  "code": null,
  "message": "Success",
  "data": {},
  "timestamp": "2026-05-18T01:00:00"
}
```

에러 응답도 같은 형식을 사용하며, `success: false`, `code`, `message`, `data: null` 형태로 내려갑니다.
아래 예시는 핵심 `data` 페이로드 위주로 작성했습니다. 실제 REST 응답에는 `code`, `message`, `timestamp`도 함께 포함됩니다.

## 세션 상태

```
READY        세션 생성 완료, 면접 시작 전
PREPARING    시작 요청 완료, 초기 질문 생성 중
IN_PROGRESS  초기 질문 생성 완료, 면접 진행 중
PAUSED       일시정지
ENDED        종료
```

일반적인 진행 흐름:

```
POST /v1/sessions
-> READY

WebSocket 연결 및 topic 구독

POST /v1/sessions/{sessionId}/start
-> PREPARING
-> WebSocket INITIAL_QUESTIONS_READY 수신
-> IN_PROGRESS

SEND /app/session.answer
-> WebSocket NEXT_QUESTION 수신

PATCH /v1/sessions/{sessionId}/status
-> PAUSED / IN_PROGRESS / ENDED
```

## REST API

### 세션 생성

```
POST /api/v1/sessions
Authorization: Bearer {accessToken}
```

응답: `201 Created`

```json
{
  "success": true,
  "data": {
    "sessionId": 123,
    "date": "2026-05-18T01:30:00",
    "sessionState": "READY"
  }
}
```

### 면접 시작

면접 설정을 저장하고, 세션 상태를 `PREPARING`으로 변경한 뒤, 초기 질문 생성을 비동기로 시작합니다.

```
POST /api/v1/sessions/{sessionId}/start
Authorization: Bearer {accessToken}
Content-Type: application/json
```

요청:

```json
{
  "category": "BACKEND",
  "interviewType": "TECH",
  "difficulty": "NORMAL",
  "questionCount": 5,
  "timePerQuestion": 60,
  "resumeContent": "Spring Boot and Redis project experience."
}
```

검증 조건:

- `category`: 필수
- `interviewType`: 필수
- `difficulty`: 필수
- `questionCount`: 필수, 최소 `1`
- `timePerQuestion`: 필수, 최소 `30`
- `resumeContent`: 선택

응답: `202 Accepted`

```json
{
  "success": true,
  "data": {
    "settingId": 10
  }
}
```

이 응답을 받은 뒤에는 WebSocket으로 `INITIAL_QUESTIONS_READY` 이벤트가 도착할 때까지 면접 화면을 로딩 상태로 유지하면 됩니다.

### 세션 상태 조회

```
GET /api/v1/sessions/{sessionId}
Authorization: Bearer {accessToken}
```

응답:

```json
{
  "success": true,
  "data": {
    "sessionState": "IN_PROGRESS"
  }
}
```

### 세션 상태 변경

일시정지, 재개, 종료에 사용합니다.

```
PATCH /api/v1/sessions/{sessionId}/status
Authorization: Bearer {accessToken}
Content-Type: application/json
```

요청:

```json
{
  "status": "PAUSED"
}
```

허용 값:

```
PAUSED
IN_PROGRESS
ENDED
```

`READY`, `PREPARING`은 이 API로 직접 변경할 수 없습니다.

응답:

```json
{
  "success": true,
  "data": {
    "Result": "SUCCESS"
  }
}
```

### Presigned URL 발급

```
POST /api/v1/sessions/{sessionId}/presigned
Authorization: Bearer {accessToken}
Content-Type: application/json
```

요청:

```json
{
  "fileType": "mp4"
}
```

응답:

```json
{
  "success": true,
  "data": {
    "presignedUrl": "https://..."
  }
}
```

### 영상 URL 저장

현재는 `type: "video"`만 허용합니다.

```
POST /api/v1/sessions/{sessionId}/save
Authorization: Bearer {accessToken}
Content-Type: application/json
```

요청:

```json
{
  "type": "video",
  "contentUrl": "https://..."
}
```

응답:

```json
{
  "success": true,
  "data": {
    "Result": "SUCCESS"
  }
}
```

### 면접 설정 조회

```
GET /api/v1/preparation/settings/{sessionId}
Authorization: Bearer {accessToken}
```

응답:

```json
{
  "success": true,
  "data": {
    "settingId": 10,
    "category": "BACKEND",
    "interviewType": "TECH",
    "difficulty": "NORMAL",
    "questionCount": 5,
    "timePerQuestion": 60,
    "resumeContent": "Spring Boot and Redis project experience."
  }
}
```

### 면접 결과 조회

```
GET /api/v1/interviews/{sessionId}/result
Authorization: Bearer {accessToken}
```

응답:

```json
{
  "success": true,
  "data": {
    "sessionId": 123,
    "videoUrl": "https://...",
    "createTime": "2026-05-18T01:00:00",
    "emotionGraph": "{}",
    "details": [
      {
        "qId": 1,
        "question": "첫 질문입니다.",
        "answer": "답변입니다.",
        "emotionResult": "NEUTRAL",
        "responseTimeSeconds": 15
      }
    ]
  }
}
```

### 면접 히스토리 조회

```
GET /api/v1/interviews/history
Authorization: Bearer {accessToken}
```

응답:

```json
{
  "success": true,
  "data": {
    "sessionIds": [123, 124]
  }
}
```

### 면접 리포트 조회

```
GET /api/v1/interviews/{sessionId}/report
Authorization: Bearer {accessToken}
```

리포트가 아직 준비되지 않았다면 `REPORT_NOT_READY` 에러가 내려올 수 있습니다.

응답:

```json
{
  "success": true,
  "data": {
    "sessionId": 123,
    "videoUrl": "https://...",
    "emotionGraphJson": "{}",
    "totalScore": 85,
    "feedback": "종합 피드백",
    "strengths": "강점",
    "weaknesses": "보완점",
    "aiAnalysisJson": "{}"
  }
}
```

## WebSocket API

연결 경로:

```
/api/ws-interview
```

면접 시작/답변 이벤트를 보내기 전에 아래 topic을 구독합니다.

```
/topic/session/{sessionId}/question
/topic/session/{sessionId}/error
/topic/realtime/{sessionId}
/topic/realtime/{sessionId}/errors
/topic/realtime/{sessionId}/completed
```

### 초기 질문 생성 완료

구독:

```
/topic/session/{sessionId}/question
```

서버 이벤트:

```json
{
  "type": "INITIAL_QUESTIONS_READY",
  "firstQuestion": "자기소개를 해주세요.",
  "questions": [
    {
      "index": 1,
      "question": "자기소개를 해주세요.",
      "tooltip": "",
      "category": "BACKEND",
      "intent": "",
      "answerKeywords": ["Spring", "Redis"]
    }
  ]
}
```

프론트 처리:

- 로딩 상태를 해제합니다.
- `firstQuestion`을 현재 질문으로 표시합니다.
- 면접 진행 상태로 전환합니다.

### 답변 제출

전송:

```
/app/session.answer
```

페이로드:

```json
{
  "sessionId": 123,
  "answer": "Redis를 활용해 세션 상태와 질문 생성 락을 관리했습니다.",
  "emotionResult": "NEUTRAL",
  "responseTimeSeconds": 15
}
```

검증 조건:

- `sessionId`: 필수
- `answer`: 필수
- `emotionResult`: 선택
- `responseTimeSeconds`: 선택

다음 질문은 HTTP 응답이 아니라 WebSocket `NEXT_QUESTION` 이벤트로 비동기 수신합니다.

### 다음 질문 수신

구독:

```
/topic/session/{sessionId}/question
```

서버 이벤트:

```json
{
  "type": "NEXT_QUESTION",
  "question": "Redis를 세션 상태 저장소로 선택한 이유는 무엇인가요?"
}
```

### 질문 생성 에러/경고

구독:

```
/topic/session/{sessionId}/error
```

질문 생성 중복 요청 경고 예시:

```json
{
  "type": "PROCESSING_WARNING",
  "message": "현재 AI가 답변을 분석하여 질문을 생성 중입니다. 잠시만 기다려주세요."
}
```

API 응답 형식의 에러 예시:

```json
{
  "success": false,
  "code": "AI_RESPONSE_FAILED",
  "message": "AI 응답 생성 중 오류가 발생했습니다.",
  "data": null,
  "timestamp": "2026-05-18T01:00:00"
}
```

### 실시간 표정 프레임 전송

전송:

```
/app/realtime.frames
```

페이로드:

```json
{
  "sessionId": "123",
  "userId": "1",
  "tensorShape": [1, 3, 2, 2],
  "features": [0.0, 0.0, 0.0],
  "timestamp": 1716000000000,
  "faceDetected": true,
  "bbox": {
    "x1": 10,
    "y1": 20,
    "x2": 100,
    "y2": 120
  }
}
```

검증 조건:

- `sessionId`: 필수 문자열
- `tensorShape`: 필수, 비어 있지 않은 배열
- `features`: 필수, 비어 있지 않은 배열
- `timestamp`: 필수, `0` 이상
- `bbox`: 선택

### 실시간 표정 분석 결과 수신

구독:

```
/topic/realtime/{sessionId}
```

서버 이벤트:

```json
{
  "success": true,
  "data": {
    "sessionId": "123",
    "userId": "1",
    "timestamp": 1716000000000,
    "label": "NEUTRAL",
    "confidence": 0.93,
    "feedback": "안정적인 표정입니다.",
    "faceDetected": true,
    "bbox": {
      "x1": 10,
      "y1": 20,
      "x2": 100,
      "y2": 120
    }
  }
}
```

### 실시간 스트림 종료

전송:

```
/app/realtime.end
```

페이로드:

```json
{
  "sessionId": "123"
}
```

구독:

```
/topic/realtime/{sessionId}/completed
```

서버 이벤트:

```json
{
  "success": true,
  "data": {
    "message": "Realtime session completed."
  }
}
```

실시간 분석 에러는 아래 topic으로 발행됩니다.

```
/topic/realtime/{sessionId}/errors
```

## 프론트 구현 순서

1. REST로 세션을 생성합니다.
2. WebSocket을 연결하고 세션 관련 topic을 구독합니다.
3. `POST /v1/sessions/{sessionId}/start`를 호출합니다.
4. `INITIAL_QUESTIONS_READY`가 도착할 때까지 로딩 상태를 유지합니다.
5. 답변은 `/app/session.answer`로 전송합니다.
6. `NEXT_QUESTION`이 도착하면 다음 질문을 화면에 표시합니다.
7. 실시간 표정 프레임은 `/app/realtime.frames`로 지속 전송합니다.
8. 일시정지/재개/종료는 `PATCH /v1/sessions/{sessionId}/status`를 사용합니다.
9. 면접 영상은 presigned URL로 업로드한 뒤 `/save` API로 저장합니다.
10. `ENDED` 이후 결과와 리포트를 조회합니다.