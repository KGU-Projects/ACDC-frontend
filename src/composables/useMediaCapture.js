import { ref } from 'vue'

const describeError = (error) => {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'NotSupportedError':
    case 'SecurityError':
      return '카메라와 마이크 사용이 허용되지 않았습니다. 브라우저 주소창의 권한 설정에서 허용한 뒤 다시 시도해주세요.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return '카메라 또는 마이크 장치를 찾을 수 없습니다. 장치 연결을 확인한 뒤 다시 시도해주세요.'
    case 'NotReadableError':
    case 'AbortError':
      return '카메라 또는 마이크를 다른 프로그램이 사용 중입니다. 해당 프로그램을 종료한 뒤 다시 시도해주세요.'
    default:
      return `카메라와 마이크를 시작하지 못했습니다. (${error?.message || error?.name || '알 수 없는 오류'})`
  }
}

/** 카메라+마이크 스트림을 얻고 정리한다. 하나라도 실패하면 error에 한국어 사유를 담는다. */
export function useMediaCapture() {
  const stream = ref(null)
  const error = ref('')
  const requesting = ref(false)

  const start = async () => {
    if (requesting.value) return null // 이미 요청 중이면 getUserMedia를 겹쳐 부르지 않는다(스트림 누수 방지)
    error.value = ''
    if (!navigator.mediaDevices?.getUserMedia) {
      error.value = '이 브라우저(또는 접속 환경)에서는 카메라와 마이크를 사용할 수 없습니다. HTTPS 또는 localhost에서 Chrome으로 접속해주세요.'
      return null
    }
    requesting.value = true
    try {
      stop()
      stream.value = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      })
      return stream.value
    } catch (e) {
      error.value = describeError(e)
      return null
    } finally {
      requesting.value = false
    }
  }

  const stop = () => {
    stream.value?.getTracks().forEach((track) => track.stop())
    stream.value = null
  }

  return { stream, error, requesting, start, stop }
}
