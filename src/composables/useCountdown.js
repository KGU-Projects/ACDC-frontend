import { computed, onBeforeUnmount, ref } from 'vue'

/**
 * 남은 시간(초)을 1초마다 줄인다. start(totalSeconds, onExpire)로 시작하고, 0이 되면 onExpire를 한 번 부른다.
 */
export const useCountdown = () => {
  const remaining = ref(0)
  const running = ref(false)
  let timer = null

  const stop = () => {
    if (timer) clearInterval(timer)
    timer = null
    running.value = false
  }

  const start = (totalSeconds, onExpire) => {
    stop()
    remaining.value = Math.max(0, Math.floor(totalSeconds))
    if (remaining.value === 0) {
      onExpire?.()
      return
    }
    running.value = true
    timer = setInterval(() => {
      remaining.value -= 1
      if (remaining.value <= 0) {
        remaining.value = 0
        stop()
        onExpire?.()
      }
    }, 1000)
  }

  const label = computed(() => {
    const m = String(Math.floor(remaining.value / 60)).padStart(2, '0')
    const s = String(remaining.value % 60).padStart(2, '0')
    return `${m}:${s}`
  })

  onBeforeUnmount(stop)

  return { remaining, running, label, start, stop }
}

/** 세션의 startedAt/제한시간으로 남은 초를 계산한다. 아직 시작 전이면 전체 시간. */
export const remainingSeconds = (session) => {
  const total = (session.timeLimitMinutes || 0) * 60
  if (!session.startedAt) return total
  const elapsed = (Date.now() - new Date(session.startedAt).getTime()) / 1000
  return Math.max(0, Math.floor(total - elapsed))
}
