FROM node:22-alpine AS build
WORKDIR /app

# 의존성 레이어를 먼저 만들어 소스만 고쳤을 때 npm install을 다시 하지 않게 한다.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Vite는 빌드 시점에 환경변수를 번들에 박는다. 브라우저가 접근하는 백엔드 주소를 build arg로 받는다.
ARG VITE_BACKEND_BASE_URL
ENV VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL
# 표정 분석(MediaPipe) 자산 주소. 비워 두면 코드의 기본 CDN 값을 쓴다.
ARG VITE_MEDIAPIPE_WASM_URL
ARG VITE_FACE_LANDMARKER_MODEL_URL
ENV VITE_MEDIAPIPE_WASM_URL=$VITE_MEDIAPIPE_WASM_URL
ENV VITE_FACE_LANDMARKER_MODEL_URL=$VITE_FACE_LANDMARKER_MODEL_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
