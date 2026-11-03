import { reactive, watch } from 'vue';
import { apiGet } from '../api/client';

// 시나리오 id별 { competencies, prepMinutes }. 실패하면 null(화면은 회색 대시).
const cache = reactive({});
const requested = new Set();

const load = async (id) => {
  if (requested.has(id)) return;
  requested.add(id);
  try {
    const body = await apiGet(`/api/scenarios/${id}`);
    const names = Array.isArray(body?.competencies) ? body.competencies.map((c) => c?.name).filter(Boolean) : null;
    const prep = Number(body?.prepMinutes);
    cache[id] = {
      competencies: names && names.length ? names : null,
      prepMinutes: Number.isFinite(prep) && prep > 0 ? prep : null
    };
  } catch {
    // 일시 오류로 영구히 비지 않도록, 다음 호출에서 다시 시도할 수 있게 한다.
    requested.delete(id);
    cache[id] = { competencies: null, prepMinutes: null };
  }
};

export function useScenarioCards(scenarios) {
  watch(
    scenarios,
    (list) => {
      (list || []).forEach((s) => load(s.id));
    },
    { immediate: true, deep: false }
  );
  return (id) => cache[id] || { competencies: null, prepMinutes: null };
}
